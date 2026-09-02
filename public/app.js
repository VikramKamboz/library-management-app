"use strict";
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
function showMessage(msg, isError = false) {
    const banner = document.getElementById('message-banner');
    banner.textContent = msg;
    banner.className = isError ? 'banner error' : 'banner success';
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; }, 3000);
}
async function loadBooks() {
    const res = await fetch('/api/books');
    const books = await res.json();
    const container = document.getElementById('books-list');
    if (books.length === 0) {
        container.innerHTML = '<p class="empty">No books added yet.</p>';
        return;
    }
    container.innerHTML = `
    <table>
      <thead>
        <tr><th>Title</th><th>Author</th><th>ISBN</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${books.map(b => `
          <tr>
            <td>${escapeHtml(b.title)}</td>
            <td>${escapeHtml(b.author)}</td>
            <td>${escapeHtml(b.isbn)}</td>
            <td class="${b.is_available ? 'available' : 'issued'}">${b.is_available ? 'Available' : 'Issued'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
function renderMembersTable(members) {
    const container = document.getElementById('members-list');
    if (members.length === 0) {
        container.innerHTML = '<p class="empty">No members found.</p>';
        return;
    }
    container.innerHTML = `
    <table>
      <thead>
        <tr><th>Name</th><th>Email</th></tr>
      </thead>
      <tbody>
        ${members.map(m => `
          <tr>
            <td>${escapeHtml(m.name)}</td>
            <td>${escapeHtml(m.email)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
async function loadMembers() {
    const res = await fetch('/api/members');
    const members = await res.json();
    renderMembersTable(members);
}
async function searchMembers(query) {
    const trimmed = query.trim();
    if (!trimmed) {
        loadMembers();
        return;
    }
    const res = await fetch(`/api/members/search?q=${encodeURIComponent(trimmed)}`);
    const members = await res.json();
    renderMembersTable(members);
}
async function loadAvailableBooksSelect() {
    const res = await fetch('/api/books');
    const books = await res.json();
    const select = document.getElementById('issue-book-select');
    select.innerHTML = '<option value="">-- Select a Book --</option>';
    books.filter(b => b.is_available).forEach(b => {
        const opt = document.createElement('option');
        opt.value = String(b.id);
        opt.textContent = `${b.title} — ${b.author}`;
        select.appendChild(opt);
    });
}
async function loadMembersSelect() {
    const res = await fetch('/api/members');
    const members = await res.json();
    const select = document.getElementById('issue-member-select');
    select.innerHTML = '<option value="">-- Select a Member --</option>';
    members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = String(m.id);
        opt.textContent = m.name;
        select.appendChild(opt);
    });
}
async function loadLoans() {
    const res = await fetch('/api/loans');
    const loans = await res.json();
    const container = document.getElementById('loans-list');
    if (loans.length === 0) {
        container.innerHTML = '<p class="empty">No books currently issued.</p>';
        return;
    }
    container.innerHTML = `
    <table>
      <thead>
        <tr><th>Book</th><th>Issued To</th><th>Issued Date</th><th>Due Date</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${loans.map(l => `
          <tr>
            <td>${escapeHtml(l.title)}</td>
            <td>${escapeHtml(l.name)}</td>
            <td>${escapeHtml(l.issued_date)}</td>
            <td>${l.due_date ? escapeHtml(l.due_date) : '—'}</td>
            <td><button class="return-btn" data-loan-id="${l.id}">Return</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
            if (target === 'books')
                loadBooks();
            if (target === 'members')
                loadMembers();
            if (target === 'issue') {
                loadAvailableBooksSelect();
                loadMembersSelect();
            }
            if (target === 'return')
                loadLoans();
        });
    });
}
function initForms() {
    document.getElementById('add-book-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const isbn = document.getElementById('book-isbn').value.trim();
        const bookError = document.getElementById('book-error');
        bookError.textContent = '';
        const res = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, isbn })
        });
        if (res.ok) {
            form.reset();
            showMessage('Book added successfully.');
            loadBooks();
        }
        else {
            const err = await res.json();
            bookError.textContent = err.error || 'Failed to add book.';
        }
    });
    document.getElementById('add-member-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const name = document.getElementById('member-name').value.trim();
        const email = document.getElementById('member-email').value.trim();
        const memberError = document.getElementById('member-error');
        memberError.textContent = '';
        const res = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });
        if (res.ok) {
            form.reset();
            showMessage('Member added successfully.');
            loadMembers();
        }
        else {
            const err = await res.json();
            memberError.textContent = err.error || 'Failed to add member.';
        }
    });
    document.getElementById('issue-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const book_id = parseInt(document.getElementById('issue-book-select').value);
        const member_id = parseInt(document.getElementById('issue-member-select').value);
        if (!book_id || !member_id) {
            showMessage('Please select both a book and a member.', true);
            return;
        }
        const res = await fetch('/api/loans/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ book_id, member_id })
        });
        if (res.ok) {
            const data = await res.json();
            showMessage(`Book issued successfully. Due date: ${data.due_date}`);
            loadAvailableBooksSelect();
        }
        else {
            const err = await res.json();
            showMessage(err.error || 'Failed to issue book.', true);
        }
    });
    document.getElementById('loans-list').addEventListener('click', async (e) => {
        const target = e.target;
        if (!target.classList.contains('return-btn'))
            return;
        const loanId = parseInt(target.dataset.loanId);
        const res = await fetch('/api/loans/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loan_id: loanId })
        });
        if (res.ok) {
            showMessage('Book returned successfully.');
            loadLoans();
        }
        else {
            const err = await res.json();
            showMessage(err.error || 'Failed to return book.', true);
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initForms();
    loadBooks();
    const searchInput = document.getElementById('member-search');
    searchInput.addEventListener('input', debounce((e) => {
        const target = e.target;
        searchMembers(target.value);
    }, 300));
});
