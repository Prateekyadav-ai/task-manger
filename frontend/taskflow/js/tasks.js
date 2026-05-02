// ── TASKS PAGE ───────────────────────────────────────────────

route('tasks', async (root) => {
  const user = getUser();
  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">My Tasks</div>
          <div class="page-sub">Track and manage all your assigned tasks</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="showCreateTaskModal()">＋ New Task</button>
        </div>
      </div>
      <div class="page-body">
        <div class="filter-row">
          <div class="search-bar">
            <span>🔍</span>
            <input type="text" id="task-search" placeholder="Search tasks...">
          </div>
          <select class="form-select" id="status-f">
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select class="form-select" id="proj-f">
            <option value="">All Projects</option>
          </select>
          <select class="form-select" id="priority-f">
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div id="tasks-table-wrap"><div class="loading-screen"><div class="loader"></div></div></div>
      </div>
    </div>`;

  let allTasks = [], allProjects = [];
  try {
    const [tr, pr] = await Promise.all([api.getTasks(), api.getProjects()]);
    allTasks = tr.tasks || tr || [];
    allProjects = pr.projects || pr || [];
    // Populate project filter
    const pf = document.getElementById('proj-f');
    allProjects.forEach(p => { const o = document.createElement('option'); o.value = p._id||p.id; o.textContent = p.name; pf.appendChild(o); });
  } catch(e) { toast(e.message, 'error'); }

  function renderTasks(list) {
    const wrap = document.getElementById('tasks-table-wrap');
    if (!list.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h3>No Tasks Found</h3><p>Create a new task or adjust your filters.</p></div>`;
      return;
    }
    wrap.innerHTML = `
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Project</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(t => {
                const over = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date();
                return `<tr>
                  <td>
                    <div style="font-weight:600;font-size:13px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.title}</div>
                    ${t.description ? `<div style="font-size:11px;color:var(--text2)">${t.description.slice(0,60)}${t.description.length>60?'...':''}</div>` : ''}
                  </td>
                  <td>${statusBadge(over ? 'overdue' : t.status)}</td>
                  <td>${t.priority ? priorityBadge(t.priority) : '—'}</td>
                  <td style="font-size:12px;color:var(--text2)">${t.project?.name || '—'}</td>
                  <td>
                    ${t.assignedTo ? `<div class="flex" style="gap:6px">${avatarHtml(t.assignedTo.name||t.assignedTo.username, 26)}<span style="font-size:12px">${t.assignedTo.name||t.assignedTo.username}</span></div>` : '<span style="color:var(--text3);font-size:12px">Unassigned</span>'}
                  </td>
                  <td style="font-size:12px;font-family:var(--font-mono);color:${over?'var(--red)':'var(--text2)'}">${formatDate(t.dueDate)}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-ghost btn-sm" onclick="showTaskDetailModal('${t._id||t.id}')">👁</button>
                      <button class="btn btn-ghost btn-sm" onclick="showEditTaskModal('${t._id||t.id}')">✎</button>
                      <button class="btn btn-danger btn-sm" onclick="deleteTask('${t._id||t.id}')">✕</button>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function applyFilters() {
    const q = document.getElementById('task-search').value.toLowerCase();
    const s = document.getElementById('status-f').value;
    const p = document.getElementById('proj-f').value;
    const pr = document.getElementById('priority-f').value;
    let list = allTasks;
    if (q) list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description||'').toLowerCase().includes(q));
    if (s) list = list.filter(t => t.status === s);
    if (p) list = list.filter(t => (t.project?._id || t.project?.id || t.projectId) === p);
    if (pr) list = list.filter(t => t.priority === pr);
    renderTasks(list);
  }

  renderTasks(allTasks);
  ['task-search','status-f','proj-f','priority-f'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = el.onchange = applyFilters;
  });
});

// ── OVERDUE PAGE ──────────────────────────────────────────────

