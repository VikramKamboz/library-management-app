# Library Management System — Design Document (Batch 1)
**Stories covered:** KAN-5, KAN-29, KAN-30

---

## 1. ARCHITECTURE DOCUMENT

### 1.1 Overview
Batch 1 introduces server-side data integrity and validation improvements to the existing Node.js + Express + TypeScript backend, backed by SQLite (`node:sqlite`). No new services, tables (beyond one new column), or infrastructure are introduced. The changes are additive and localized to:

- The `loans` table (new `due_date` column) — KAN-5
- The `books` creation flow (ISBN duplicate check) — KAN-29
- The `members` creation flow (email format validation) — KAN-30

### 1.2 New Components/Modules
Introduce a small (plain) Validation Layer:

- `src/validators.ts` (new file)
  - `isValidEmail(email: string): boolean`
  - `isDuplicateIsbn(isbn: string): boolean` (or an async DB-check helper)
  - `calculateDueDate(issuedDate: string, loanPeriodDays: number): string`

This is a utility module (no new runtime dependencies) called from the existing route handlers for `/api/books`, `/api/members`, and `/api/loans/issue`.

### 1.3 Schema Migration Approach
SQLite does not support adding constraints via `ALTER TABLE`. Therefore:

- New columns are added via `ALTER TABLE ... ADD COLUMN`
- Uniqueness is enforced via `CREATE UNIQUE INDEX`

**Migration caution:** If any duplicate ISBNs already exist in `books`, creating the unique index will fail. The migration must check for/clean up duplicates first (requires developer confirmation on data state).

### 1.4 Architecture Diagram

```mermaid
flowchart TD
    Client[Browser - public/index.html
    + src/client/app.ts]

    subgraph Backend[Node.js + Express + TypeScript - port 5050]
        Routes[Existing API Routes
        /api/books
        /api/members
        /api/loans/issue
        /api/loans/return
        /api/loans]

        Validators[New: Validation Layer
        validators.ts
        - isValidEmail
        - isDuplicateIsbn
        - calculateDueDate]

        Routes --> Validators
        Validators --> Routes
    end

    DB[(SQLite DB
    books / members / loans)]

    Client -->|HTTP JSON| Routes
    Routes -->|queries| DB
    Validators -.->|reads for uniqueness check| DB
