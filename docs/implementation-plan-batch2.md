# Implementation Plan — Batch 2

## Overview

This document outlines the implementation plan for **Batch 2** of the Library Management System enhancement project. This batch focuses on **advanced circulation features** and **search/filter capabilities**, building on the foundational due-date tracking delivered in Batch .

- **Project Key:** KAN
- **Batch 2 Stories:** 5 stories (2 circulation + 3 search/filter)
- **Epics Covered:** KAN-1 (Circulation Management), KAN-2 (Search, Filter, Quick Find)
- **Baseline Application:** Node.js + Express + TypeScript backend, SQLite (`node:sqlite`), plain HTML/CSS/vanilla TypeScript frontend, port 5050
- **Database Schema:** `books`, `members`, `loans` tables

---

## Batch 2 Stories

### Circulation Management (KAN-1)

1. **KAN-6 — Renew an issued book with rules**
   - Allow members to renew a borrowed book (extend due date)
   - Enforce business rules: max renewals, no renewal if overdue, etc.
   - Update `loans` table with renewal count and new due date

2. **KAN-7 — View overdue loans list**
   - Display a list of all overdue loans (due date < today and return date is null)
   - Show book title, member name, due date, days overdue
   - Sort by days overdue (most overdue first)

### Search, Filter, Quick Find (KAN-2)

3. **KAN-17 — Search books by title/author/ISBN**
   - Implement search functionality for books
   - Support partial matching (LIKE queries) across title, author, ISBN fields
   - Display search results with availability status

4. **KAN-18 — Filter/sort books by availability and author**
   - Add filtering options: available/issued, by author
   - Add sorting options: title (A-Z), author (A-Z), ISBN
   - Combine with search functionality from KAN-17

5. **KAN-19 — Search members by name or email**
   - Implement search functionality for members
   - Support partial matching across name and email fields
   - Display search results with active loan count

---

## Implementation Sequence

### Phase 1: Circulation Enhancements (KAN-6, KAN-7)

**Rationale:** Complete the circulation management feature set before moving to search/filter. These stories build directly on the due-date tracking from Batch 1 (KAN-5) and deliver high-value operational features.

1. **KAN-6 — Renew an issued book with rules**
   - **Dependency:** Requires KAN-5 (due-date tracking) to be completed first
   - **Database changes:** Add `renewal_count` field to `loans` table (requires confirmation from Design Assistant)
   - **Backend:** NEW PUT endpoint `/api/loans/:id/renew` with business rule validation
   - **Frontend:** Add "Renew" button on active loans view, renewal confirmation dialog
   - **Business rules:** Max renewals (e.g., 3), no renewal if overdue, extend due date by N days

2. **KAN-7 — View overdue loans list**
   - **Dependency:** Requires KAN-5 (due-date tracking) to be completed first
   - **Database changes:** None (uses existing `loans` table with `due_date` and `returned_date`)
   - **Backend:** NEW GET endpoint `/api/loans/overdue` with JOINs to `books` and `members`
   - **Frontend:** NEW page `overdue-loans.html` with table display, calculate days overdue
   - **Query logic:** `WHERE due_date < CURRENT_DATE AND returned_date IS NULL`

**Phase 1 Deliverable:** Complete circulation management feature set (issue, return, due dates, renewals, overdue tracking).

---

### Phase 2: Search & Filter Foundation (KAN-17, KAN-18)

**Rationale:** Implement book search and filtering together as they share the same UI components and backend query logic. This delivers a complete book discovery experience.

3. **KAN-17 — Search books by title/author/ISBN**
   - **Dependency:** None (independent feature)
   - **Database changes:** None (uses existing `books` table)
   - **Backend:** MODIFY existing GET `/api/books` to accept optional `search` query parameter
   - **Frontend:** Add search input box on `books.html`, real-time search or "Search" button
   - **Query logic:** `WHERE title LIKE '%search%' OR author LIKE '%search%' OR isbn LIKE '%search%'`

4. **KAN-18 — Filter/sort books by availability and author**
   - **Dependency:** Should be implemented after KAN-17 to combine search + filter + sort in one UI
   - **Database changes:** None (uses existing `books` and `loans` tables)
   - **Backend:** MODIFY GET `/api/books` to accept `filter` and `sort` query parameters
   - **Frontend:** Add filter dropdowns (availability, author) and sort dropdown on `books.html`
   - **Query logic:** JOIN with `loans` to determine availability, add `ORDER BY` clause

**Phase 2 Deliverable:** Complete book search, filter, and sort functionality on a single enhanced books page.

---

### Phase 3: Member Search (KAN-19)

**Rationale:** Implement member search independently after book search is complete. This allows reuse of search UI patterns and backend query logic.

