const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const MONGODB_URI = process.env.VITE_MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['core', 'admin'],
    default: 'core',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Recipient Schema
const recipientSchema = new mongoose.Schema({
  //userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 0 },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  relationship: { type: String, required: true },
  interests: [{ type: String }],
  occasion: { type: String, required: true },
  budget: {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

// Gift Suggestion Schema
const giftSuggestionSchema = new mongoose.Schema({
  //recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  link: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Saved Gift Schema
const savedGiftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  giftSuggestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GiftSuggestion', required: true },
  createdAt: { type: Date, default: Date.now },
});

// User methods
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Recipient = mongoose.models.Recipient || mongoose.model('Recipient', recipientSchema);
const GiftSuggestion = mongoose.models.GiftSuggestion || mongoose.model('GiftSuggestion', giftSuggestionSchema);
const SavedGift = mongoose.models.SavedGift || mongoose.model('SavedGift', savedGiftSchema);

// DB Connection
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// Auth Functions
async function signUp(email, password) {
  await connectDB();
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('User already exists');

  const user = new User({ email, password });
  await user.save();
  const token = user.generateToken();

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

async function signIn(email, password) {
  await connectDB();
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid login credentials');
  }
  const token = user.generateToken();
  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

async function getCurrentUser(token) {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.id).select('-password');
    return user ? { id: user._id, email: user.email, role: user.role } : null;
  } catch (error) {
    return null;
  }
}

async function isAdmin(userId) {
  await connectDB();
  const user = await User.findById(userId);
  return user?.role === 'admin';
}

Gift-Related
async function saveRecipient(userId, recipientData) {
  await connectDB();
  const recipient = new Recipient({ userId, ...recipientData });
  await recipient.save();
  return recipient;
}

async function saveGiftSuggestion(name, giftData) {
  await connectDB();
  const suggestion = new GiftSuggestion({ name, ...giftData });
  await suggestion.save();
  return suggestion;
}

async function saveGift(userId, giftSuggestionId) {
  await connectDB();
  const savedGift = new SavedGift({ userId, giftSuggestionId });
  await savedGift.save();
  return savedGift;
}

async function getSavedGifts(userId) {
  await connectDB();
  return SavedGift.find({ userId })
    .populate('giftSuggestionId')
    .sort({ createdAt: -1 });
}

async function getRecipients(name) {
  await connectDB();
  return Recipient.find({ name }).sort({ createdAt: -1 });
}

module.exports = {
  connectDB,
  User,
  Recipient,
  GiftSuggestion,
  SavedGift,
  signUp,
  signIn,
  getCurrentUser,
  isAdmin,
  saveRecipient,
  saveGiftSuggestion,
  saveGift,
  getSavedGifts,
  getRecipients,
};
