Global rules

### Cursor Rules for Our Go Codebase

> **Goal:** Ship Go code that is **simple**, **testable**, **maintainable**, and **secure**—without bloated comments or cryptic names.

---

#### 1. Architecture & Design

* **1.1 One job per unit.** A package models a single business concept; a file groups closely related types or functions; a function does one thing.
* **1.2 Hide internals.** Export only what other packages truly need—keep the public API tiny.

---

#### 2. Naming & Comments

* **2.1 Spell it out.** Never abbreviate variable, function, or package names (use `connectionStatus`, not `connStat`).
* **2.2 Value-add comments only.** Eliminate noise like `// DoSomething … DoSomething()`.
* **2.3 Annotate intent.** Give complex logic or non-obvious choices a short rationale (e.g., `// guard against wrap-around attack`).

---

#### 3. Security

* **3.1 Input first.** Validate and sanitize all external data (API, CLI, env).
* **3.2 Least privilege.** Grant services and database users only the permissions they need.
* **3.3 Parameterized queries only.** Never build SQL with string concatenation.
* **3.4 Constant-time secrets.** Compare passwords, HMACs, and tokens with `subtle.ConstantTimeCompare`.
* **3.5 Keep dependencies patched.** Run `go list -u -m -all` in CI and update promptly.

### 4. Golang General Rules
- Avoid magic numbers. Use named constants for durations, sizes, limits.
- Name shows intent. Prefer readHeaderTimeout over 10 * time.Second.
- Group related constants. Use const (...) for clarity.

---

Keep it simple, explicit, and safe—your future self (and team) will thank you.

