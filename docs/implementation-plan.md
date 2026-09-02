# Implementation Plan: KAN-41 - Circulation Activity Report

## Overview

This implementation plan covers the development of **KAN-41: Generate circulation activity report (issues/returns) for a date range**, which is part of Epic **KAN-4** (Operational Reporting).

This story enables librarians to generate a report showing all book issues and returns within a specified date range, providing insight into library circulation activity.

---

## Story Details

**Story ID:** KAN-41  
**Epic:** KAN-4 (Operational Reporting & exports)  
**Priority:** Medium  
**Estimated Effort:** 3 story points (1-2 days)

**User Story:**  
As a librarian, I want to generate a circulation activity report for a specified date range, so I can track book issues and returns over time.

**Acceptance Criteria:**
1. User can select a start date and end date
2. Report displays all loans issued within the date range
3. Report displays all loans returned within the date range
4. Each entry shows: book title, member name, issue date, return date (if applicable), status
5. Report includes summary statistics: total issues, total returns

---

## Implementation Sequence

Since this is a single story implementation, the work will be delivered as one cohesive unit. However, the development will follow a logical sequence from backend to frontend to ensure a structured approach.

---

## Dependency Analysis

### Prerequisites

**KAN-41 has the following dependencies:**

1. **KAN-5 (Add due date tracking) - CRITICAL DEPENDENCY**  
   - The circulation report requires date fields in the `loans` table to track when books were issued and returned.
   - **Status:** KAN-5 is currently marked as **Done** in Jira, so this dependency is satisfied.
   - The `loans` table should now have `issue_date`, `due_date`, and `return_date` fields.

2. **Baseline Database Schema**  
   - The baseline application has three tables: `books`, `members`, and `loans`.
   - The report will need to JOIN these tables to display book titles and member names.
   - **Note:** The exact schema details (column names, foreign keys) require confirmation from Design Assistant.

### No Blocking Dependencies

**KAN-41 does NOT depend on:**

- **KAN-6** (Renew book) - Renewal functionality is independent of reporting.
- **KAN-7** (Overdue list) - Overdue detection is a separate feature.
- **KAN-17, KAN-18, KAN-19** (Search/Filter) - Search features are independent.
- **KAN-29, KAN-30, KAN-31** (Data Integrity) - Validation rules do not affect reporting.
- **KAN-42** (CSV export) - Export functionality is a separate feature (though it could be added to this report later).
- **KAN-43** (Member borrowing summary) - Different report type.

### Downstream Impact

**Stories that may benefit from KAN-41 being completed:**

- **KAN-42** (CSV export) - Once the circulation report is built, adding CSV export functionality would be a natural extension.
- **Future reporting features** - This story establishes a pattern for date-based reporting that can be reused.

---

## Delivery Batch

### Batch 1 (Single Story)

**Stories:** KAN-41

**Rationale:**  
This is a standalone reporting feature that provides immediate value to librarians by enabling them to track circulation activity over time. It leverages the existing date tracking functionality from KAN-5 and does not block or depend on any other pending stories.

---

## Technical Implementation Sequence

The development will follow this logical sequence:

### Phase 1: Backend API Development

1. **Database Query Design**  
   - Confirm the `loans` table schema (column names, foreign keys).
   - Design SQL query to retrieve loans within a date range, joining with `books` and `members` tables.
   - Query should filter by:
     - Loans issued within the date range (`issue_date` between start and end)
     - Loans returned within the date range (`return_date` between start and end)
   - Return fields: book title, member name, issue date, due date, return date, status.

2. **API Endpoint Creation**  
   - Create a new GET endpoint: `/api/reports/circulation`
   - Accept query parameters: `start_date` and `end_date`
   - Validate date format (ISO 8601 or YYYY-MM-DD)
   - Validate that start_date <= end_date
   - Return JSON response with:
     - `loans`: array of loan records
     - `summary`: { `total_issues`, `total_returns` }

3. **Error Handling**  
   - Handle invalid date formats
   - Handle missing parameters
   - Handle database errors

### Phase 2: Frontend UI Development

4. **Report Page Creation**  
   - Create a new HTML page: `reports.html` (or add to existing navigation)
   - Add navigation link to the main menu

5. **Date Range Input Form**  
   - Add two date input fields: "Start Date" and "End Date"
   - Add "Generate Report" button
   - Implement client-side validation (start <= end)
   - Style the form consistently with existing UI

