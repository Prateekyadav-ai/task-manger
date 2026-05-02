const express=require('express');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const path = require('path');

const app=express();
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'http://[::1]:8080',
  'http://[::1]:5173',
];
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('Blocked CORS origin:', origin);
    callback(new Error('CORS policy does not allow access from this origin.'));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'taskflow');
app.use(express.static(frontendPath));

const authRouter = require('./routes/auth.routes');

app.use('/api/auth', authRouter);
app.use('/api/projects', require('./routes/ProjectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin/users', require('./routes/adminRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports=app;
