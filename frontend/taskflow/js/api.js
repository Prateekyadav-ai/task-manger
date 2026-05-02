// ── API SERVICE ──────────────────────────────────────────────
const BASE = 'http://localhost:3000/api';

function getToken() { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }
function removeToken() { localStorage.removeItem('token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }
function setUser(u) { localStorage.setItem('user', JSON.stringify(u)); }
function removeUser() { localStorage.removeItem('user'); }

async function request(method, path, body, params) {
  const url = new URL(BASE + path);
  if (params) Object.entries(params).forEach(([k,v]) => v != null && v !== '' && url.searchParams.set(k, v));
  const token = getToken();
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      handleLogout(false);
    }
    throw err;
  }
}

const api = {
  // AUTH
  register: (d) => request('POST', '/auth/register', d),
  login: async (d) => { const r = await request('POST', '/auth/login', d); if (r.token) setToken(r.token); if (r.user) setUser(r.user); return r; },
  me: async () => { const r = await request('GET', '/auth/me'); if (r.user || r) setUser(r.user || r); return r; },
  logout: () => request('GET', '/auth/logout'),
  getMyAddresses: () => request('GET', '/auth/users/me/addresses'),
  addAddress: (d) => request('POST', '/auth/users/me/addresses', d),
  deleteAddress: (id) => request('DELETE', `/auth/users/me/addresses/${id}`),

  // PROJECTS
  createProject: (d) => request('POST', '/projects/', d),
  getProjects: () => request('GET', '/projects/'),
  getProject: (id) => request('GET', `/projects/${id}`),
  updateProject: (id, d) => request('PUT', `/projects/${id}`, d),
  deleteProject: (id) => request('DELETE', `/projects/${id}`),
  addMember: (id, d) => request('POST', `/projects/${id}/members`, d),
  removeMember: (id, uid) => request('DELETE', `/projects/${id}/members/${uid}`),
  getProjectTasks: (id, p) => request('GET', `/projects/${id}/tasks`, null, p),

  // TASKS
  createTask: (d) => request('POST', '/tasks/', d),
  getTasks: (p) => request('GET', '/tasks/', null, p),
  getTask: (id) => request('GET', `/tasks/${id}`),
  updateTask: (id, d) => request('PUT', `/tasks/${id}`, d),
  updateTaskStatus: (id, status) => request('PATCH', `/tasks/${id}/status`, { status }),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),
  getOverdueTasks: () => request('GET', '/tasks/overdue'),
  getUserTasks: (uid, p) => request('GET', `/users/${uid}/tasks`, null, p),

  // ADMIN
  getUsers: () => request('GET', '/admin/users'),
  getAdminUser: (id) => request('GET', `/admin/users/${id}`),
  updateUserRole: (id, role) => request('PUT', `/admin/users/${id}/role`, { role }),

  // DASHBOARD
  getSummary: () => request('GET', '/dashboard/summary'),
  getProjectSummary: (id) => request('GET', `/dashboard/project/${id}/summary`),
  getOverdueSummary: () => request('GET', '/dashboard/overdue'),
};
