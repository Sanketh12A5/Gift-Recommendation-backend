const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Recipient = require('../models/Recipient');
const GiftSuggestion = require('../models/GiftSuggestion');
const { generateGiftSuggestions } = require('../services/openai');

const router = express.Router();

router.post('/recipients', authenticateToken, async (req, res) => {
  try {
    const recipient = new Recipient({
      name: req.name,
      ...req.body,
    });
    await recipient.save();
    res.status(201).json(recipient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/recipients', authenticateToken, async (req, res) => {
  try {
    const recipients = await Recipient.find({ name: req.name }).sort({ createdAt: -1 });
    res.json(recipients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const recipient = await Recipient.findOne({
      name: name,
    });

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const suggestions = await generateGiftSuggestions(recipient);

    const savedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        const giftSuggestion = new GiftSuggestion({
          name,
          ...suggestion,
        });
        return giftSuggestion.save();
      })
    );

    res.json(savedSuggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
