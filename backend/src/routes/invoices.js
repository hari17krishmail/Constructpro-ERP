const router = require('express').Router();
const {
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
} = require('../controllers/invoiceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

// All authenticated roles can list invoices 
router.get('/', getInvoices);
router.get('/:id', getInvoice);

// accountant only — create, edit, delete
router.post('/', authorize('ACCOUNTANT'), createInvoice);
router.put('/:id', authorize('ACCOUNTANT'), updateInvoice);
router.delete('/:id', authorize('ACCOUNTANT'), deleteInvoice);
router.post('/:id/submit', authorize('ACCOUNTANT'), submitInvoice);
router.post('/:id/send', authorize('ACCOUNTANT'), sendInvoice);
router.post('/:id/pay', authorize('ACCOUNTANT'), markPaid);
router.post('/:id/redraft', authorize('ACCOUNTANT'), redraftInvoice);

// project manager only 
router.put('/:id/status', authorize('PROJECT_MANAGER'), setInvoiceStatus);

// client viewer only 
router.post('/:id/client-pay', authorize('CLIENT_VIEWER'), clientPayInvoice);

module.exports = router;
