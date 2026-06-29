const mongoose = require('mongoose');

const STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PAID', 'REJECTED'];
const CATEGORIES = ['LABOR', 'MATERIALS', 'EQUIPMENT', 'OTHER'];

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true }, // always server-calculated
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    client:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    default: null },
    status: { type: String, enum: STATUSES, default: 'DRAFT' },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    lineItems: { type: [lineItemSchema], default: [] },
    // Server-calculated totals — never accepted from client
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionNote: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-generate invoice number 
invoiceSchema.pre('save', async function (next) {
  if (this.invoiceNumber) return next();
  const year = new Date().getFullYear();
  const count = await mongoose.model('Invoice').countDocuments();
  this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
