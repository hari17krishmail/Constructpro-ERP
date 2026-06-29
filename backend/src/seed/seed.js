require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');

const PASSWORD_HASH = bcrypt.hashSync('password', 12);

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Invoice.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // ------------------------------------------------------------------
  // Users (all have password: "password")
  // Skip bcrypt pre-save by using insertMany with pre-hashed passwords.
  // clientId is manually set here since insertMany bypasses pre-save hooks.
  // ------------------------------------------------------------------
  const [admin, accountant, pmJohn, pmSarah, buildright, skyline] = await User.insertMany([
    {
      name: 'Alice Admin',
      email: 'admin@constructpro.com',
      password: PASSWORD_HASH,
      role: 'ADMIN',
      clientId: 1,
    },
    {
      name: 'Bob Accountant',
      email: 'accountant@constructpro.com',
      password: PASSWORD_HASH,
      role: 'ACCOUNTANT',
      clientId: 2,
    },
    {
      name: 'John Manager',
      email: 'pm.john@constructpro.com',
      password: PASSWORD_HASH,
      role: 'PROJECT_MANAGER',
      clientId: 3,
    },
    {
      name: 'Sarah Manager',
      email: 'pm.sarah@constructpro.com',
      password: PASSWORD_HASH,
      role: 'PROJECT_MANAGER',
      clientId: 4,
    },
    {
      name: 'BuildRight Corp',
      email: 'client.buildright@constructpro.com',
      password: PASSWORD_HASH,
      role: 'CLIENT_VIEWER',
      clientId: 5,
    },
    {
      name: 'Skyline Developers',
      email: 'client.skyline@constructpro.com',
      password: PASSWORD_HASH,
      role: 'CLIENT_VIEWER',
      clientId: 6,
    },
  ]);
  console.log('Users created');

  // ------------------------------------------------------------------
  // Projects
  // ------------------------------------------------------------------
  const [downtown, riverside, techhub] = await Project.insertMany([
    { name: 'Downtown Office Complex', price: 0 },
    { name: 'Riverside Apartments', price: 0 },
    { name: 'Tech Hub Renovation', price: 0 },
  ]);
  console.log('Projects created');

  // ------------------------------------------------------------------
  // Invoices
  // ------------------------------------------------------------------
  const invoicesData = [
    {
      // SENT invoice — visible to BuildRight client viewer
      projectId: downtown._id,
      status: 'SENT',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      lineItems: [
        { description: 'Foundation work', category: 'LABOR', quantity: 120, unitPrice: 85 },
        { description: 'Concrete & rebar', category: 'MATERIALS', quantity: 50, unitPrice: 320 },
        { description: 'Crane rental', category: 'EQUIPMENT', quantity: 5, unitPrice: 1200 },
      ],
      taxRate: 10,
      createdBy: accountant._id,
      approvedBy: pmJohn._id,
    },
    {
      // DRAFT invoice — only visible to ADMIN/ACCOUNTANT
      projectId: riverside._id,
      status: 'DRAFT',
      issueDate: new Date('2024-02-01'),
      dueDate: new Date('2024-03-01'),
      lineItems: [
        { description: 'Framing labour', category: 'LABOR', quantity: 200, unitPrice: 75 },
        { description: 'Timber & insulation', category: 'MATERIALS', quantity: 80, unitPrice: 210 },
      ],
      taxRate: 10,
      createdBy: accountant._id,
    },
    {
      // PENDING_APPROVAL — visible to PM Sarah and ADMIN/ACCOUNTANT
      projectId: riverside._id,
      status: 'PENDING_APPROVAL',
      issueDate: new Date('2024-02-10'),
      dueDate: new Date('2024-03-10'),
      lineItems: [
        { description: 'Electrical wiring', category: 'LABOR', quantity: 150, unitPrice: 95 },
        { description: 'Wiring materials', category: 'MATERIALS', quantity: 30, unitPrice: 450 },
        { description: 'Lift platform', category: 'EQUIPMENT', quantity: 3, unitPrice: 800 },
      ],
      taxRate: 8,
      createdBy: accountant._id,
    },
    {
      // PAID invoice — visible to BuildRight client viewer
      projectId: techhub._id,
      status: 'PAID',
      issueDate: new Date('2023-12-01'),
      dueDate: new Date('2024-01-01'),
      lineItems: [
        { description: 'Demolition & clearance', category: 'LABOR', quantity: 80, unitPrice: 90 },
        { description: 'Demolition equipment', category: 'EQUIPMENT', quantity: 2, unitPrice: 2500 },
        { description: 'Site cleanup', category: 'OTHER', quantity: 1, unitPrice: 3000 },
      ],
      taxRate: 10,
      createdBy: accountant._id,
      approvedBy: pmJohn._id,
    },
    {
      // REJECTED invoice
      projectId: downtown._id,
      status: 'REJECTED',
      issueDate: new Date('2024-01-20'),
      dueDate: new Date('2024-02-20'),
      lineItems: [
        { description: 'Project management hours', category: 'LABOR', quantity: 40, unitPrice: 150 },
      ],
      taxRate: 5,
      createdBy: accountant._id,
      rejectionNote: 'Line items need more detail. Please break down the project management hours by task.',
    },
  ];

  // Calculate server-side totals for seed data
  for (const inv of invoicesData) {
    inv.lineItems = inv.lineItems.map((item) => ({
      ...item,
      lineTotal: Number((item.quantity * item.unitPrice).toFixed(2)),
    }));
    inv.subtotal = Number(inv.lineItems.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));
    inv.taxAmount = Number(((inv.subtotal * inv.taxRate) / 100).toFixed(2));
    inv.total = Number((inv.subtotal + inv.taxAmount).toFixed(2));
  }

  await Invoice.insertMany(invoicesData);
  console.log('Invoices created');

  console.log('\n--- Seed complete ---');
  console.log('Demo users (all passwords: "password"):');
  console.log('  admin@constructpro.com             → ADMIN');
  console.log('  accountant@constructpro.com        → ACCOUNTANT');
  console.log('  pm.john@constructpro.com           → PROJECT_MANAGER');
  console.log('  pm.sarah@constructpro.com          → PROJECT_MANAGER');
  console.log('  client.buildright@constructpro.com → CLIENT_VIEWER (BuildRight Corp)');
  console.log('  client.skyline@constructpro.com    → CLIENT_VIEWER (Skyline Developers)');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
