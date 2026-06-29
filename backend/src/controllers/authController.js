const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const login = async (req, res) => {
  console.log("reqq");

  try{
  const { email, password } = req.body;
  console.log("reqbody", req.body);
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  console.log("Hi");
  const user = await User.findOne({ email, isActive: true }).select('+password');
  console.log("user", user);
  
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  console.log("Hi2");
  const token = signToken(user._id);
  const { password: _pw, ...userData } = user.toObject();
  res.json({ token, user: userData });
  }
  catch(err){
    console.log("loginerror",err)
  }

};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { login, getMe };
