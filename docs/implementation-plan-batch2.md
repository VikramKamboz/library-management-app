# Implementation Plan - Batch 2

## Overview

This document outlines the implementation plan for **Batch 2** of the Library Management System enhancement project. This batch focuses on advanced circulation features and comprehensive search/filter capabilities, building upon the foundational due-date tracking implemented in Batch 1.

- **Project Key**: KAN
- **Batch**: Batch 2 - Advanced Circulation & Search/Filter Capabilities
- **Stories in Scope**: KAN-6, KAN-7, KAN-17, KAN-18, KAN-19
- **Epics Covered**: KAN-1 (Circulation Management), KAN-2 (Search, Filter, Quick Find)

---

## Batch 2 Story Breakdown

### Epic KAN-1: Circulation Management (Continued)

**KAN-6: Renew an issued book with rules**
- **Description**: Allow librarians to renew a loan (extend due date) with business rules (e.g., maximum renewals, no renewal if overdue).
- **Dependencies**: Requires KAN-5 (due-date tracking) to be completed first.
- **Technical Scope**: Backend API endpoint, business rule validation, frontend UI for renewal action.

**KAN-7: View overdue loans list**
- **Description**: Display a list of all overdue loans (where current date > due date and return date is null).
- **Dependencies**: Requires KAN-5 (due-date tracking) to be completed first.
- **Technical Scope**: Backend query logic, frontend view with filtered list.

### Epic KAN-2: Search, Filter, and Quick Find

**KAN-17: Search books by title/author/ISBN**
- **Description**: Implement search functionality for books across multiple fields (title, author, ISBN).
- **Dependencies**: None (independent feature).
- **Technical Scope**: Backend search API with partial matching, frontend search input and results display.

**KAN-18: Filter/sort books by availability and author**
- **Description**: Add filtering and sorting capabilities to the books list (e.g., show only available books, sort by author).
- **Dependencies**: Can be implemented in parallel with KAN-17, but logically complements search functionality.
- **Technical Scope**: Backend query parameters for filtering/sorting, frontend UI controls.

**KAN-19: Search members by name or email**
- **Description**: Implement search functionality for members by name or email.
- **Dependencies**: None (independent feature).
- **Technical Scope**: Backend search API for members, frontend search input and results display.

---

## Implementation Sequence

The recommended implementation sequence for Batch 2 is organized into two sub-phases based on dependencies and logical grouping:

### Phase 2A: Advanced Circulation Features

**Stories**: KAN-6, KAN-7

**Rationale**: These stories extend the circulation management capabilities built in Batch 1 (KAN-5). Both require due-date tracking to be in place and should be implemented first to complete the core circulation functionality.

**Implementation Order**:
1. **KAN-6**: Renew an issued book with rules (implement first)
   - This feature adds actionable functionality to manage loans proactively.
   - Requires adding a `renewal_count` field to the `loans` table (requires confirmation from Design Assistant).
   - Implement business rules (e.g., max renewals, no renewal if overdue).

2. **KAN-7**: View overdue loans list (implement second)
   - This is a read-only view that depends on due-date data being available.
   - Provides operational visibility into overdue items.
   - Can be implemented quickly after KAN-6.

### Phase 2B: Search and Filter Capabilities

**Stories**: KAN-17, KAN-18, KAN-19

**Rationale**: These stories are independent of the circulation features and focus on enhancing user experience through search and filtering. They can be implemented in parallel with Phase 2A or immediately after.

**Implementation Order**:
1. **KAN-17**: Search books by title/author/ISBN (implement first)
   - Foundational search functionality for books.
   - Establishes the search pattern that can be reused for members.

2. **KAN-18**: Filter/sort books by availability and author (implement second)
   - Complements the search functionality by adding filtering/sorting.
   - Can share the same backend endpoint as KAN-17 with additional query parameters.

3. **KAN-19**: Search members by name or email (implement third)
   - Parallel search functionality for members.
   - Follows the same pattern as KAN-17, but for the `members` table.

---

## Dependency Matrix

| Story | Depends On | Reason |
|-------|-----------|--------|
| KAN-6 | KAN-5 (Batch 1) | Renewal logic requires due-date tracking to be in place |
| KAN-7 | KAN-5 (Batch 1) | Overdue detection requires due-date data to be available |
| KAN-17 | None | Independent search feature |
| KAN-18 | None (logically complements KAN-17) | Filter/sort can be implemented independently, but benefits from sharing the same API endpoint |
| KAN-19 | None | Independent search feature ~or members |

