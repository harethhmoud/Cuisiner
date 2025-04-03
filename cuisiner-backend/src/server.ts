import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import recipeRoutes from './routes/recipe.routes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Cuisiner API is running');
});

// Connect to MongoDB only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cuisiner';
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });

  // Start server only if this file is run directly
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app; 