const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', authenticate, authorize('ADMIN'), getDashboard);

module.exports = router;
