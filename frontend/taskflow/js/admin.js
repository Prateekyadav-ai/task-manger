// ── ADMIN USERS PAGE ─────────────────────────────────────────

route('users', async (root) => {
  const user = getUser();
  if (user?.role !== 'admin') {
    root.innerHTML = `<div class="page-body"><div class="empty-state"><div class="empty-icon">🔒</div><h3>Access Denied</h3><p>You need admin privileges to view this page.</p></div></div>`;
    return;
  }

  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">User Management</div>
          <div class="page-sub">Manage users and their roles</div>
        </div>
      </div>
      <div class="page-body">
        <div class="filter-row">
          <div class="search-bar">
            <span>🔍</span>
            <input type="text" id="user-search" placeholder="Search users...">
          </div>
          <select class="form-select" id="role-filter">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </div>
        <div id="users-content"><div class="loading-screen"><div class="loader"></div></div></div>
      </div>
    </div>`;

  let allUsers = [];
  try {
    const res = await api.getUsers();
    allUsers = res.users || res || [];
  } catch(e) { toast(e.message, 'error'); }

  function renderUsers(list) {
    const content = document.getElementById('users-content');
    if (!list.length) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">◎</div><h3>No Users Found</h3></div>`;
      return;
    }
    content.innerHTML = `
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${list.map(u => `<tr>
                <td>
                  <div class="flex" style="gap:10px">
                    ${avatarHtml(u.name||u.username, 32)}
                    <div>
                      <div style="font-weight:600;font-size:13px">${u.name||u.username||'—'}</div>
                      ${u.username && u.name ? `<div style="font-size:11px;color:var(--text2)">@${u.username}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td style="font-size:12px;font-family:var(--font-mono);color:var(--text2)">${u.email||'—'}</td>
                <td>${roleBadge(u.role)}</td>
                <td style="font-size:12px;color:var(--text2)">${formatDate(u.createdAt)}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-ghost btn-sm" onclick="viewUserDetail('${u._id||u.id}')">👁</button>
                    <button class="btn btn-secondary btn-sm" onclick="changeUserRole('${u._id||u.id}','${u.role}')">
                      ${u.role==='admin' ? '→ Member' : '→ Admin'}
                    </button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  renderUsers(allUsers);

  function applyFilters() {
    const q = document.getElementById('user-search').value.toLowerCase();
    const r = document.getElementById('role-filter').value;
    let list = allUsers;
    if (q) list = list.filter(u => (u.name||u.username||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
    if (r) list = list.filter(u => u.role === r);
    renderUsers(list);
  }

  ['user-search','role-filter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = el.onchange = applyFilters;
  });
});

window.changeUserRole = async function(id, currentRole) {
  const newRole = currentRole === 'admin' ? 'member' : 'admin';
  if (!await confirmDialog(`Change this user's role to ${newRole}?`)) return;
  try {
    await api.updateUserRole(id, newRole);
    toast(`Role changed to ${newRole}`, 'success');
    navigate('users');
  } catch(e) { toast(e.message, 'error'); }
};

window.viewUserDetail = async function(id) {
  let user, userTasks;
  try {
    [user, userTasks] = await Promise.all([
      api.getAdminUser(id).then(r => r.user || r),
      api.getUserTasks(id).then(r => r.tasks || r || []).catch(() => []),
    ]);
  } catch(e) { toast(e.message, 'error'); return; }

  showModal(`
    <div class="modal-header">
      <h3 class="modal-title">User Details</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="flex" style="gap:16px;margin-bottom:20px">
        ${avatarHtml(user.name||user.username, 56)}
        <div>
          <div style="font-family:var(--font-head);font-size:18px;font-weight:700">${user.name||user.username||'Unknown'}</div>
          <div style="font-size:12px;color:var(--text2);font-family:var(--font-mono)">${user.email}</div>
          <div style="margin-top:6px">${roleBadge(user.role)}</div>
        </div>
      </div>
      <div class="divider"></div>
      <div style="font-family:var(--font-head);font-size:14px;font-weight:700;margin-bottom:12px">Assigned Tasks (${userTasks.length})</div>
      ${userTasks.slice(0,5).map(t => `
        <div class="member-row">
          <div style="flex:1"><div class="member-name" style="font-size:13px">${t.title}</div></div>
          ${statusBadge(t.status)}
        </div>`).join('') || '<p style="color:var(--text2);font-size:13px">No tasks assigned</p>'}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>`);
};

// ── PROFILE PAGE ──────────────────────────────────────────────

route('profile', async (root) => {
  const user = getUser();

  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Profile</div>
          <div class="page-sub">Manage your account settings</div>
        </div>
      </div>
      <div class="page-body">
        <div class="two-col">
          <div class="card">
            <div class="card-header"><h3 class="card-title">Account Info</h3></div>
            <div class="card-body">
              <div class="flex" style="gap:16px;margin-bottom:24px">
                ${avatarHtml(user?.name||user?.username, 64)}
                <div>
                  <div style="font-family:var(--font-head);font-size:20px;font-weight:700">${user?.name||user?.username||'User'}</div>
                  <div style="font-size:12px;color:var(--text2);font-family:var(--font-mono)">${user?.email||''}</div>
                  <div style="margin-top:8px">${roleBadge(user?.role)}</div>
                </div>
              </div>
              <div class="divider"></div>
              <div class="form-group">
                <label class="form-label">Display Name</label>
                <input class="form-input" id="prof-name" value="${user?.name||user?.username||''}">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-input" type="email" id="prof-email" value="${user?.email||''}" disabled style="opacity:0.6">
              </div>
              <button class="btn btn-primary" onclick="toast('Profile update coming soon','info')">Save Changes</button>
            </div>
          </div>

          <div>
            <div class="card" style="margin-bottom:16px">
              <div class="card-header">
                <h3 class="card-title">My Tasks Summary</h3>
              </div>
              <div class="card-body" id="my-tasks-summary">
                <div class="loader"></div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h3 class="card-title">Quick Actions</h3></div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:10px">
                  <button class="btn btn-secondary btn-full" onclick="navigate('tasks')">📋 View All Tasks</button>
                  <button class="btn btn-secondary btn-full" onclick="navigate('projects')">◈ View Projects</button>
                  <button class="btn btn-secondary btn-full" onclick="navigate('overdue')">⚑ Overdue Tasks</button>
                  <div class="divider"></div>
                  <button class="btn btn-danger btn-full" onclick="handleLogout()">⤷ Sign Out</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  try {
    const uid = user?._id || user?.id;
    if (uid) {
      const myTasks = await api.getUserTasks(uid).catch(() => []);
      const tasks = myTasks.tasks || myTasks || [];
      const todo = tasks.filter(t => t.status === 'todo').length;
      const inProg = tasks.filter(t => t.status === 'in-progress').length;
      const done = tasks.filter(t => t.status === 'done').length;
      document.getElementById('my-tasks-summary').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="text-align:center;padding:12px;background:var(--surface2);border-radius:var(--radius)">
            <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--text2)">${todo}</div>
            <div style="font-size:11px;color:var(--text3)">Todo</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--blue-bg);border-radius:var(--radius)">
            <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--blue)">${inProg}</div>
            <div style="font-size:11px;color:var(--text3)">In Progress</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--green-bg);border-radius:var(--radius)">
            <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--green)">${done}</div>
            <div style="font-size:11px;color:var(--text3)">Done</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--surface2);border-radius:var(--radius)">
            <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--accent2)">${tasks.length}</div>
            <div style="font-size:11px;color:var(--text3)">Total</div>
          </div>
        </div>`;
    }
  } catch {}
});
