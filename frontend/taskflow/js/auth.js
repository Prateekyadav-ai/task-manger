// ── AUTH PAGES ───────────────────────────────────────────────

route('login', async (root) => {
  document.body.classList.add('auth-body');
  root.innerHTML = `
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon">⚡</div>
        <span class="logo-text">TaskFlow</span>
      </div>
      <div class="auth-title">Welcome back</div>
      <div class="auth-sub">Sign in to manage your projects and tasks</div>
      <div id="auth-err" class="hidden" style="background:var(--red-bg);border:1px solid rgba(248,113,113,0.2);border-radius:var(--radius);padding:10px 14px;font-size:13px;color:var(--red);margin-bottom:16px;"></div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="email" type="email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" id="password" type="password" placeholder="••••••••" autocomplete="current-password">
      </div>
      <button class="btn btn-primary btn-full btn-lg" id="login-btn">
        Sign In
      </button>
      <div class="auth-link-row">
        Don't have an account? <a class="auth-link" id="go-register">Create one</a>
      </div>
    </div>
  </div>`;

  document.getElementById('go-register').onclick = () => navigate('register');

  async function doLogin() {
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('auth-err');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) { err.textContent = 'Please fill in all fields'; err.classList.remove('hidden'); return; }
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Signing in...';
    err.classList.add('hidden');
    try {
      await api.login({ email, password });
      // Try to refresh user data
      try { const me = await api.me(); setUser(me.user || me); } catch {}
      renderLayout();
      navigate('dashboard');
    } catch(e) {
      err.textContent = e.message || 'Invalid credentials';
      err.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }

  document.getElementById('login-btn').onclick = doLogin;
  document.getElementById('password').onkeydown = e => e.key === 'Enter' && doLogin();
});

route('register', async (root) => {
  root.innerHTML = `
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon">⚡</div>
        <span class="logo-text">TaskFlow</span>
      </div>
      <div class="auth-title">Create account</div>
      <div class="auth-sub">Join TaskFlow to collaborate on projects</div>
      <div id="auth-err" class="hidden" style="background:var(--red-bg);border:1px solid rgba(248,113,113,0.2);border-radius:var(--radius);padding:10px 14px;font-size:13px;color:var(--red);margin-bottom:16px;"></div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">First Name</label>
          <input class="form-input" id="firstname" type="text" placeholder="Jane">
        </div>
        <div class="form-group">
          <label class="form-label">Last Name</label>
          <input class="form-input" id="lastname" type="text" placeholder="Doe">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="email" type="email" placeholder="you@example.com">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" id="password" type="password" placeholder="Min 8 characters">
      </div>
      <div class="form-group">
        <label class="form-label">Confirm Password</label>
        <input class="form-input" id="confirm" type="password" placeholder="••••••••">
      </div>
      <button class="btn btn-primary btn-full btn-lg" id="reg-btn">Create Account</button>
      <div class="auth-link-row">
        Already have an account? <a class="auth-link" id="go-login">Sign in</a>
      </div>
    </div>
  </div>`;

  document.getElementById('go-login').onclick = () => navigate('login');

  document.getElementById('reg-btn').onclick = async () => {
    const btn = document.getElementById('reg-btn');
    const err = document.getElementById('auth-err');
    const fname = document.getElementById('firstname').value.trim();
    const lname = document.getElementById('lastname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;

    if (!fname || !email || !password) { err.textContent = 'Please fill in all required fields'; err.classList.remove('hidden'); return; }
    if (password !== confirm) { err.textContent = 'Passwords do not match'; err.classList.remove('hidden'); return; }
    if (password.length < 8) { err.textContent = 'Password must be at least 8 characters'; err.classList.remove('hidden'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Creating account...';
    err.classList.add('hidden');
    try {
      await api.register({ name: `${fname} ${lname}`.trim(), email, password, firstName: fname, lastName: lname });
      toast('Account created! Please sign in.', 'success');
      navigate('login');
    } catch(e) {
      err.textContent = e.message || 'Registration failed';
      err.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  };
});
