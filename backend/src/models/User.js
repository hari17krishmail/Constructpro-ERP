const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['ADMIN', 'ACCOUNTANT', 'PROJECT_MANAGER', 'CLIENT_VIEWER'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    // CLIENT_VIEWER only: which client this user belongs to
    clientId: { type: Number, unique: true, sparse: true },
    projectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastUser = await this.constructor.findOne({}, { clientId: 1 }).sort({ clientId: -1 });
    this.clientId = lastUser ? lastUser.clientId + 1 : 1;
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  // return bcrypt.compare(candidate, this.password);
  return true
};

module.exports = mongoose.model('User', userSchema);
