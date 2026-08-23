# Prometheus metrics

## Measure the decorated use-case boundary

Measure use-case duration and outcome once at the decorated public boundary.
Place the shared technical capability under
`internal/shared/metrics/use_case_metrics.go` and its Prometheus adapter under
`internal/shared/metrics/prometheus_use_case_metrics.go`. Put the generic
decorator in `internal/shared/metrics/use_case_metrics_decorator.go`. The
adapter is shared because multiple modules use it. Module packages do not
create competing metric registries or duplicate generic `Execute`
instrumentation.

Name the histogram `project_use_case_duration_seconds` and the counter
`project_use_case_outcomes_total`. Give both the `module`, `operation`, and
`outcome` labels. Use stable operation names such as `order_confirm`; use
`success` and `error` for the generic outcomes. Add a domain metric only when
it answers an operational question that duration and outcome cannot answer.

```go
package metrics

import (
	"fmt"
	"time"

	"github.com/prometheus/client_golang/prometheus"
)

type UseCaseMetrics interface {
	Observe(module, operation, outcome string, duration time.Duration)
}

type PrometheusUseCaseMetrics struct {
	duration *prometheus.HistogramVec
	outcomes *prometheus.CounterVec
}

var _ UseCaseMetrics = (*PrometheusUseCaseMetrics)(nil)

func NewPrometheusUseCaseMetrics(
	registerer prometheus.Registerer,
) (*PrometheusUseCaseMetrics, error) {
	duration := prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Name: "project_use_case_duration_seconds",
		Help: "Duration of public use-case execution.",
	}, []string{"module", "operation", "outcome"})
	outcomes := prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "project_use_case_outcomes_total",
		Help: "Count of public use-case execution outcomes.",
	}, []string{"module", "operation", "outcome"})

	if err := registerer.Register(duration); err != nil {
		return nil, fmt.Errorf("register use-case duration metric: %w", err)
	}
	if err := registerer.Register(outcomes); err != nil {
		return nil, fmt.Errorf("register use-case outcome metric: %w", err)
	}
	return &PrometheusUseCaseMetrics{duration: duration, outcomes: outcomes}, nil
}

func (m *PrometheusUseCaseMetrics) Observe(
	module string,
	operation string,
	outcome string,
	duration time.Duration,
) {
	m.duration.WithLabelValues(module, operation, outcome).Observe(duration.Seconds())
	m.outcomes.WithLabelValues(module, operation, outcome).Inc()
}
```

Keep the adapter file order as concrete type, interface assertion, pointer
constructor, then methods. Registration returns its technical error from the
constructor. Fx propagates it to the process boundary, which logs it. Metrics
have no module error or locale entry.

## Wire one observer and decorate once

Provide the shared adapter in `internal/shared/fx.go`. The project use-case
decorator receives the interface and records duration after `next.Execute`
returns. It uses the caller context unchanged and returns the original output
and error. Keep tracing in the OTEL decorator and business logging in the use
case or I/O adapter.

```go
// internal/shared/fx.go
package shared

import (
	"example.com/project/internal/shared/metrics"
	"go.uber.org/fx"
)

var Module = fx.Module(
	"shared",
	fx.Provide(
		fx.Annotate(
			metrics.NewPrometheusUseCaseMetrics,
			fx.As(new(metrics.UseCaseMetrics)),
		),
	),
)
```

Keep the decorator in
`internal/shared/metrics/use_case_metrics_decorator.go`:

```go
package metrics

import (
	"context"
	"time"

	"github.com/cristiano-pacheco/bricks/pkg/ucdecorator"
)

type UseCaseMetricsDecorator[I, O any] struct {
	next      ucdecorator.UseCase[I, O]
	metrics   UseCaseMetrics
	module    string
	operation string
}

func NewUseCaseMetricsDecorator[I, O any](
	next ucdecorator.UseCase[I, O],
	metrics UseCaseMetrics,
	module string,
	operation string,
) *UseCaseMetricsDecorator[I, O] {
	return &UseCaseMetricsDecorator[I, O]{
		next:      next,
		metrics:   metrics,
		module:    module,
		operation: operation,
	}
}

func (d *UseCaseMetricsDecorator[I, O]) Execute(
	ctx context.Context,
	input I,
) (O, error) {
	started := time.Now()
	output, err := d.next.Execute(ctx, input)
	outcome := "success"
	if err != nil {
		outcome = "error"
	}
	d.metrics.Observe(d.module, d.operation, outcome, time.Since(started))
	return output, err
}
```

Use the module's existing `provideDecoratedUseCases` path to install this
decorator. Do not add a second direct metric call to a use case, handler,
repository, or provider. A domain span or domain-specific metric still has a
single responsible owner.

## Test registration and outcomes

Add `internal/shared/metrics/prometheus_use_case_metrics_test.go`. Construct a
fresh `prometheus.NewRegistry`, call the pointer constructor, require no
registration error, then gather and assert one sample for each expected label
set. Test the decorator's success and error paths with a small fake
`UseCaseMetrics`; assert it receives the stable module, operation, outcome,
and a nonnegative duration. Run the composed Fx graph in an integration test
when the shared module or decorator registration changes.

## Check before finishing

- One shared adapter registers each metric name once.
- Every public use-case execution records one duration and one outcome.
- Metric labels are stable, bounded, and free of identifiers, messages, or raw
  errors.
- Constructor, interface assertion, Fx binding, caller context, logging, error
  handling, and tests match the shared capability's responsibility.
