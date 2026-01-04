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

// Cache for Cost Structure Mapping
let costStructureMappingCache = null;

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
    console.log(`[Query End] ${queryKey} - ${duration}ms`);

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

// API Route: Cost Structure Analysis
app.get('/api/cost-structure', async (req, res) => {
  try {
    // 1. Get Mapping from DeepSeek (Cached if available)
    if (!costStructureMappingCache) {
      const sqlPath = path.join(__dirname, 'sqls/profit_store_detail_monthly.sql');
      const mdPath = path.join(__dirname, '../src/config/成本结构.md');

      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      const mdContent = fs.readFileSync(mdPath, 'utf8');

      // Extract columns from SQL (simple regex or just pass the whole SQL)
      // Passing the whole SQL is fine, it's not too large.
      
      const prompt = `
        You are a data analyst. I have a SQL query and a Cost Structure Classification Markdown file.
        
        SQL Content:
        ${sqlContent}
        
        Cost Structure Rules (Markdown):
        ${mdContent}
        
        Task:
        1. Identify the SQL column aliases that correspond to each Cost Category defined in the Markdown.
        2. Identify the column representing "Main Business Income" or "Total Revenue".
        3. Identify the column representing "Net Profit" (净利润).
        4. Return a strictly valid JSON object (no markdown formatting, just raw JSON) with this structure:
        {
          "revenue_column": "alias_name_of_revenue",
          "net_profit_column": "alias_name_of_net_profit",
          "categories": [
            {
              "name": "Category Name (Clean name without numbering like '一、')",
              "columns": ["alias_name_1", "alias_name_2"]
            }
          ]
        }
        
        Note: 
        - Remove any numbering (e.g. "一、", "1.") from the category name. Just use "服务费", "推拿师成本", etc.
        - Use the aliases (e.g., '主营业务收入', '服务费') from the SQL, not the English field names.
        - "Artificial Cost" (人工成本) in the markdown says it is a summary of Masseur and Manager costs. If the SQL already has a column for "人工成本", check if I should use the details or the summary. The Markdown lists detailed items. Please map the DETAILED items to the categories (Masseur Cost, Manager Cost, etc.) so we can see the breakdown.
        - Ignore "Profit and Operating Results" indicators as per the markdown, EXCEPT for "Net Profit" which I explicitly asked for separately.
      `;

      const completion = await deepseek.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful assistant that outputs JSON only." }, { role: "user", content: prompt }],
        model: "deepseek-chat",
        temperature: 0.1
      });

      let content = completion.choices[0].message.content;
      // Remove markdown code blocks if present
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        costStructureMappingCache = JSON.parse(content);
        console.log('DeepSeek Mapping Generated:', JSON.stringify(costStructureMappingCache, null, 2));
      } catch (e) {
        console.error('Failed to parse DeepSeek response:', content);
        throw new Error('DeepSeek response was not valid JSON');
      }
    }

    // 2. Execute SQL
    const sqlPath = path.join(__dirname, 'sqls/profit_store_detail_monthly.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    let rows;
    let connection;

    try {
      connection = await pool.getConnection();
      const [result] = await connection.query(sqlContent);
      rows = result;
      connection.release();
    } catch (dbError) {
      if (connection) connection.release();
      console.warn('Database query failed, using mock data for demonstration:', dbError.message);
      
      // Fallback: Generate Mock Data if DB fails
      // This ensures the frontend can still be demonstrated even if DB tables are missing
      rows = Array.from({ length: 20 }, (_, i) => {
        const city = i < 5 ? '成都市' : (i < 10 ? '重庆市' : '深圳市');
        const store = `${city}门店${i + 1}`;
        const storeCode = `S${(i + 1).toString().padStart(5, '0')}`;
        const revenue = 100000 + Math.random() * 50000;
        
        // Simulate costs
        const costs = {
          '服务费': revenue * 0.05,
          '项目提成': revenue * 0.3,
          '超产值奖金': revenue * 0.02,
          '客户经理班次提成': revenue * 0.01,
          '客户经理新客提成': revenue * 0.01,
          '固定租金': 15000,
          '水电费': 2000,
          '折旧费': 1000
        };

        // Construct row based on what we expect the SQL to return (aliases)
        return {
          '城市名称': city,
          '门店名称': store,
          '门店编码': storeCode,
          '主营业务收入': revenue,
          '净利润': revenue * 0.15, // Approx 15% profit
          ...costs
        };
      });
    }

    // 3. Process Data
    const { categories, revenue_column, net_profit_column } = costStructureMappingCache;
    
    // Aggregation Logic
    const cityData = {};
    const storeData = [];

    // Helper to safe parse float
    const parse = (val) => parseFloat(val) || 0;

    rows.forEach(row => {
      const city = row['城市名称'];
      const store = row['门店名称'];
      const storeCode = row['门店编码'];
      const revenue = parse(row[revenue_column]);
      const netProfit = parse(row[net_profit_column]);

      // Initialize City Data
      if (!cityData[city]) {
        cityData[city] = {
          name: city,
          revenue: 0,
          netProfit: 0,
          costs: {}
        };
        categories.forEach(cat => {
          cityData[city].costs[cat.name] = {
            value: 0,
            details: {}
          };
        });
      }

      // Update City Revenue & Net Profit
      cityData[city].revenue += revenue;
      cityData[city].netProfit += netProfit;

      // Prepare Store Row
      const storeRow = {
        city,
        store,
        storeCode,
        revenue,
        netProfit,
        costs: {}
      };

      // Calculate Costs
      categories.forEach(cat => {
        let catSum = 0;
        const details = {};

        cat.columns.forEach(col => {
          const val = parse(row[col]);
          catSum += val;
          details[col] = val; // Store detail for this store
        });
        
        // Update City Category Sum & Details
        cityData[city].costs[cat.name].value += catSum;
        cat.columns.forEach(col => {
          const val = parse(row[col]);
          cityData[city].costs[cat.name].details[col] = (cityData[city].costs[cat.name].details[col] || 0) + val;
        });
        
        // Update Store Category Sum
        storeRow.costs[cat.name] = {
          value: catSum,
          details: details
        };
      });

      storeData.push(storeRow);
    });

    // Format Response (Return Raw Values, Frontend will handle percentages)
    const response = {
      categories: categories.map(c => c.name),
      city_dimension: Object.values(cityData).map(c => ({
        ...c,
        costs: Object.entries(c.costs).map(([name, data]) => ({
          name,
          value: data.value,
          details: Object.entries(data.details).map(([k, v]) => ({ name: k, value: v }))
        }))
      })),
      store_dimension: storeData.map(s => ({
        ...s,
        costs: Object.entries(s.costs).map(([name, data]) => ({
          name,
          value: data.value,
          details: Object.entries(data.details).map(([k, v]) => ({ name: k, value: v }))
        }))
      }))
    };

    res.json({ status: 'success', data: response });

  } catch (error) {
    console.error('Cost Structure API Error:', error);
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
  const { variableKeys, workflowId, user } = req.body;

  if (!variableKeys || !Array.isArray(variableKeys) || variableKeys.length === 0) {
    return res.status(400).json({ status: 'error', message: 'No data variables selected' });
  }

  // 1. Find Workflow
  const workflow = difyWorkflows.find(wf => wf.id === workflowId);
  if (!workflow) {
    return res.status(400).json({ status: 'error', message: 'Invalid workflow ID' });
  }

  try {
    // 2. Fetch Data for all variables
    const dataContext = {};
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

    const response = await axios.post(
      process.env.DIFY_BASE_URL,
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
