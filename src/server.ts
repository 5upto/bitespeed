import express from 'express';
import bodyParser from 'body-parser';
import { identifyContact } from './controller/contactController';
import { setupDatabase } from './database/setup';

const app = express();
const PORT = process.env.PORT||8080;

// Middleware
app.use(bodyParser.json());

// Routes
app.post('/identify', identifyContact);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start server
async function startServer() {
  try {
    // Setup database
    await setupDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();