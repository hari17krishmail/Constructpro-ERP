const Invoice = require('../models/Invoice');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recalculate line totals, subtotal, taxAmount, and total server-side.
 * Never trusts numbers coming from the request body.
 */
const recalculate = (lineItems, taxRate) => {
  const items = lineItems.map((item) => ({
    ...item,
    lineTotal: Number((item.quantity * item.unitPrice).toFixed(2)),
  }));
  const subtotal = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
  const rate = Math.max(0, Math.min(100, taxRate || 0));
  const taxAmount = Number(((subtotal * rate) / 100).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));
  return { items, subtotal, taxAmount, total, taxRate: rate };
};


const buildScopeFilter = async (user) => {
  if (user.role === 'CLIENT_VIEWER') {
    return { status: { $in: ['APPROVED', 'PAID'] } };
  }

  return {}; // PM, ADMIN, ACCOUNTANT see everything; controller enforces per-role actions
};

const POPULATE_OPTS = [
  { path: 'projectId' },
  { path: 'client', select: 'name email clientId' },
  { path: 'createdBy', select: 'name email role' },
  { path: 'approvedBy', select: 'name email role' },
];

// Status transition rules

const ALLOWED_TRANSITIONS = {
  DRAFT: { PENDING_APPROVAL: ['ACCOUNTANT'] },
  PENDING_APPROVAL: {
    APPROVED: ['PROJECT_MANAGER'],
    REJECTED: ['PROJECT_MANAGER'],
  },
  APPROVED: { SENT: ['ACCOUNTANT'], PAID: ['CLIENT_VIEWER'] },
  SENT: { PAID: ['ACCOUNTANT'] },
  REJECTED: { DRAFT: ['ACCOUNTANT'] },
};

// Controllers

const getInvoices = async (req, res) => {
  const scopeFilter = await buildScopeFilter(req.user);

  // Optional query filters (project, status)
  if (req.query.projectId) scopeFilter.projectId = req.query.projectId;
  if (req.query.status) {
    // CLIENT_VIEWER status filter is already locked to [APPROVED, SENT, PAID]; let them
    // narrow further but not expand beyond what scope allows.
    if (scopeFilter.status) {
      const allowed = scopeFilter.status.$in;
      const requested = req.query.status;
      scopeFilter.status = allowed.includes(requested)
        ? requested
        : { $in: allowed };
    } else {
      scopeFilter.status = req.query.status;
    }
  }

  const invoices = await Invoice.find(scopeFilter)
    .populate(POPULATE_OPTS)
    .sort({ createdAt: -1 })
    .lean();

  res.json(invoices);
};

const getInvoice = async (req, res) => {
  const scopeFilter = await buildScopeFilter(req.user);
  scopeFilter._id = req.params.id;

  // Single query — if this user has no access to the invoice it simply
  // won't be found, returning 404 rather than leaking that it exists.
  const invoice = await Invoice.findOne(scopeFilter).populate(POPULATE_OPTS).lean();
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  res.json(invoice);
};

const createInvoice = async (req, res) => {
  const { projectId, client, issueDate, dueDate, lineItems = [], taxRate } = req.body;

  const { items, subtotal, taxAmount, total, taxRate: rate } = recalculate(lineItems, taxRate);

  const invoice = await Invoice.create({
    projectId,
    client: client || null,
    issueDate,
    dueDate,
    lineItems: items,
    subtotal,
    taxRate: rate,
    taxAmount,
    total,
    createdBy: req.user._id,
  });

  const populated = await Invoice.findById(invoice._id).populate(POPULATE_OPTS).lean();
  res.status(201).json(populated);
};

const updateInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  // Only DRAFT invoices can be edited
  if (invoice.status !== 'DRAFT') {
    return res.status(422).json({
      message: `Invoice cannot be edited in status "${invoice.status}". Only DRAFT invoices are editable.`,
    });
  }

  const { projectId, client, issueDate, dueDate, lineItems = [], taxRate } = req.body;
  const { items, subtotal, taxAmount, total, taxRate: rate } = recalculate(lineItems, taxRate);

  invoice.projectId = projectId ?? invoice.projectId;
  invoice.client    = client !== undefined ? (client || null) : invoice.client;
  invoice.issueDate = issueDate ?? invoice.issueDate;
  invoice.dueDate   = dueDate ?? invoice.dueDate;
  invoice.lineItems = items;
  invoice.subtotal = subtotal;
  invoice.taxRate = rate;
  invoice.taxAmount = taxAmount;
  invoice.total = total;

  await invoice.save();

  const populated = await Invoice.findById(invoice._id).populate(POPULATE_OPTS).lean();
  res.json(populated);
};

// Status transitions — one controller per transition for clarity

const transitionStatus = async (req, res, fromStatus, toStatus) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  if (invoice.status !== fromStatus) {
    return res.status(422).json({
      message: `Cannot perform this action. Invoice is "${invoice.status}", expected "${fromStatus}".`,
    });
  }

  const allowedRoles = ALLOWED_TRANSITIONS[fromStatus]?.[toStatus] ?? [];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Your role cannot perform this status change.' });
  }

  invoice.status = toStatus;
  if (toStatus === 'APPROVED') invoice.approvedBy = req.user._id;
  if (toStatus === 'REJECTED') invoice.rejectionNote = req.body.note || '';
  if (toStatus === 'DRAFT') invoice.rejectionNote = ''; // re-draft clears note

  await invoice.save();

  const populated = await Invoice.findById(invoice._id).populate(POPULATE_OPTS).lean();
  res.json(populated);
};

const submitInvoice   = (req, res) => transitionStatus(req, res, 'DRAFT',    'PENDING_APPROVAL');
const sendInvoice     = (req, res) => transitionStatus(req, res, 'APPROVED', 'SENT');
const markPaid        = (req, res) => transitionStatus(req, res, 'SENT',     'PAID');
const redraftInvoice  = (req, res) => transitionStatus(req, res, 'REJECTED', 'DRAFT');
const clientPayInvoice = (req, res) => transitionStatus(req, res, 'APPROVED', 'PAID');

// PROJECT_MANAGER: set status to PENDING_APPROVAL | APPROVED | REJECTED via dropdown
const setInvoiceStatus = async (req, res) => {
  const { status, note } = req.body;
  const PM_STATUSES = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'];

  if (!PM_STATUSES.includes(status)) {
    return res.status(422).json({ message: 'Status must be Pending Approval, Approved, or Rejected.' });
  }
  if (status === 'REJECTED' && !note?.trim()) {
    return res.status(422).json({ message: 'Rejection reason is required.' });
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  invoice.status = status;
  if (status === 'APPROVED')          invoice.approvedBy    = req.user._id;
  if (status === 'REJECTED')          invoice.rejectionNote = note.trim();
  if (status === 'PENDING_APPROVAL') { invoice.approvedBy = null; invoice.rejectionNote = ''; }

  await invoice.save();

  const populated = await Invoice.findById(invoice._id).populate(POPULATE_OPTS).lean();
  res.json(populated);
};

const deleteInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  if (invoice.status !== 'DRAFT') {
    return res.status(422).json({ message: 'Only DRAFT invoices can be deleted.' });
  }
  await invoice.deleteOne();
  res.json({ message: 'Invoice deleted' });
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  submitInvoice,
  setInvoiceStatus,
  sendInvoice,
  markPaid,
  redraftInvoice,
  clientPayInvoice,
  deleteInvoice,
};