route('overdue', async (root) => {
  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Overdue Tasks</div>
          <div class="page-sub">Tasks that need your immediate attention</div>
        </div>
      </div>
      <div class="page-body">
        <div id="overdue-content"><div class="loading-screen"><div class="loader"></div></div></div>
      </div>
    </div>`;

  try {
    const res = await api.getOverdueTasks();
    const tasks = res.tasks || res.overdueTasks || res || [];
    const area = document.getElementById('overdue-content');
    if (!tasks.length) {
      area.innerHTML = `<div class="empty-state"><div class="empty-icon">🎉</div><h3>No Overdue Tasks!</h3><p>You're all caught up. Great work!</p></div>`;
      return;
    }
    area.innerHTML = `
      <div style="margin-bottom:16px">
        <span style="font-size:13px;color:var(--red);font-weight:600">${tasks.length} overdue task${tasks.length!==1?'s':''}</span>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Task</th><th>Project</th><th>Assigned To</th><th>Due Date</th><th>Actions</th></tr></thead>
            <tbody>
              ${tasks.map(t => `<tr>
                <td><div style="font-weight:600;font-size:13px">${t.title}</div></td>
                <td style="font-size:12px;color:var(--text2)">${t.project?.name||'—'}</td>
                <td>${t.assignedTo ? `<div class="flex" style="gap:6px">${avatarHtml(t.assignedTo.name||t.assignedTo.username,26)}<span style="font-size:12px">${t.assignedTo.name||t.assignedTo.username}</span></div>` : '—'}</td>
                <td style="font-size:12px;font-family:var(--font-mono);color:var(--red)">${formatDate(t.dueDate)}</td>
                <td><div class="actions">
                  <button class="btn btn-success btn-sm" onclick="markDone('${t._id||t.id}')">✓ Done</button>
                  <button class="btn btn-ghost btn-sm" onclick="showEditTaskModal('${t._id||t.id}')">✎ Edit</button>
                </div></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch(e) { toast(e.message, 'error'); }
});

window.markDone = async function(id) {
  try {
    await api.updateTaskStatus(id, 'done');
    toast('Task marked as done!', 'success');
    navigate('overdue');
  } catch(e) { toast(e.message, 'error'); }
};

// ── TASK MODALS ───────────────────────────────────────────────

