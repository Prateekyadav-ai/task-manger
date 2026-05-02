# TaskFlow — Team Task Manager Frontend

A complete, production-grade frontend for the TaskFlow REST API.

## 🚀 Quick Start

1. **Ensure your backend is running** at `http://localhost:3000`

2. Serve the frontend from a local server so CORS works correctly:
   ```bash
   # Using Python
   python3 -m http.server 8080 --bind 127.0.0.1

   # Using Node.js http-server
   npx http-server . -p 8080 -a localhost

   # Or use the built-in script
   npm install
   npm run serve
   ```

3. Open exactly `http://localhost:8080` in the browser.

> Do not use `http://[::]:8080` or `http://[::1]:8080` manually in the browser. If your browser opens the site at an IPv6 address, close it and re-open it at `http://localhost:8080`.

> If your backend is on a different host or port, set `FRONTEND_ORIGIN` in `backend/auth/.env` or update `auth/src/app.js`.

## 📁 File Structure

```
taskflow/
├── index.html          # Entry point & router bootstrap
├── css/
│   └── style.css       # Complete design system
└── js/
    ├── api.js          # All API calls (maps to your 30 endpoints)
    ├── utils.js        # Shared utilities, router, layout
    ├── auth.js         # Login & Register pages
    ├── dashboard.js    # Dashboard with stats & charts
    ├── projects.js     # Projects list, detail, member management
    ├── tasks.js        # Tasks table, overdue, CRUD modals
    └── admin.js        # Admin user management & profile
```

## ✅ Features Implemented

### Auth (Endpoints 1–7)
- Login / Register forms with validation
- JWT stored in localStorage, sent as `Authorization: Bearer <token>`
- Auto-redirect based on auth state
- Persistent session via `/auth/me` on load

### Dashboard (Endpoints 28–30)
- Stats cards: total projects, tasks, completed, in-progress, overdue
- Recent tasks list
- Overdue tasks panel
- Project progress cards

### Projects (Endpoints 8–14)
- Projects grid with progress bars and member counts
- Create / Edit / Delete project (admin only)
- Project detail page with task list and member list
- Add / Remove members with role selection

### Tasks (Endpoints 15–24)
- Full tasks table with search + multi-filter (status, project, priority)
- Create / Edit / Delete task modals
- Task detail modal
- Inline status toggle (checkbox)
- Overdue tasks page with "Mark Done" action
- PATCH /status support

### Admin (Endpoints 25–27)
- User management table with search & role filter
- View user details with their task list
- Promote/demote admin role with one click

### Profile
- Current user info display
- Personal task stats
- Quick navigation

## 🎨 Design System

- **Font**: Syne (headings) + Instrument Sans (body) + DM Mono (code/labels)
- **Theme**: Dark mode with purple accent (#6c63ff) and green secondary (#22d3a5)
- **Components**: Cards, badges, modals, toasts, data tables, progress bars
- **Animations**: Page transitions, modal entrance, hover states

## 🔧 API Configuration

The base URL is set in `js/api.js`:
```javascript
const BASE = 'http://localhost:3000/api';
```
Change this if your backend runs on a different port or host.

## 🛡️ Role-Based Access

- **Admin**: Can create projects, add/remove members, delete tasks/projects, manage users, change roles
- **Member**: Can view projects they belong to, create tasks, update task status, view dashboard

## Notes

- All API calls include `Authorization: Bearer <token>` header
- 401 responses automatically redirect to login
- Toast notifications for all success/error states
- Confirmation dialogs for destructive actions
