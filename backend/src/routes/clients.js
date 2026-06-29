const router = require('express').Router();
const { getClients, getClient, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER'), getClients);
router.get('/:id', authorize('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER'), getClient);
router.post('/', authorize('ADMIN'), createClient);
router.put('/:id', authorize('ADMIN'), updateClient);
router.delete('/:id', authorize('ADMIN'), deleteClient);

module.exports = router;