5. **KAN-19 — Search members by name or email**
   - **Dependency:** None (independent feature), but benefits from KAN-17 UI patterns
   - **Database changes:** None (uses existing `members` table)
   - **Backend:** MODIFY existing GET `/api/members` to accept optional `search` query parameter
   - **Frontend:** Add search input box on `members.html`, display active loan count
   - **Query logic:** `WHERE name LIKE '%search%' OR email LIKE '%search%'`

**Phase 3 Deliverable:** Complete member search functionality.

---

## Dependency Summary

| Story | Depends On | Reason |
|------|-----------|-------|
| KAN-6 | KAN-5 (Batch 1) | Renewal requires due-date tracking to exist first |
| KAN-7 | KAN-5 (Batch 1) | Overdue detection requires due-date tracking to exist first |
| KAN-18 | KAN-17 | Filter/sort should be combined with search in one UI |
| KAN-17 | None | Independent feature |
| KAN-19 | None (but benefits from KAN-17 UI patterns) | Independent feature, can reuse search patterns |

---

## Implementation Order (Recommended)

1. **KAN-6** (Renew book) — Completes circulation feature set
2. **KAN-7** (Overdue list) — Completes circulation feature set
3. **KAN-17** (Search books) ℔ Foundation for book discovery
4. **KAN-18** (Filter/sort books) — Enhances book discovery
5. **KAN-19** (Search members) — Independent member feature

---

## Technical Considerations

### Database Schema Changes

- **KAN-6:** Requires adding `renewal_count` field to `loans` table (requires confirmation from Design Assistant)
- **All other stories:** No schema changes required

### Backend API Changes

- **NEW endpoints:**
  - `PUT /api/loans/:id/renew` (KAN-6)
  - `GET /api/loans/overdue` (KAN-7)

- **MODIFIED endpoints:**
  - `GET /api/books` (add `search`, `filter`, `sort` query parameters) (KAN-17, KAN-18)
  - `GET /api/members` (add `search` query parameter) (KAN-19)

### Frontend Changes

- **NEW pages:**
  - `overdue-loans.html` (KAN-7)

- **MODIFIED pages:**
  - `books.html` (add search input, filter dropdowns, sort dropdown) (KAN-17, KAN-18)
  - `members.html` (add search input) (KAN-19)
  - Active loans view (add "Renew" button) (KAN-6)

### Query Performance

- **Search queries (KAN-17, KAN-19):** Consider adding indexes on `books.title`, `books.author`, `members.name`, `members.email` if search performance is slow (requires confirmation from Design Assistant)
- **Overdue query (KAN-7):** Consider adding index on `loans.due_date` if overdue list performance is slow (requires confirmation from Design Assistant)

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|---------|
| Renewal business rules not clearly defined (KAN-6) | Medium | Confirm rules with stakeholders before implementation (max renewals, extension days, etc.) |
| Search performance on large datasets (KAN-17, KAN-19) | Low | Test with realistic data volumes; add indexes if needed |
| Filter/sort UI complexity (KAN-18) | Low | Keep UI simple with clear dropdowns; reuse existing UI patterns |
| Overdue calculation logic (KAN-7) | Low | Use standard date calculations; test with various date scenarios |

---

## Definition of Done (Batch 2)

Each story is considered complete when:

1. **Backend:**
   - All API endpoints implemented and tested
   - Business rules enforced (e.g., renewal limits, overdue detection)
   - Error handling for invalid inputs

2. **Frontend:**
   - UI components implemented and styled
   - User interactions work as expected (search, filter, sort, renew, etc.)
   - Error messages displayed to users

3. **Database:**
   - Schema changes applied (if any)
   - Migration scripts created (if applicable)

4. **Testing:**
   - Manual testing of all features
   - Edge cases tested (empty search, no results, max renewals, etc.)
   - Integration testing with existing features

5. **Documentation:**
   - API endpoints documented
   - User guide updated (new features)
   - Code comments added for complex logic

---

## Next Steps

1. **Design Assistant:** Confirm database schema changes for KAN-6 (`renewal_count` field)
2. **Design Assistant:** Define renewal business rules (max renewals, extension days, etc.)
3. **Developer Assistant:** Implement stories in the recommended order
4. **QA Assistant:** Test each story against Definition of Done criteria

---

## Appendix: Story IDs Verification

**Batch 2 Stories (5):**
- KAN-6 ✓
- KAN-7 ✓
- KAN-17 ✓
- KAN-18 ✓
- KAN-19 ✓

**Epics Covered (2):**
- KAN-1 — Circulation Management ✓
- KAN-2 — Search, Filter, Quick Find ✓

**Database Tables (3):**
- `books` ✓
- `members` ✓
- `loans` ✓

**Project Key:** KAN ✓

---

**End of Implementation Plan — Batch 2**