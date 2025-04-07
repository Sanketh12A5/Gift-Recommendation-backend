const mongoose = require('mongoose');

const giftSuggestionSchema = new mongoose.Schema({
  // recipientId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Recipient',
  //   required: true,
  // },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('GiftSuggestion', giftSuggestionSchema);
