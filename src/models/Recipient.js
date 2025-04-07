const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  // userId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true
  // },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  relationship: {
    type: String,
    required: true
  },
  interests: [{
    type: String
  }],
  occasion: {
    type: String,
    required: true
  },
  budget: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recipient', recipientSchema);
