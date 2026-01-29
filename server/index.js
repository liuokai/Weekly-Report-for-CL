const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const axios = require('axios');
const queryRegistry = require('./queryRegistry');
const fs = require('fs');
const OpenAI = require('openai');
const { generateReminder } = require('./services/reminderGenerator');
const variableService = require('./services/variableService');
const difyWorkflows = require('./config/difyWorkflows');
const cacheService = require('./services/cacheService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// DeepSeek Client
const deepseek = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
});

// Database Connection Pool (Doris)
// Using mysql2 which is compatible with Doris MySQL protocol
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 9030, // Default Doris FE query port
  waitForConnections: true,
  connectionLimit: 50, // Increased to handle concurrent frontend requests
  queueLimit: 0,
  connectTimeout: 60000, // 60s connection timeout
  acquireTimeout: 60000 // 60s acquire timeout
});

// Set global server timeout
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
server.timeout = 300000; // 5 minutes global timeout
server.keepAliveTimeout = 300000; // 5 minutes keep-alive timeout

// API Route: Fetch Data
app.post('/api/fetch-data', async (req, res) => {
  const { queryKey, params = [] } = req.body;

  // 1. Validate Query Key
  const queryConfig = queryRegistry[queryKey];
  if (!queryConfig) {
    return res.status(400).json({ status: 'error', message: 'Invalid query key' });
  }

  // 1.5 Check Cache
  const cachedData = cacheService.get(queryKey, params);
  if (cachedData) {
    console.log(`[Cache Hit] ${queryKey}`);
    return res.json({
      status: 'success',
      data: cachedData,
      analysis: null,
      fromCache: true
    });
  }

  let connection;
  try {
    // 2. Execute SQL Query
    console.log(`[Query Start] ${queryKey}`);
    const startTime = Date.now();
    connection = await pool.getConnection();
    await connection.query('SET enable_fallback_to_original_planner = true');
    await connection.query('SET enable_nereids_planner = false');
    // Use .query() instead of .execute() because Doris might not support prepared statements
    const [rows] = await connection.query(queryConfig.sql, params);
    connection.release();
    const duration = Date.now() - startTime;
    console.log(`[Query End] ${queryKey} - ${duration}ms - Rows: ${rows ? rows.length : 0}`);

    // Post-processing filters for specific queries
    try {
      if (queryKey === 'getStaffServiceDurationCityMonthly' && params && params.city) {
        rows = rows.filter(r => {
          const cityName = r.statistics_city_name || r.city || r.statistics_city;
          return cityName === params.city;
        });
      }
      if (queryKey === 'getStaffServiceDurationStoreMonthly' && params && params.city) {
        rows = rows.filter(r => {
          const cityName = r.statistics_city_name || r.city || r.statistics_city;
          return cityName === params.city;
        });
      }
      if (queryKey === 'getStaffServiceDurationBelowStandardCityMonthly' && params && params.city) {
        rows = rows.filter(r => {
          const cityName = r.city_name || r.statistics_city_name || r.city || r.statistics_city;
          return cityName === params.city;
        });
      }
    } catch (e) {
      console.warn(`[PostProcess Warn] ${queryKey} filter failed:`, e?.message);
    }

    // Save to Cache
    cacheService.set(queryKey, params, rows);

    const result = {
      status: 'success',
      data: rows,
      analysis: null
    };

    res.json(result);

  } catch (error) {
    if (connection) connection.release();
    console.error('Data fetch failed:', error);

    // Mock Data Fallback for specific queries (e.g., when tables are missing)
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("does not exist")) {
      console.warn(`Database table missing for query ${queryKey}, returning mock data.`);
      
      if (queryKey === 'getVolumeCityModalStoreData') {
        // Mock data for Store Volume Modal
        const mockData = [];
        const stores = ['门店A', '门店B', '门店C', '门店D', '门店E'];
        const months = Array.from({length: 12}, (_, i) => `${i + 1}月`);
        
        stores.forEach(store => {
          months.forEach(month => {
            mockData.push({
              store_name: store,
              month: month,
              value: Math.floor(Math.random() * 1000) + 500
            });
          });
        });
        
        return res.json({
          status: 'success',
          data: mockData,
          analysis: null,
          isMock: true
        });
      }
    }

    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API Route: Generate Reminder
app.post('/api/generate-reminder', async (req, res) => {
  const { metricsData } = req.body;
  
  if (!metricsData) {
    return res.status(400).json({ status: 'error', message: 'Metrics data is required' });
  }

  try {
    const reminder = await generateReminder(deepseek, metricsData);
    res.json({ status: 'success', data: reminder });
  } catch (error) {
    console.error('Generate Reminder API Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API Route: Dify Workflow Proxy
app.post('/api/dify/run-workflow', async (req, res) => {
  const { inputs, user } = req.body;

  try {
    // Construct full URL by appending endpoint if not present
    let baseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    // Remove /workflows/run if already present to avoid duplication, then append it fresh
    // Or simpler: just ensure we append if it's a base URL.
    // User requested: Env has base URL (e.g. .../v1), we append /workflows/run
    const fullUrl = baseUrl.endsWith('workflows/run') ? baseUrl : `${baseUrl}workflows/run`;

    const response = await axios.post(
      fullUrl,
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

// --- Smart Analysis Configuration Routes ---

// Get available data variables (SQL files)
app.get('/api/analysis/variables', (req, res) => {
  const variables = variableService.getAvailableVariables();
  res.json({ status: 'success', data: variables });
});

// Get available Dify workflows
app.get('/api/analysis/workflows', (req, res) => {
  // Return list without sensitive API keys
  const workflows = difyWorkflows.map(wf => ({
    id: wf.id,
    name: wf.name,
    description: wf.description
  }));
  res.json({ status: 'success', data: workflows });
});

// Execute Smart Analysis (Fetch Data + Call Dify)
app.post('/api/analysis/execute-smart-analysis', async (req, res) => {
  const { variableKeys, staticData, workflowId, user } = req.body;

  const hasVariables = variableKeys && Array.isArray(variableKeys) && variableKeys.length > 0;
  const hasStaticData = staticData && typeof staticData === 'object' && Object.keys(staticData).length > 0;

  if (!hasVariables && !hasStaticData) {
    return res.status(400).json({ status: 'error', message: 'No data variables or static data selected' });
  }

  // 1. Find Workflow
  const workflow = difyWorkflows.find(wf => wf.id === workflowId);
  if (!workflow) {
    return res.status(400).json({ status: 'error', message: 'Invalid workflow ID' });
  }

  try {
    // 2. Fetch Data for all variables
    const dataContext = {};
    
    if (hasVariables) {
      for (const key of variableKeys) {
        try {
          const rows = await variableService.executeVariableQuery(key, pool);
          // Find metadata for readable name
          const metadata = variableService.getAvailableVariables().find(v => v.key === key);
          dataContext[metadata ? metadata.name : key] = rows;
        } catch (err) {
          console.warn(`Failed to fetch data for ${key}:`, err.message);
          dataContext[key] = { error: 'Failed to load data' };
        }
      }
    }

    // Merge static data if provided
    if (hasStaticData) {
      Object.assign(dataContext, staticData);
    }

    // 3. Call Dify
    // We pass the aggregated data as a JSON string in the 'context_data' input
    const difyInputs = {
      context_data: JSON.stringify(dataContext, null, 2)
    };

    const requestBody = {
      inputs: difyInputs,
      response_mode: 'blocking',
      user: user || process.env.DIFY_USER || 'changle-user'
    };

    console.log('Sending request to Dify:', JSON.stringify(requestBody, null, 2));

    // Construct full URL by appending endpoint if not present
    let baseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    const fullUrl = baseUrl.endsWith('workflows/run') ? baseUrl : `${baseUrl}workflows/run`;

    const response = await axios.post(
      fullUrl,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${workflow.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 120s timeout
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('Smart Analysis Error:', error.message);
    if (error.response) {
      console.error('Dify Error Response:', error.response.status, error.response.data);
    }
    
    // Check for specific error types
    let errorMessage = error.message;
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到 Dify 服务 (Connection Refused)。请检查 Dify 是否正在运行，以及端口配置是否正确。';
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorMessage = 'Dify 服务响应超时 (Timeout)。可能是模型运行时间过长，请稍后重试。';
    } else if (error.response) {
      // Try to extract readable message from Dify response
      errorMessage = error.response.data.message || JSON.stringify(error.response.data);
    }

    res.status(500).json({ 
      status: 'error', 
      message: errorMessage
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