6. **Report Display Table**  
   - Create a table to display loan records with columns:
     - Book Title
     - Member Name
     - Issue Date
     - Due Date
     - Return Date
     - Status (e.g., "Issued", "Returned", "Overdue")
   - Display summary statistics at the top or bottom of the table

7. **API Integration**  
   - Write TypeScript code to fetch data from `/api/reports/circulation`
   - Populate the table with response data
   - Handle loading states (show spinner or message)
   - Handle error states (display error messages)
   - Handle empty results ("No data found for the selected date range")

### Phase 3: Testing & Validation

8. **Unit Tests**  
   - Test backend API endpoint with various date ranges
   - Test edge cases: empty results, invalid dates, missing parameters

9. **Integration Tests**  
   - Test end-to-end flow: enter dates, generate report, view results
   - Test with real data from the `loans` table

10. **User Acceptance Testing**  
    - Verify all acceptance criteria are met
    - Test UI responsiveness and usability

---

## Technical Considerations

### Database Schema Assumptions

Based on the baseline application and KAN-5 (Done), we assume the `loans` table has the following structure:

```sql
CREATE TABLE loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  issue_date TEXT NOT NULL,  -- ISO 8601 format
  due_date TEXT NOT NULL,    -- ISO 8601 format
  return_date TEXT,          -- ISO 8601 format, NULL if not returned
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY(member_id) REFERENCES members(id)
);
```

**Note:** If the actual schema differs, the Design Assistant should confirm the exact column names and data types.

### Date Handling

- Dates should be stored in ISO 8601 format (`YYYY-MM-DD`) for easy comparison.
- SQLite date functions (`DATE()`, `DATETIME()`) can be used for querying.
- Frontend should use HTML5 `input type="date"` for user-friendly date pickers.

### Status Logic

The status of a loan can be determined as follows:
- **Returned**: `return_date` is not NULL
- **Overdue**: `return_date` is NULL and `due_date` < current date
- **Issued**: `return_date` is NULL and `due_date` >= current date

### Performance

- For large datasets, consider adding indexes on `issue_date` and `return_date` columns.
- Limit the date range to prevent excessively large results (e.g., max 1 year).

### UI Consistency

- Follow the existing UI patterns from the baseline application.
- Use consistent styling for tables, forms, and buttons.
- Ensure responsive design for mobile devices.

---

## Risks & Mitigation

### Risk 1: Incomplete Date Tracking from KAN-5

**Risk:** If KAN-5 was not fully implemented, the `loans` table may not have the required date fields.

**Mitigation:**  
- Verify the `loans` table schema before starting development.
- If date fields are missing, coordinate with the team to complete KAN-5 first.

### Risk 2: Performance Issues with Large Datasets

**Risk:** Querying a large number of loans without indexes could cause slow response times.

**Mitigation:**  
- Add database indexes on date columns.
- Implement pagination if necessary.
- Limit the maximum date range.

### Risk 3: User Confusion with Date Formats

**Risk:** Users may enter dates in incorrect formats.

**Mitigation:**  
- Use HTML5 date inputs with built-in validation.
- Display clear format instructions or placeholders.
- Implement robust server-side validation.

---

## Definition of Done

KAN-41 is considered **Done** when:

1. ✔️ Backend API endpoint `/api/reports/circulation` is implemented and tested.
2. ✔️ Frontend UI allows users to select a date range and generate the report.
3. ✔️ Report displays all loans issued and returned within the selected date range.
4. ✔️ Report includes book title, member name, issue date, due date, return date, and status.
5. ✔️ Report includes summary statistics (total issues, total returns).
6. ✔️ All acceptance criteria are met and verified.
7. ✔️ Unit tests and integration tests pass.
8. ✔️ Code is reviewed and merged to the main branch.
9. ✔️ Documentation is updated (if applicable).

---

## Next Steps

1. **Design Assistant** should confirm the exact database schema for the `loans`, `books`, and `members` tables.
2. **Design Assistant** should design the API contract for `/api/reports/circulation` (request/response format).
3. **Developer Assistant** should implement the backend and frontend code based on this plan.
4. **Tester** should verify all acceptance criteria and perform user acceptance testing.

---

## Summary

This implementation plan for **KAN-41** provides a clear, sequenced approach to building the circulation activity report feature. The story is independent of other pending work, relies only on the completed KAN-5, and can be delivered as a standalone feature that provides immediate value to library staff.

The plan follows a logical sequence from backend to frontend, includes clear technical considerations, and identifies potential risks with mitigation strategies.
