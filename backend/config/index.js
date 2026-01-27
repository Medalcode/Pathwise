const path = require('path');
const dotenv = require('dotenv');

// Load .env early
dotenv.config();

const DB_FILENAME = process.env.DB_FILENAME || 'autoapply.db';
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'database', DB_FILENAME);

const config = {
  // Server
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,

  // Persistence / storage
  GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME || null,
  DB_FILENAME,
  DB_PATH: process.env.DB_PATH || DEFAULT_DB_PATH,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',

  // AI / external
  GROQ_API_KEY: process.env.GROQ_API_KEY || null
};

function validate() {
  // Lightweight checks and helpful warnings (non-fatal)
  if (!config.GCS_BUCKET_NAME) {
    console.log('⚠️  GCS_BUCKET_NAME not set — cloud backups disabled.');
  }
  if (!config.GROQ_API_KEY) {
    console.log('⚠️  GROQ_API_KEY not set — AI features disabled.');
  }
}

validate();

module.exports = config;
