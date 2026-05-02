// ── UTILITIES ────────────────────────────────────────────────

function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ'}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(20px)'; el.style.transition='0.3s'; setTimeout(() => el.remove(), 300); }, 3500);
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date() && true;
}

function relativeTime(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

function statusBadge(status) {
  const map = {
    'todo': '<span class="badge badge-todo">● Todo</span>',
    'in-progress': '<span class="badge badge-progress">◉ In Progress</span>',
    'done': '<span class="badge badge-done">✓ Done</span>',
    'overdue': '<span class="badge badge-overdue">⚠ Overdue</span>',
  };
  return map[status] || `<span class="badge badge-todo">${status}</span>`;
}

function priorityBadge(p) {
  const map = {
    high: '<span class="badge badge-high">↑ High</span>',
    medium: '<span class="badge badge-medium">→ Medium</span>',
    low: '<span class="badge badge-low">↓ Low</span>',
  };
  return map[p] || '';
}

function roleBadge(role) {
  return role === 'admin'
    ? '<span class="badge badge-admin">★ Admin</span>'
    : '<span class="badge badge-member">Member</span>';
}

function avatarHtml(name, size = 34) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const colors = ['#6c63ff','#22d3a5','#f87171','#fbbf24','#60a5fa','#a78bfa'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return `<div class="user-avatar" style="width:${size}px;height:${size}px;background:${color};font-size:${Math.floor(size*0.38)}px">${initials}</div>`;
}

function confirmDialog(msg) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:380px">
        <div class="modal-header"><h3 class="modal-title">Confirm Action</h3></div>
        <div class="modal-body"><p style="color:var(--text2);font-size:14px">${msg}</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
          <button class="btn btn-danger" id="confirm-ok">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
  });
}

function showModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  return overlay.querySelector('.modal');
}

function closeModal() {
  const m = document.getElementById('active-modal');
  if (m) m.remove();
}

// ── ROUTER ───────────────────────────────────────────────────
const routes = {};
function route(name, fn) { routes[name] = fn; }

async function navigate(page, params = {}) {
  if (!getUser() && page !== 'login' && page !== 'register') {
    return navigate('login');
  }
  const user = getUser();
  if (user && (page === 'login' || page === 'register')) {
    return navigate('dashboard');
  }
  const main = document.getElementById('app-root');
  if (!main) return;

  updateNav(page);
  if (routes[page]) {
    try {
      await routes[page](main, params);
    } catch(e) {
      console.error(e);
      main.innerHTML = `<div class="page-body"><div class="empty-state"><div class="empty-icon">⚠</div><h3>Something went wrong</h3><p>${e.message}</p></div></div>`;
    }
  }
}

function updateNav(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

function handleLogout(redirect = true) {
  api.logout().catch(() => {});
  removeToken();
  removeUser();
  if (redirect) navigate('login');
}

// ── LAYOUT ───────────────────────────────────────────────────
function renderLayout() {
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  document.body.innerHTML = `
    <div class="toast-container" id="toast-container"></div>
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <div class="logo-icon">⚡</div>
            <span class="logo-text">TaskFlow</span>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-label">Overview</div>
          <a class="nav-item" data-page="dashboard">
            <span class="nav-icon">⬡</span> Dashboard
          </a>
          <div class="nav-section-label">Work</div>
          <a class="nav-item" data-page="projects">
            <span class="nav-icon">◈</span> Projects
          </a>
          <a class="nav-item" data-page="tasks">
            <span class="nav-icon">◷</span> My Tasks
          </a>
          <a class="nav-item" data-page="overdue">
            <span class="nav-icon">⚑</span> Overdue
          </a>
          ${isAdmin ? `
          <div class="nav-section-label">Admin</div>
          <a class="nav-item" data-page="users">
            <span class="nav-icon">◎</span> Users
          </a>` : ''}
          <div class="nav-section-label">Account</div>
          <a class="nav-item" data-page="profile">
            <span class="nav-icon">◉</span> Profile
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-card">
            ${avatarHtml(user?.name || user?.username)}
            <div class="user-info">
              <div class="user-name truncate">${user?.name || user?.username || 'User'}</div>
              <div class="user-role">${user?.role || 'member'}</div>
            </div>
            <button onclick="handleLogout()" class="btn btn-ghost btn-sm" title="Logout">⤷</button>
          </div>
        </div>
      </aside>
      <main class="main-content" id="app-root"></main>
    </div>`;

  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.page));
  });
}

function renderAuthLayout() {
  document.body.innerHTML = `
    <div class="toast-container" id="toast-container"></div>
    <div id="app-root"></div>`;
}
