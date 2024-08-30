const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rate: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Tax', taxSchema);