window.showCreateTaskModal = async function(projectId) {
  let projects = [], users = [];
  try {
    const [pr, ur] = await Promise.all([api.getProjects(), api.getUsers().catch(() => ({ users: [] }))]);
    projects = pr.projects || pr || [];
    users = ur.users || ur || [];
  } catch {}

  const modal = showModal(`
    <div class="modal-header">
      <h3 class="modal-title">Create Task</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Title *</label>
        <input class="form-input" id="t-title" placeholder="Task title">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="t-desc" placeholder="What needs to be done?"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Project</label>
          <select class="form-select" id="t-proj">
            <option value="">No Project</option>
            ${projects.map(p => `<option value="${p._id||p.id}" ${(p._id||p.id)===projectId?'selected':''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="t-priority">
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Assign To</label>
          <select class="form-select" id="t-assign">
            <option value="">Unassigned</option>
            ${users.map(u => `<option value="${u._id||u.id}">${u.name||u.username}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input class="form-input" id="t-due" type="date">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="create-task-btn">Create Task</button>
    </div>`);

  modal.querySelector('#create-task-btn').onclick = async () => {
    const title = document.getElementById('t-title').value.trim();
    if (!title) { toast('Title required', 'error'); return; }
    const body = {
      title,
      description: document.getElementById('t-desc').value.trim(),
      projectId: document.getElementById('t-proj').value || undefined,
      priority: document.getElementById('t-priority').value,
      assignedTo: document.getElementById('t-assign').value || undefined,
      dueDate: document.getElementById('t-due').value || undefined,
    };
    try {
      await api.createTask(body);
      toast('Task created!', 'success');
      closeModal();
      navigate('tasks');
    } catch(e) { toast(e.message, 'error'); }
  };
};

window.showEditTaskModal = async function(id) {
  let task, projects = [], users = [];
  try {
    [task, projects, users] = await Promise.all([
      api.getTask(id).then(r => r.task || r),
      api.getProjects().then(r => r.projects || r || []),
      api.getUsers().catch(() => ({ users: [] })).then(r => r.users || r || []),
    ]);
  } catch(e) { toast(e.message, 'error'); return; }

  const modal = showModal(`
    <div class="modal-header">
      <h3 class="modal-title">Edit Task</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Title *</label>
        <input class="form-input" id="et-title" value="${task.title||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="et-desc">${task.description||''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="et-status">
            <option value="todo" ${task.status==='todo'?'selected':''}>Todo</option>
            <option value="in-progress" ${task.status==='in-progress'?'selected':''}>In Progress</option>
            <option value="done" ${task.status==='done'?'selected':''}>Done</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="et-priority">
            <option value="high" ${task.priority==='high'?'selected':''}>High</option>
            <option value="medium" ${task.priority==='medium'?'selected':''}>Medium</option>
            <option value="low" ${task.priority==='low'?'selected':''}>Low</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Assign To</label>
          <select class="form-select" id="et-assign">
            <option value="">Unassigned</option>
            ${users.map(u => `<option value="${u._id||u.id}" ${(u._id||u.id)===(task.assignedTo?._id||task.assignedTo?.id)?'selected':''}>${u.name||u.username}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input class="form-input" id="et-due" type="date" value="${task.dueDate?task.dueDate.split('T')[0]:''}">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-task-btn">Save Changes</button>
    </div>`);

  modal.querySelector('#save-task-btn').onclick = async () => {
    const title = document.getElementById('et-title').value.trim();
    if (!title) { toast('Title required', 'error'); return; }
    try {
      await api.updateTask(id, {
        title,
        description: document.getElementById('et-desc').value.trim(),
        status: document.getElementById('et-status').value,
        priority: document.getElementById('et-priority').value,
        assignedTo: document.getElementById('et-assign').value || undefined,
        dueDate: document.getElementById('et-due').value || undefined,
      });
      toast('Task updated!', 'success');
      closeModal();
      navigate('tasks');
    } catch(e) { toast(e.message, 'error'); }
  };
};

window.showTaskDetailModal = async function(id) {
  let task;
  try { task = await api.getTask(id); task = task.task || task; } catch(e) { toast(e.message, 'error'); return; }
  const over = task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date();
  showModal(`
    <div class="modal-header">
      <h3 class="modal-title">${task.title}</h3>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>
    <div class="modal-body">
      <div class="flex" style="gap:8px;margin-bottom:16px;flex-wrap:wrap">
        ${statusBadge(over?'overdue':task.status)}
        ${task.priority ? priorityBadge(task.priority) : ''}
      </div>
      ${task.description ? `<p style="font-size:14px;color:var(--text2);margin-bottom:16px;line-height:1.6">${task.description}</p>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div class="form-label">Project</div>
          <div style="font-size:13px">${task.project?.name || '—'}</div>
        </div>
        <div>
          <div class="form-label">Assigned To</div>
          <div style="font-size:13px">${task.assignedTo ? (task.assignedTo.name||task.assignedTo.username) : 'Unassigned'}</div>
        </div>
        <div>
          <div class="form-label">Due Date</div>
          <div style="font-size:13px;color:${over?'var(--red)':'inherit'}">${formatDate(task.dueDate)}</div>
        </div>
        <div>
          <div class="form-label">Created</div>
          <div style="font-size:13px">${formatDate(task.createdAt)}</div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="closeModal();showEditTaskModal('${id}')">✎ Edit</button>
    </div>`);
};

window.deleteTask = async function(id) {
  if (!await confirmDialog('Delete this task? This cannot be undone.')) return;
  try {
    await api.deleteTask(id);
    toast('Task deleted', 'success');
    navigate('tasks');
  } catch(e) { toast(e.message, 'error'); }
};
