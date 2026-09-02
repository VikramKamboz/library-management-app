interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  is_available: number;
}

interface Member {
  id: number;
  name: string;
  email: string;
}

interface Loan {
  id: number;
  book_id: number;
  member_id: number;
  title: string;
  author: string;
  name: string;
  issued_date: string;
  due_date: string | null;
}

function debounce(fn: Function, delay: number): (...args: unknown[]) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function showMessage(msg: string, isError = false): void {
  const banner = document.getElementById('message-banner') as HTMLDivElement;
  banner.textContent = msg;
  banner.className = isError ? 'banner error' : 'banner success';
  banner.style.display = 'block';
  setTimeout(() => { banner.style.display = 'none'; }, 3000);
}

async function loadBooks(): Promise<void> {
  const res = await fetch('/api/books');
  const books = await res.json() as Book[];
  const container = document.getElementById('books-list') as HTMLDivElement;
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

function renderMembersTable(members: Member[]): void {
  const container = document.getElementById('members-list') as HTMLDivElement;
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

async function loadMembers(): Promise<void> {
  const res = await fetch('/api/members');
  const members = await res.json() as Member[];
  renderMembersTable(members);
}

async function searchMembers(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) {
    loadMembers();
    return;
  }
  const res = await fetch(`/api/members/search?q=${encodeURIComponent(trimmed)}`);
  const members = await res.json() as Member[];
  renderMembersTable(members);
}

async function loadAvailableBooksSelect(): Promise<void> {
  const res = await fetch('/api/books');
  const books = await res.json() as Book[];
  const select = document.getElementById('issue-book-select') as HTMLSelectElement;
  select.innerHTML = '<option value="">-- Select a Book --</option>';
  books.filter(b => b.is_available).forEach(b => {
    const opt = document.createElement('option');
    opt.value = String(b.id);
    opt.textContent = `${b.title} — ${b.author}`;
    select.appendChild(opt);
  });
}

async function loadMembersSelect(): Promise<void> {
  const res = await fetch('/api/members');
  const members = await res.json() as Member[];
  const select = document.getElementById('issue-member-select') as HTMLSelectElement;
  select.innerHTML = '<option value="">-- Select a Member --</option>';
  members.forEach(m => {
    const opt = document.createElement('option');
    opt.value = String(m.id);
    opt.textContent = m.name;
    select.appendChild(opt);
  });
}

async function loadLoans(): Promise<void> {
  const res = await fetch('/api/loans');
  const loans = await res.json() as Loan[];
  const container = document.getElementById('loans-list') as HTMLDivElement;
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

function initTabs(): void {
  const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  const tabContents = document.querySelectorAll<HTMLElement>('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab as string;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      (document.getElementById(target) as HTMLElement).classList.add('active');

      if (target === 'books') loadBooks();
      if (target === 'members') loadMembers();
      if (target === 'issue') { loadAvailableBooksSelect(); loadMembersSelect(); }
      if (target === 'return') loadLoans();
    });
  });
}

function initForms(): void {
  (document.getElementById('add-book-form') as HTMLFormElement).addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (document.getElementById('book-title') as HTMLInputElement).value.trim();
    const author = (document.getElementById('book-author') as HTMLInputElement).value.trim();
    const isbn = (document.getElementById('book-isbn') as HTMLInputElement).value.trim();
    const bookError = document.getElementById('book-error') as HTMLSpanElement;
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
    } else {
      const err = await res.json() as { error: string };
      bookError.textContent = err.error || 'Failed to add book.';
    }
  });

  (document.getElementById('add-member-form') as HTMLFormElement).addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (document.getElementById('member-name') as HTMLInputElement).value.trim();
    const email = (document.getElementById('member-email') as HTMLInputElement).value.trim();
    const memberError = document.getElementById('member-error') as HTMLSpanElement;
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
    } else {
      const err = await res.json() as { error: string };
      memberError.textContent = err.error || 'Failed to add member.';
    }
  });

  (document.getElementById('issue-form') as HTMLFormElement).addEventListener('submit', async (e) => {
    e.preventDefault();
    const book_id = parseInt((document.getElementById('issue-book-select') as HTMLSelectElement).value);
    const member_id = parseInt((document.getElementById('issue-member-select') as HTMLSelectElement).value);

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
      const data = await res.json() as { message: string; due_date: string };
      showMessage(`Book issued successfully. Due date: ${data.due_date}`);
      loadAvailableBooksSelect();
    } else {
      const err = await res.json() as { error: string };
      showMessage(err.error || 'Failed to issue book.', true);
    }
  });

  (document.getElementById('loans-list') as HTMLDivElement).addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('return-btn')) return;
    const loanId = parseInt(target.dataset.loanId as string);

    const res = await fetch('/api/loans/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loan_id: loanId })
    });
    if (res.ok) {
      showMessage('Book returned successfully.');
      loadLoans();
    } else {
      const err = await res.json() as { error: string };
      showMessage(err.error || 'Failed to return book.', true);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initForms();
  loadBooks();

  const searchInput = document.getElementById('member-search') as HTMLInputElement;
  searchInput.addEventListener('input', debounce((e: Event) => {
    const target = e.target as HTMLInputElement;
    searchMembers(target.value);
  }, 300));
});