---

## Logical Delivery Batches

### Delivery Batch 2A: Advanced Circulation

**Stories**: KAN-6, KAN-7

**Rationale**: Completes the core circulation management capabilities by adding renewal functionality and overdue tracking. These features are critical for day-to-day library operations and should be delivered together as a cohesive unit.

**Expected Outcomes**:
- Librarians can renew loans with automated business rule enforcement.
- Overdue loans are visible in a dedicated view for follow-up actions.

### Delivery Batch 2B: Search & Filter

**Stories**: KAN-17, KAN-18, KAN-19

**Rationale**: Enhances user experience by providing robust search and filtering capabilities for both books and members. These features are independent of circulation logic and can be delivered as a separate unit focused on data discovery.

**Expected Outcomes**:
- Users can quickly find books by title, author, or ISBN.
- Books can be filtered by availability and sorted by various criteria.
- Members can be searched by name or email for quick lookup.

---

## Technical Considerations

### Database Schema Changes

**KAN-6 (Renewal Functionality)**:
- Requires adding a `renewal_count` field to the `loans` table (requires confirmation from Design Assistant).
- Default value: `0`.
- Type: INTEGER.

**KAN-7 (Overdue List)**:
- No schema changes required. Uses existing `due_date` and `return_date` fields from the `loans` table.

**KAN-17, KAN-18, KAN-19**:
- No schema changes required. Uses existing `books` and `members` tables.

### Backend API Endpoints

**KAN-6**:
- `POST /api/loans/:id/renew` - Renew a loan (extend due date).
- Validation: Check renewal count, overdue status, and other business rules.

**KAN-7**:
- `GET /api/loans/overdue` - Retrieve all overdue loans.
- Query: `SELECT * FROM loans WHERE due_date < CURRENT_DATE AND return_date IS NULL`.

**KAN-17**:
- `GET /api/books/search?q={query}` - Search books by title, author, or ISBN.
- Query: Use `LIKE` operator for partial matching across multiple fields.

**KAN-18**:
- `GET /api/books?filter={filter}&sort={sort}` - Filter and sort books.
- Filters: `available`, `author`.
- Sort: `title`, `author`, `isbn`.

**KAN-19**:
- `GET /api/members/search=q={query}` - Search members by name or email.
- Query: Use `LIKE` operator for partial matching across name and email fields.

### Frontend UI Changes

**KAN-6**:
- Add a "Renew" button on the loans list view.
- Display renewal count and validation messages.

**KAN-7**:
- Add a new "Overdue Loans" view in the navigation menu.
- Display overdue loans in a table with highlighted due dates.

**KAN-17**:
- Add a search input field on the books list view.
- Display search results dynamically.

**KAN-18**:
- Add filter and sort dropdowns on the books list view.
- Update the list based on selected filters/sort options.

**KAN-19**:
- Add a search input field on the members list view.
- Display search results dynamically.

---

## Risks and Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|--------------------|
| Renewal business rules not clearly defined (KAN-6) | Medium | Confirm rules with stakeholders before implementation (e.g., max renewals, renewal period) |
| Search performance on large datasets (KAN-17, KAN-19) | Low | Use indexed fields for search queries; consider pagination if needed |
| Schema change for `renewal_count` (KAN-6) | Low | Confirm with Design Assistant; ensure migration script is tested |
| UI complexity for filter/sort (KAN-18) | Low | Keep UI simple and intuitive; follow existing design patterns |

---

## Success Criteria

**Batch 2A: Advanced Circulation**:
- Librarians can successfully renew loans with automated validation.
- Overdue loans are accurately displayed in the dedicated view.
- All business rules for renewals are enforced correctly.

**Batch 2B: Search & Filter**:
- Users can search books by title, author, or ISBN with partial matching.
- Books can be filtered by availability and sorted by various criteria.
- Users can search members by name or email with partial matching.
- All search and filter functions return accurate results within acceptable response times.

---

## Next Steps

1. **Design Assistant**: Confirm schema changes for KAN-6 (`renewal_count` field).
2. **Developer Assistant**: Implement stories in the recommended sequence.
3. **Tester Assistant**: Validate all functionality and business rules.
4. **Stakeholder Review**: Demonstrate completed features and gather feedback.

---

**End of Implementation Plan - Batch 2**