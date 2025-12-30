const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('--- Testing DB Connection ---');
  console.log('Loading .env from:', path.join(__dirname, '.env'));
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);

  if (!process.env.DB_HOST) {
    console.error('ERROR: DB_HOST is missing in .env');
    return;
  }

  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 9030,
    connectTimeout: 10000
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('Successfully connected to database!');
    const [rows] = await connection.execute('SELECT 1 as val');
    console.log('Test Query Result:', rows);
    await connection.end();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Connection Failed:', err.message);
  }
}

testConnection();
