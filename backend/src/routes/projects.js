const router = require('express').Router();
const { getProjects, getProject, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER'), getProjects);
router.get('/:id', authorize('ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER'), getProject);
router.post('/', authorize('ADMIN'), createProject);
router.put('/:id', authorize('ADMIN'), updateProject);
router.delete('/:id', authorize('ADMIN'), deleteProject);

module.exports = router;
