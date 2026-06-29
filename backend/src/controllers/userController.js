const User = require('../models/User');

const STAFF_ROLES = ['ACCOUNTANT', 'PROJECT_MANAGER'];

const getUsers = async (req, res) => {
  const filter = { role: { $in: STAFF_ROLES } };
  if (req.query.role && STAFF_ROLES.includes(req.query.role)) filter.role = req.query.role;
  const users = await User.find(filter).sort({ name: 1 }).lean();
  res.json(users);
};

const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user || !STAFF_ROLES.includes(user.role)) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

const createUser = async (req, res) => {
  if (!STAFF_ROLES.includes(req.body.role)) {
    return res.status(422).json({ message: 'Role must be Accountant or Project Manager.' });
  }
  const user = await User.create(req.body);
  const { password: _pw, ...userData } = user.toObject();
  res.status(201).json(userData);
};

const updateUser = async (req, res) => {
  const { name, email, role, projectIds, isActive } = req.body;

  const user = await User.findById(req.params.id).select('+password');
  if (!user || !STAFF_ROLES.includes(user.role)) return res.status(404).json({ message: 'User not found' });

  if (role !== undefined && !STAFF_ROLES.includes(role)) {
    return res.status(422).json({ message: 'Role must be Accountant or Project Manager.' });
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (projectIds !== undefined) user.projectIds = projectIds;
  if (isActive !== undefined) user.isActive = isActive;
  if (req.body.password) user.password = req.body.password;

  await user.save();
  const { password: _pw, ...userData } = user.toObject();
  res.json(userData);
};

const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user || !STAFF_ROLES.includes(user.role)) return res.status(404).json({ message: 'User not found' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
