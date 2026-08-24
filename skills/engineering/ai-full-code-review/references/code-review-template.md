# Code Review: [Feature / Branch / PR Title]

> **Project:** [[engineering/<project>/index|<project>]]

> Focus exclusively on backend risks that could cause incidents, data inconsistency, vulnerabilities, scalability issues, or operational failures. Do not include cosmetic or stylistic comments.

## Overview

[1-3 lines: what was reviewed and the goal of the change]

## Summary

- **Risk level**: Low / Medium / High / Critical
- **Findings**: X critical, Y high-impact
- **Production-ready**: Yes / No / Conditional

## 🚨 Critical Findings

[Issues that must be fixed before release. Omit this section if none.]

### Finding 1: [Short Title]

- **🚨 Issue**: [Concrete problem]
- **⚠️ Why it matters**: [Production / security / data / scale impact]
- **🧪 Failure scenario**: [Realistic incident example]
- **✅ Fix**: [Clear mitigation; cite established patterns when applicable]
- **Files**: `path/to/file`

## ⚠️ High-Impact Findings

[Important issues that do not block the release. Omit if none.]

### Finding 1: [Short Title]

- **🚨 Issue**: [Concrete problem]
- **⚠️ Why it matters**: [Why this is relevant]
- **🧪 Failure scenario**: [How it could happen in practice]
- **✅ Fix**: [Practical correction]
- **Files**: `path/to/file`

## Final Recommendation

- ✅ **Approved** — No relevant risks identified.
- 🟡 **Approved with follow-ups** — Issues exist but do not block release.
- 🟠 **Changes requested** — Important risks should be fixed before release.
- 🔴 **Blocked** — Critical issues must be resolved before release.

## Action Items

- [ ] [Concrete fix]
- [ ] [Concrete fix]
