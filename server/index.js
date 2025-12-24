require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const queryRegistry = require('./queryRegistry');
const { generateAnalysis } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Pool (Doris)
// Using mysql2 which is compatible with Doris MySQL protocol
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 9030, // Default Doris FE query port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// API Route: Fetch Data (with optional AI Analysis)
app.post('/api/fetch-data', async (req, res) => {
  const { queryKey, params = [], analyze = false } = req.body;

  // 1. Validate Query Key
  const queryConfig = queryRegistry[queryKey];
  if (!queryConfig) {
    return res.status(400).json({ status: 'error', message: 'Invalid query key' });
  }

  let connection;
  try {
    // 2. Execute SQL Query
    connection = await pool.getConnection();
    // Use .query() instead of .execute() because Doris might not support prepared statements
    const [rows] = await connection.query(queryConfig.sql, params);
    connection.release();

    const result = {
      status: 'success',
      data: rows,
      analysis: null
    };

    // 3. Optional AI Analysis
    // Check if analysis is requested, template exists, and Dify is enabled for this query
    if (analyze && queryConfig.promptTemplate && queryConfig.enableDify) {
      try {
        console.log(`Starting AI analysis for ${queryKey}...`);
        const analysisResult = await generateAnalysis(rows, queryConfig.promptTemplate);
        result.analysis = analysisResult;
      } catch (aiError) {
        console.error('AI Analysis failed but data is intact:', aiError);
        // We don't fail the whole request if AI fails, just return data with error note
        result.analysis = 'Error generating analysis. Please try again later.';
      }
    }

    res.json(result);

  } catch (error) {
    if (connection) connection.release();
    console.error('Data fetch failed:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Test Database Connection
app.get('/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
