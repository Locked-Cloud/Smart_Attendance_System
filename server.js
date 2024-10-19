const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './.env' }); // Load environment variables

process.on('uncaughtException', (err) => {
  console.log('Shutting down due to an uncaught exception... 💣');
  console.log(err.name, err.message);
  process.exit(1);
});
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD || '' // Use an empty string if DATABASE_PASSWORD is not defined
);
// Connect to MongoDB
mongoose
  .connect(DB)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log('Shutting down due to an unhandled rejection... 💣');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
