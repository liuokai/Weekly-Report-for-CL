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
const { generateNewStoreAnalysis } = require('./services/newStoreAnalysisGenerator');
const { generateCityBudgetSummary } = require('./services/cityBudgetSummaryGenerator');
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

// API Route: Generate New Store Analysis
app.post('/api/generate-new-store-analysis', async (req, res) => {
  const { newStoreData, currentTotalStores } = req.body;
  if (!newStoreData) {
    return res.status(400).json({ status: 'error', message: 'Data is required' });
  }
  try {
    const analysis = await generateNewStoreAnalysis(deepseek, newStoreData, currentTotalStores);
    res.json({ status: 'success', data: analysis });
  } catch (error) {
    console.error('Generate Analysis API Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API Route: Generate City Budget Summary
app.post('/api/generate-city-budget-summary', async (req, res) => {
  try {
    // 1. Execute SQL Queries concurrently
    // Note: executeVariableQuery uses file names as keys (without .sql)
    const [
      newStoreAndOperationResults,
      budgetResults,
      newStoreProcessResults
    ] = await Promise.all([
      variableService.executeVariableQuery('cash_flow_new_store_and_cashflow_operation', pool),
      variableService.executeVariableQuery('cash_flow_budget', pool),
      variableService.executeVariableQuery('cash_flow_new_store_process', pool)
    ]);

    // 2. Process Data
    
    // a) Process newStoreAndOperationResults (a, c, completedCities)
    // Find the latest month (last row usually has the latest month, but safer to sort or parse)
    // The query returns cumulative data month by month.
    // The format of '月份' is YYYY-MM.
    
    if (!newStoreAndOperationResults || newStoreAndOperationResults.length === 0) {
        throw new Error("No data returned from cash_flow_new_store_and_cashflow_operation");
    }
    
    // Filter for '合计' rows to get the aggregate numbers
    // In SQL: case when city_name = '合计' then 1 else 0 end -> sorted last
    // Column name for city is 'city_name'
    const totalRows = newStoreAndOperationResults.filter(r => r['city_name'] === '合计');
    
    // Sort by month just in case
    totalRows.sort((a, b) => (a['month'] > b['month'] ? 1 : -1));
    const latestTotalRow = totalRows[totalRows.length - 1];
    
    if (!latestTotalRow) {
         throw new Error("No total row found in cash_flow_new_store_and_cashflow_operation");
    }
    
    const currentMonth = latestTotalRow['month'];
    const a = parseFloat(latestTotalRow['cumulative_cash_flow_actual'] || 0);
    const c = parseFloat(latestTotalRow['cumulative_new_store_investment'] || 0);
    
    // Find completed cities in the current month
    // Filter rows for current month and non-total cities
    const achievedCities = newStoreAndOperationResults
        .filter(r => r['month'] === currentMonth && r['city_name'] !== '合计')
        .filter(r => {
            const rateStr = r['cash_flow_achievement_ratio_display']; // e.g. "105.00%"
            if (!rateStr) return false;
            // Remove % and convert to float
            const rate = parseFloat(rateStr.toString().replace('%', ''));
            return rate >= 100;
        })
        .map(r => r['city_name']);
        
    // b) Process budgetResults (b)
    // Sum of 'total_cash_flow_budget' for all records (assuming the query returns all months for the year)
    // cash_flow_budget.sql returns month/city_name breakdown.
    // We just sum everything up to get the annual budget (if the query covers the whole year).
    // The query uses `current_info` but selects from `dws_store_revenue_estimate` which contains full year budget usually?
    // Wait, the SQL `cash_flow_budget.sql` joins with `current_info` but the budgets are selected from `combined_base`.
    // The `combined_base` is `existing_store_base` UNION `new_store_base`.
    // `existing_store_base` selects from `dws_store_revenue_estimate`.
    // We need to confirm if it returns all months.
    // The query does NOT have a WHERE clause restricting months for the budget part (only for progress ratio calculation).
    // So summing all `total_cash_flow_budget` should give the annual budget.
    
    const b = budgetResults.reduce((sum, r) => sum + parseFloat(r.total_cash_flow_budget || 0), 0);

    // c) Process newStoreProcessResults (d)
    // "从当年年初至当前月份对应的合计行的‘新店数量’字段加总"
    // cash_flow_new_store_process.sql returns monthly data.
    // Filter rows where month <= currentMonth and city_name (aliased) is '月度合计'
    
    // Column names: 'month', 'city_name' (aliased from city_name_display), '新店数量'
    // In mysql2 driver, alias is used as key.
    
    const validMonthsProcessRows = newStoreProcessResults.filter(r => r['month'] <= currentMonth);
    const monthlyTotalRows = validMonthsProcessRows.filter(r => r['city_name'] === '月度合计'); 
    
    const d = monthlyTotalRows.reduce((sum, r) => sum + parseFloat(r['new_store_count'] || 0), 0);
    
    // Calculate e
    const e = d > 0 ? (c / d).toFixed(1) : "0.0";

    // 3. Generate Analysis
    const analysisData = {
        currentMonth,
        cumulativeCashFlowActual: a.toFixed(2),
        annualCashFlowBudget: b.toFixed(2),
        achievedCities,
        cumulativeInvestment: c.toFixed(2),
        investmentStoreCount: d,
        avgInvestmentPerStore: e
    };

    const analysis = await generateCityBudgetSummary(deepseek, analysisData);
    
    res.json({
        status: 'success',
        data: analysisData,
        analysis: analysis
    });

  } catch (error) {
    console.error('Generate City Budget Summary API Error:', error);
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
