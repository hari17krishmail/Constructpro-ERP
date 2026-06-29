require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const app = express();

// Connect to MongoDB
connectDB().catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

app.use(( req, res, next ) =>{
  console.log("hitted", req.headers, req.originalUrl, req.origin)
  next()
});
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use(( req, res, next ) =>{
  console.log("hitted1", req.headers, req.originalUrl, req.origin)
  next()
})

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/clients', require('./src/routes/clients'));
app.use('/api/projects', require('./src/routes/projects'));
app.use('/api/invoices', require('./src/routes/invoices'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

// Global error handler — never leak stack traces to clients
app.use((err, req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
