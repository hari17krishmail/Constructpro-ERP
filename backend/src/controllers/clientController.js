const User = require('../models/User');

const getClients = async (req, res) => {
  const clients = await User.find({ role: 'CLIENT_VIEWER' })
    .sort({ clientId: 1 })
    .lean();
  res.json(clients);
};
      
const getClient = async (req, res) => {
  const client = await User.findOne({ _id: req.params.id, role: 'CLIENT_VIEWER' }).lean();
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json(client);
};

const createClient = async (req, res) => { 
  const { name, email, password } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  const client = new User({ name, email, password: password || 'password', role: 'CLIENT_VIEWER' });
  await client.save();
  res.status(201).json(client);
};

const updateClient = async (req, res) => {
  const client = await User.findOne({ _id: req.params.id, role: 'CLIENT_VIEWER' });
  if (!client) return res.status(404).json({ message: 'Client not found' });

  const { name, email, isActive, password } = req.body;
  if (name !== undefined) client.name = name;
  if (email !== undefined) client.email = email;
  if (isActive !== undefined) client.isActive = isActive;
  if (password) client.password = password;

  await client.save();
  res.json(client);
};

const deleteClient = async (req, res) => {
  const client = await User.findOneAndDelete({ _id: req.params.id, role: 'CLIENT_VIEWER' });
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json({ message: 'Client deleted' });
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };
