const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, }
  },
  { timestamps: true }
);   

module.exports = mongoose.model('Project', projectSchema);

