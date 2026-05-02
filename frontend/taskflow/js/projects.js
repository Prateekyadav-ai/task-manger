// ── PROJECTS PAGE ────────────────────────────────────────────

route('projects', async (root) => {
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Projects</div>
          <div class="page-sub">Manage and track all your projects</div>
        </div>
        <div class="page-actions">
          ${isAdmin ? '<button class="btn btn-primary" id="create-project-btn">＋ New Project</button>' : ''}
        </div>
      </div>
      <div class="page-body">
        <div class="filter-row">
          <div class="search-bar">
            <span>🔍</span>
            <input type="text" id="proj-search" placeholder="Search projects...">
          </div>
        </div>
        <div id="projects-grid"><div class="loading-screen"><div class="loader"></div></div></div>
      </div>
    </div>`;

  if (isAdmin) {
    document.getElementById('create-project-btn').onclick = () => showCreateProjectModal();
  }

  let projects = [];
  try {
    const res = await api.getProjects();
    projects = res.projects || res || [];
  } catch(e) { toast(e.message, 'error'); }

  function render(list) {
    const grid = document.getElementById('projects-grid');
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">◈</div><h3>No Projects Yet</h3><p>${isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}</p>${isAdmin ? '<button class="btn btn-primary" onclick="showCreateProjectModal()">＋ Create Project</button>' : ''}</div>`;
      return;
    }
    grid.innerHTML = `<div class="three-col">${list.map(p => projectCardHtml(p)).join('')}</div>`;
    document.querySelectorAll('.project-card[data-id]').forEach(el => {
      el.onclick = () => navigate('project-detail', { id: el.dataset.id });
    });
  }

  render(projects);

  document.getElementById('proj-search').oninput = e => {
    const q = e.target.value.toLowerCase();
    render(projects.filter(p => p.name.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q)));
  };
});

// ── PROJECT DETAIL ────────────────────────────────────────────

