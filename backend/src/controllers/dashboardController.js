const User = require('../models/User');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');

const getDashboard = async (req, res) => {
  const [totalClients, totalPMs, totalAccountants, totalProjects, invoiceStats] =
    await Promise.all([
      User.countDocuments({ role: 'CLIENT_VIEWER', isActive: true }),
      User.countDocuments({ role: 'PROJECT_MANAGER', isActive: true }),
      User.countDocuments({ role: 'ACCOUNTANT', isActive: true }),
      Project.countDocuments(),
      Invoice.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

  const byStatus = {};
  invoiceStats.forEach(({ _id, count }) => { byStatus[_id] = count; });

  res.json({
    totalClients,
    totalPMs,
    totalAccountants,
    totalProjects,
    totalInvoices: Object.values(byStatus).reduce((s, c) => s + c, 0),
    draft: byStatus.DRAFT || 0,
    pendingApproval: byStatus.PENDING_APPROVAL || 0,
    approved: byStatus.APPROVED || 0,
    sent: byStatus.SENT || 0,
    paid: byStatus.PAID || 0,
    rejected: byStatus.REJECTED || 0,
  });
};

module.exports = { getDashboard };
