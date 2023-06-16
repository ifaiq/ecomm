const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['customer', 'superadmin'], default: 'customer' } // Update the role field
});

module.exports = mongoose.model('User', userSchema);
