const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const axios = require('axios');
const queryRegistry = require('./queryRegistry');

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

// API Route: Fetch Data
app.post('/api/fetch-data', async (req, res) => {
  const { queryKey, params = [] } = req.body;

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

    res.json(result);

  } catch (error) {
    if (connection) connection.release();
    console.error('Data fetch failed:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API Route: Dify Workflow Proxy
app.post('/api/dify/run-workflow', async (req, res) => {
  const { inputs, user } = req.body;

  try {
    const response = await axios.post(
      process.env.DIFY_BASE_URL,
      {
        inputs: inputs || {},
        response_mode: 'blocking',
        user: user || process.env.DIFY_USER || 'changle-user'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Dify API Error:', error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).json({
      status: 'error',
      message: error.response ? error.response.data : 'Failed to call Dify API'
    });
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
