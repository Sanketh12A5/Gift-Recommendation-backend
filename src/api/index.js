const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const authRoutes = require('../routes/auth');
const giftRoutes = require('../routes/gifts');

dotenv.config();

const app = express();
//const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(
  {
      origin : ["https://gift-recommendation-frontend.vercel.app/"],
      methods : ["POST", "GET"],
      credentials : true
  }
));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gifts', giftRoutes);

// MongoDB Connection
mongoose.connect(process.env.VITE_MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// app.get("/", (req, res) => {
//   console.log("Get request");
// });


module.exports = app;