route('project-detail', async (root, { id }) => {
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  root.innerHTML = `<div class="page"><div class="loading-screen"><div class="loader"></div></div></div>`;

  let project, tasks;
  try {
    [project, tasks] = await Promise.all([
      api.getProject(id),
      api.getProjectTasks(id),
    ]);
    project = project.project || project;
    tasks = tasks.tasks || tasks || [];
  } catch(e) {
    root.innerHTML = `<div class="page-body"><div class="empty-state"><div class="empty-icon">⚠</div><h3>Project not found</h3><button class="btn btn-secondary" onclick="navigate('projects')">← Back</button></div></div>`;
    return;
  }

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length;
  const pct = total ? Math.round(done / total * 100) : 0;

  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <div style="font-size:12px;color:var(--text2);font-family:var(--font-mono);cursor:pointer;margin-bottom:4px" onclick="navigate('projects')">← Projects</div>
          <div class="page-title">${project.name}</div>
          <div class="page-sub">${project.description || 'No description'}</div>
        </div>
        <div class="page-actions">
          ${isAdmin ? `
          <button class="btn btn-secondary btn-sm" onclick="showAddMemberModal('${id}')">＋ Member</button>
          <button class="btn btn-secondary btn-sm" onclick="showEditProjectModal('${id}')">✎ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProject('${id}')">✕ Delete</button>` : ''}
          <button class="btn btn-primary btn-sm" onclick="showCreateTaskModal('${id}')">＋ Task</button>
        </div>
      </div>
      <div class="page-body">
        <!-- Stats Row -->
        <div class="stats-grid" style="margin-bottom:24px">
          <div class="stat-card blue"><div class="stat-icon">◷</div><div class="stat-value">${total}</div><div class="stat-label">Total Tasks</div></div>
          <div class="stat-card green"><div class="stat-icon">✓</div><div class="stat-value">${done}</div><div class="stat-label">Completed</div></div>
          <div class="stat-card yellow"><div class="stat-icon">◉</div><div class="stat-value">${inProgress}</div><div class="stat-label">In Progress</div></div>
          <div class="stat-card red"><div class="stat-icon">⚑</div><div class="stat-value">${overdue}</div><div class="stat-label">Overdue</div></div>
        </div>

        <!-- Progress -->
        <div class="card mb-24" style="margin-bottom:20px;padding:0">
          <div class="card-body">
            <div class="flex-between mb-8">
              <span style="font-size:13px;font-weight:600">Overall Progress</span>
              <span style="font-family:var(--font-mono);font-size:12px;color:var(--text2)">${pct}%</span>
            </div>
            <div class="progress-bar" style="height:8px"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>
        </div>

        <div class="two-col">
          <!-- Tasks -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Tasks</h3>
              <div class="flex gap-8">
                <select class="form-select" id="status-filter" style="padding:6px 10px;font-size:12px;width:auto">
                  <option value="">All Status</option>
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div style="padding:12px" id="tasks-list">
              ${tasks.length ? tasks.map(t => taskItemHtml(t)).join('') : '<div class="empty-state" style="padding:30px"><div class="empty-icon">📋</div><p>No tasks yet</p></div>'}
            </div>
          </div>

          <!-- Members -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Members (${(project.members||[]).length})</h3>
            </div>
            <div style="padding:0 18px">
              ${(project.members||[]).length ? (project.members||[]).map(m => {
                const u = m.user || m;
                return `<div class="member-row">
                  ${avatarHtml(u.name || u.username)}
                  <div class="member-info">
                    <div class="member-name">${u.name || u.username}</div>
                    <div class="member-email">${u.email || ''}</div>
                  </div>
                  ${roleBadge(m.role || u.role)}
                  ${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="removeMember('${id}','${u._id||u.id}')">✕</button>` : ''}
                </div>`;
              }).join('') : '<div class="empty-state" style="padding:30px"><div class="empty-icon">◎</div><p>No members yet</p></div>'}
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // Task filter
  document.getElementById('status-filter').onchange = e => {
    const val = e.target.value;
    const filtered = val ? tasks.filter(t => t.status === val) : tasks;
    document.getElementById('tasks-list').innerHTML = filtered.length ? filtered.map(t => taskItemHtml(t)).join('') : '<div class="empty-state" style="padding:30px"><p>No tasks match filter</p></div>';
    bindTaskItems(id);
  };

  bindTaskItems(id);
});

function taskItemHtml(t) {
  const done = t.status === 'done';
  const over = !done && t.dueDate && new Date(t.dueDate) < new Date();
  return `
    <div class="task-item ${over?'overdue':''} ${done?'done':''}" data-task-id="${t._id||t.id}" style="cursor:pointer;margin-bottom:8px">
      <div class="task-checkbox ${done?'checked':''}" data-id="${t._id||t.id}" onclick="event.stopPropagation();toggleTask(this)"></div>
      <div class="task-content">
        <div class="task-title ${done?'done':''}">${t.title}</div>
        <div class="task-meta">
          ${statusBadge(over?'overdue':t.status)}
          ${t.priority ? priorityBadge(t.priority) : ''}
          ${t.dueDate ? `<span class="task-meta-item">📅 ${formatDate(t.dueDate)}</span>` : ''}
          ${t.assignedTo ? `<span class="task-meta-item">◎ ${(t.assignedTo.name||t.assignedTo.username||'')}</span>` : ''}
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();showEditTaskModal('${t._id||t.id}')">✎</button>
    </div>`;
}

function bindTaskItems(projectId) {
  document.querySelectorAll('.task-item[data-task-id]').forEach(el => {
    el.onclick = () => showTaskDetailModal(el.dataset.taskId);
  });
}

window.toggleTask = async function(el) {
  const id = el.dataset.id;
  const done = el.classList.contains('checked');
  try {
    await api.updateTaskStatus(id, done ? 'todo' : 'done');
    el.classList.toggle('checked');
    const title = el.closest('.task-item').querySelector('.task-title');
    if (title) title.classList.toggle('done');
    toast('Status updated', 'success');
  } catch(e) { toast(e.message, 'error'); }
};

window.removeMember = async function(projectId, userId) {
  if (!await confirmDialog('Remove this member from the project?')) return;
  try {
    await api.removeMember(projectId, userId);
    toast('Member removed', 'success');
    navigate('project-detail', { id: projectId });
  } catch(e) { toast(e.message, 'error'); }
};

window.deleteProject = async function(id) {
  if (!await confirmDialog('Delete this project? This cannot be undone.')) return;
  try {
    await api.deleteProject(id);
    toast('Project deleted', 'success');
    navigate('projects');
  } catch(e) { toast(e.message, 'error'); }
};

window.showEditProjectModal = async function(id) {
  let project;
  try { project = await api.getProject(id); project = project.project || project; } catch(e) { toast(e.message, 'error'); return; }
  const modal = showModal(`
    <div class="modal-header">
      <h3 class="modal-title">Edit Project</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Project Name</label>
        <input class="form-input" id="edit-proj-name" value="${project.name || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="edit-proj-desc">${project.description || ''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-proj-btn">Save Changes</button>
    </div>`);

  modal.querySelector('#save-proj-btn').onclick = async () => {
    const name = document.getElementById('edit-proj-name').value.trim();
    const description = document.getElementById('edit-proj-desc').value.trim();
    if (!name) { toast('Name required', 'error'); return; }
    try {
      await api.updateProject(id, { name, description });
      toast('Project updated', 'success');
      closeModal();
      navigate('project-detail', { id });
    } catch(e) { toast(e.message, 'error'); }
  };
};

window.showAddMemberModal = async function(projectId) {
  let users = [];
  try { const r = await api.getUsers(); users = r.users || r || []; } catch {}

  const modal = showModal(`
    <div class="modal-header">
      <h3 class="modal-title">Add Member</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Select User</label>
        <select class="form-select" id="member-user">
          <option value="">Choose a user...</option>
          ${users.map(u => `<option value="${u._id||u.id}">${u.name||u.username} (${u.email})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-select" id="member-role">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="add-member-btn">Add Member</button>
    </div>`);

  modal.querySelector('#add-member-btn').onclick = async () => {
    const userId = document.getElementById('member-user').value;
    const role = document.getElementById('member-role').value;
    if (!userId) { toast('Select a user', 'error'); return; }
    try {
      await api.addMember(projectId, { userId, role });
      toast('Member added', 'success');
      closeModal();
      navigate('project-detail', { id: projectId });
    } catch(e) { toast(e.message, 'error'); }
  };
};

window.showCreateProjectModal = function() {
  const modal = showModal(`
    <div class="modal-header">
      <h3 class="modal-title">New Project</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Project Name *</label>
        <input class="form-input" id="new-proj-name" placeholder="My Awesome Project">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="new-proj-desc" placeholder="What is this project about?"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="create-proj-btn">Create Project</button>
    </div>`);

  modal.querySelector('#create-proj-btn').onclick = async () => {
    const name = document.getElementById('new-proj-name').value.trim();
    const description = document.getElementById('new-proj-desc').value.trim();
    if (!name) { toast('Project name required', 'error'); return; }
    try {
      await api.createProject({ name, description });
      toast('Project created!', 'success');
      closeModal();
      navigate('projects');
    } catch(e) { toast(e.message, 'error'); }
  };
};
