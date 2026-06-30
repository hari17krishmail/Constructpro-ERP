const Project = require('../models/Project');

const getProjects = async (req, res) => {
  const projects = await Project.find({})
    .sort({ createdAt: -1 })
    .lean();

  res.json(projects);
};

const getProject = async (req, res) => {
  const project = await Project.findById(req.params.id).lean();
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
};

const createProject = async (req, res) => {
  const { name, price } = req.body;

  const project = await Project.create({ name, price, });

  res.status(201).json(project);
};

const updateProject = async (req, res) => {
  const { name, price } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { name, price },
    { new: true, runValidators: true }
  ).lean();
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
};

const deleteProject = async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json({ message: 'Project deleted' });
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
