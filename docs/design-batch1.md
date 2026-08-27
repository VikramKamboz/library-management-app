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

- `src/server/validators.ts` (new file, exact path requires developer confirmation based on current project structure)
  - `isValidEmail(email: string): boolean`
  - item `isDuplicateIsbn(isbn: string): boolean` (or an async DB-check helper)
  - `calculateDueDate(issuedDate: string, loanPeriodDays: number): string`

This is a utility module (no new runtime dependencies) called from the existing route handlers for `/api/books`, `/api/members`, and `/api/loans/issue`.


### 1.3 Schema Migration Approach
SQLite does not support adding constraints via `ALTER TABLE`. Therefore:

- New columns are added via `ALTER TABLE ... ADD COLUMN`
]
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

    DB[((SQLite DB
    books / members / loans))]

    Client -->|HTTP JSON| Routes
    Routes -->|queries| DB
    Validators -.->|reads for uniqueness check| DB
```

---

## 2. HIGH-LEVEL DESIGN (HLD)


### KAN-5: Set due date when issuing a book
- **Table affected:** `loans` — new column `due_date`.
- **Endpoint affected:** `POST /api/loans/issue` — computes and stores `due_date` at issue time. `GET /api/loans` – now returns `due_date`.
- **UI affected:** Issue tab shows/confirms due date after issuing. Loans list display now shows `due_date` per loan.
 - **Data flow:** User submits issue request (book_id, member_id) → server validates book availability → server computes `due_date`=`issued_date` + fixed loan period (default 14 days — requires developer/business confirmation) — inserts loan with `due_date` — returns due date to UI.


### KAN-29: Prevent duplicate ISBNs when adding a book
- **Table affected:** `books` - new unique index on `isbn`.
 - **Endpoint affected:** `POST /api/books` — pre-check duplicate and/or handle DB unique violation as 409.
- **UI affected:** Books tab – show user-friendly error if ISBN already exists.
 - **Data flow:** User submits new book – server checks existing `ISBN` — if found return 409 — UI displays error; else insert.



### KAN-30: Validate member email format
- **Table affected:** none (app-level validation only).
 - **Endpoint affected:** `POST /api/members` – add email regex check, return 400 on invalid.
 - **EI (US)** Members tab — shows invalid email error.
- **Data flow:** User submits new member — server validates email → if invalid return 400 — UI shows message; else insert.

---

## 3. LOW-LEVEL DESIGN (LLD)


### 3.1 KAN-5 — Set due date when issuing a book

**Schema change:**

```sql
ALTER TABLE loans ADD COLUMN due_date TEXT;
```

- `due_date` stored as ISO 8601 date string (`YYYY-MM-DD`), consistent with existing date storage (assumed — requires developer confirmation of existing date format)
- Loan period: default 14 days (requires developer/business confirmation)

**Endpoint: POST /api/loans/issue**

- Request body:
  ```json
  {
    "book_id": 1,
    "member_id": 2
  }
  ```
- Response body (extended):
  ```json
  {
    "id": 10,
    "book_id": 1,
    "member_id": 2,
    "issued_date": "2025-01-10",
    "due_date": "2025-01-24",
    "returned_date": null
  }
  ```
- Logic: validate book exists & available — compute `issued_date` in server — compute `due_date`=`issued_date` + 14 — insert loan with due_date — return record.

**Endpoint: GET /api/loans**
 - Response now includes `due_date` per record.

**Helper:**

```typescript
function calculateDueDate(issuedDate: string, loanPeriodDays: number = 14): string {
  const date = new Date(issuedDate);
  date.setDate(date.getDate() + loanPeriodDays);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
```


### 3.2 KAN-29 — Prevent duplicate ISBNs when adding a book

**Schema change:**

```sql
CREATE UNIQU INDEX idx_books_isbn_unique ON books(isbn);
```

- Pre-migration duplicate cleanup may be required (requires developer confirmation of current data)

**Endpoint: POST /api/books**

- On duplicate ISBN, return HTTP 409 Conflict:
  ```json
  {
    "error": "A book with this ISBN already exists."
  }
  ```

- Depence in depth: catch unique-index violation from SQLite and map to same 409 error.

- Validation query:
  ```typescript
  const existing = db.prepare('SELECT id FROM books WHERE isbn = ?').get(isbn);
  ```
- ISBN normalization (e.g. trim, strip hyphens) requires developer confirmation.


### 3.3 KAN-30 — Validate member email format

- **Schema change:** none.

**Endpoint: POST /api/members**

- On invalid email, return HTTP 400 Bad Request:
  ```json
  {
    "error": "Invalid email format."
  }
  ```

- Regex (pragmatic basic check):
  ```typescript
  const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\.[^\s@]+$/;
  ```
- Not full RFC 5322 compliance (requires developer/business confirmation if stricter validation is desired).


---

## 4. WIREFRAMES


### 4.1 Issue Tab — show due date (KAN-5)

