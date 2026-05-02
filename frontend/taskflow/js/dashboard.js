// ── DASHBOARD PAGE ───────────────────────────────────────────

route('dashboard', async (root) => {
  const user = getUser();
  root.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Dashboard</div>
          <div class="page-sub">Good to see you, ${user?.name || user?.username || 'there'} 👋</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" id="quick-task">＋ New Task</button>
        </div>
      </div>
      <div class="page-body">
        <div id="stats-area"><div class="loading-screen"><div class="loader"></div></div></div>
        <div class="two-col" style="margin-top:24px">
          <div id="recent-tasks-area"><div class="loading-screen"><div class="loader"></div></div></div>
          <div id="overdue-area"><div class="loading-screen"><div class="loader"></div></div></div>
        </div>
        <div style="margin-top:24px" id="projects-area"><div class="loading-screen"><div class="loader"></div></div></div>
      </div>
    </div>`;

  document.getElementById('quick-task').onclick = () => showCreateTaskModal();

  // Load data in parallel
  const [summaryRes, overdueRes, projectsRes, tasksRes] = await Promise.allSettled([
    api.getSummary(),
    api.getOverdueSummary(),
    api.getProjects(),
    api.getTasks({ assignedTo: user?._id || user?.id, limit: 5 }),
  ]);

  const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
  const overdue = overdueRes.status === 'fulfilled' ? overdueRes.value : null;
  const projects = projectsRes.status === 'fulfilled' ? (projectsRes.value.projects || projectsRes.value || []) : [];
  const tasks = tasksRes.status === 'fulfilled' ? (tasksRes.value.tasks || tasksRes.value || []) : [];

  // Stats
  const stats = summary || {};
  document.getElementById('stats-area').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card purple">
        <div class="stat-icon">◈</div>
        <div class="stat-value">${stats.totalProjects ?? projects.length ?? 0}</div>
        <div class="stat-label">Total Projects</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-icon">◷</div>
        <div class="stat-value">${stats.totalTasks ?? 0}</div>
        <div class="stat-label">Total Tasks</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✓</div>
        <div class="stat-value">${stats.tasksByStatus?.done ?? stats.completedTasks ?? 0}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">◉</div>
        <div class="stat-value">${stats.tasksByStatus?.['in-progress'] ?? stats.inProgressTasks ?? 0}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">⚑</div>
        <div class="stat-value">${stats.overdueTasks ?? (overdue?.total ?? overdue?.count ?? 0)}</div>
        <div class="stat-label">Overdue</div>
      </div>
    </div>`;

  // Recent Tasks
  const recentHtml = tasks.length ? tasks.slice(0,5).map(t => taskRowHtml(t)).join('') : `<div class="empty-state" style="padding:30px"><div class="empty-icon">📋</div><p>No tasks yet</p></div>`;
  document.getElementById('recent-tasks-area').innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Recent Tasks</h3>
        <button class="btn btn-ghost btn-sm" onclick="navigate('tasks')">View all →</button>
      </div>
      <div style="padding:0 10px 10px">${recentHtml}</div>
    </div>`;

  // Overdue
  const overdueList = overdue?.tasks || overdue?.overdueTasks || [];
  const overdueHtml = overdueList.length ? overdueList.slice(0,5).map(t => `
    <div class="member-row">
      <div style="flex:1">
        <div class="member-name" style="font-size:13px">${t.title}</div>
        <div class="member-email">Due ${formatDate(t.dueDate)} · ${t.project?.name || 'No project'}</div>
      </div>
      ${statusBadge('overdue')}
    </div>`).join('') : `<div class="empty-state" style="padding:30px"><div class="empty-icon">✓</div><p>No overdue tasks!</p></div>`;
  document.getElementById('overdue-area').innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Overdue Tasks</h3>
        <button class="btn btn-ghost btn-sm" onclick="navigate('overdue')">View all →</button>
      </div>
      <div style="padding:0 10px 10px">${overdueHtml}</div>
    </div>`;

  // Projects preview
  const projHtml = projects.length ? `
    <div class="three-col">
      ${projects.slice(0,3).map(p => projectCardHtml(p)).join('')}
    </div>` : `<div class="empty-state"><div class="empty-icon">◈</div><p>No projects yet</p></div>`;
  document.getElementById('projects-area').innerHTML = `
    <div class="flex-between mb-16">
      <h2 style="font-family:var(--font-head);font-size:16px;font-weight:700">Recent Projects</h2>
      <button class="btn btn-ghost btn-sm" onclick="navigate('projects')">View all →</button>
    </div>
    ${projHtml}`;

  // Bind project cards
  document.querySelectorAll('.project-card[data-id]').forEach(el => {
    el.onclick = () => navigate('project-detail', { id: el.dataset.id });
  });

  // Bind task status toggles
  document.querySelectorAll('.task-checkbox[data-id]').forEach(el => {
    el.onclick = async (e) => {
      e.stopPropagation();
      const id = el.dataset.id;
      const isDone = el.classList.contains('checked');
      try {
        await api.updateTaskStatus(id, isDone ? 'todo' : 'done');
        toast('Task updated', 'success');
        navigate('dashboard');
      } catch(err) { toast(err.message, 'error'); }
    };
  });
});

function taskRowHtml(t) {
  const done = t.status === 'done';
  const over = !done && t.dueDate && new Date(t.dueDate) < new Date();
  return `
    <div class="task-item ${over ? 'overdue' : ''} ${done ? 'done' : ''}" style="margin-top:10px">
      <div class="task-checkbox ${done ? 'checked' : ''}" data-id="${t._id || t.id}"></div>
      <div class="task-content">
        <div class="task-title ${done ? 'done' : ''}">${t.title}</div>
        <div class="task-meta">
          ${statusBadge(over ? 'overdue' : t.status)}
          ${t.dueDate ? `<span class="task-meta-item">📅 ${formatDate(t.dueDate)}</span>` : ''}
          ${t.project?.name ? `<span class="task-meta-item">◈ ${t.project.name}</span>` : ''}
        </div>
      </div>
    </div>`;
}

function projectCardHtml(p) {
  const total = p.taskCount ?? p.tasks?.length ?? 0;
  const done = p.completedTasks ?? p.tasks?.filter(t=>t.status==='done').length ?? 0;
  const pct = total ? Math.round(done / total * 100) : 0;
  return `
    <div class="project-card" data-id="${p._id || p.id}">
      <div class="project-name">${p.name}</div>
      <div class="project-desc">${p.description || 'No description'}</div>
      <div class="project-meta">
        <span class="task-meta-item">◷ ${total} tasks</span>
        <span class="task-meta-item">◎ ${p.members?.length ?? 0} members</span>
      </div>
      <div class="project-progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-label"><span>${done}/${total} done</span><span>${pct}%</span></div>
      </div>
    </div>`;
}
