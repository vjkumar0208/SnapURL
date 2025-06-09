import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import {nanoid} from 'nanoid';
import QRCode from 'qrcode';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// Increase payload size limit for profile photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Atlas connection string with retry options
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://uniquevijay0208:your_password_here@cluster0.v3bkanu.mongodb.net/url-shortener?retryWrites=true&w=majority";

const connectWithRetry = () => {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s
  })
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB Atlas:', err.message);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  });
};

// Initial connection
connectWithRetry();

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  console.log('Attempting to reconnect...');
  connectWithRetry();
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectWithRetry();
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  profilePhoto: { type: String, default: '' }
});

const User = mongoose.model('User', userSchema);

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  clicks: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const Url = mongoose.model('Url', urlSchema);

// User routes
app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ 
      name, 
      email, 
      password: hashedPassword 
    });
    await user.save();

    // Don't send password back
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto
    };

    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        error: 'Account not found. Please check your email or sign up.' 
      });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password. Please try again.' 
      });
    }

    // Don't send password back
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, profilePhoto, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If updating password
    if (currentPassword && newPassword) {
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Validate new password
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long' });
      }

      if (!/(?=.*[a-z])/.test(newPassword)) {
        return res.status(400).json({ error: 'New password must contain at least one lowercase letter' });
      }

      if (!/(?=.*[A-Z])/.test(newPassword)) {
        return res.status(400).json({ error: 'New password must contain at least one uppercase letter' });
      }

      if (!/(?=.*\d)/.test(newPassword)) {
        return res.status(400).json({ error: 'New password must contain at least one number' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    // Update other fields if provided
    if (name) user.name = name;
    if (profilePhoto) user.profilePhoto = profilePhoto;

    await user.save();

    // Don't send password back
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.put('/api/users/:userId/password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one lowercase letter' });
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one uppercase letter' });
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one number' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

app.get('/api/users/:userId/urls', async (req, res) => {
  try {
    const { userId } = req.params;
    const urls = await Url.find({ userId }).sort({ createdAt: -1 });
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update URL creation to include userId
const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.post('/api/short', async (req, res) => {
    try {
        const { originalUrl, userId } = req.body;
        if(!originalUrl) return res.status(400).json({error: 'Original URL error'});
        const shortUrl = nanoid(10);
        const url = new Url({
            originalUrl,
            shortUrl,
            userId
        });
        const myUrl = `${BASE_URL}/${shortUrl}`;
        const qrCodeImg = await QRCode.toDataURL(myUrl);
        await url.save();
        return res.status(200).json({
            message: 'URL shortened successfully',
            shortUrl,
            fullShortUrl: myUrl,
            qrCodeImg,
            clicks: url.clicks
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Server Error'});
    }
});

app.get('/:shortUrl', async (req, res) => {
    try {
        const { shortUrl } = req.params;
        const url=await Url.findOne({shortUrl});
        if(url){
            url.clicks++;
            await url.save();
            return res.redirect(url.originalUrl);
        }
        else{
            return res.status(404).json({message: 'URL not found'});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({error: ' Server Error'});
        
    }
})

app.get('/api/url-info/:shortUrl', async (req, res) => {
    try {
        const { shortUrl } = req.params;
        const url = await Url.findOne({ shortUrl });
        if (!url) return res.status(404).json({ message: 'URL not found' });

        return res.status(200).json({
            originalUrl: url.originalUrl,
            shortUrl: url.shortUrl,
            fullShortUrl: `${BASE_URL}/${url.shortUrl}`,
            clicks: url.clicks
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Update port configuration
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

