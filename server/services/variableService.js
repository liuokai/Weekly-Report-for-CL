const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const SQL_DIR = path.join(__dirname, '../sqls');

/**
 * Scan the sqls directory and return a list of available variables.
 * Tries to extract a Chinese name from the first line comment.
 */
const getAvailableVariables = () => {
  try {
    const files = fs.readdirSync(SQL_DIR);
    const variables = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(SQL_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const key = file.replace('.sql', '');
        
        // Try to extract a name from comments (e.g., -- Name: 营业额概览)
        // Or just the first line if it starts with --
        let name = key;
        const firstLine = content.split('\n')[0].trim();
        if (firstLine.startsWith('--')) {
          name = firstLine.replace(/^--\s*(Name:)?\s*/i, '').trim();
        }

        return {
          key,
          name, // Chinese name or description
          filename: file
        };
      });
    return variables;
  } catch (error) {
    console.error('Error scanning SQL directory:', error);
    return [];
  }
};

/**
 * Execute a specific SQL file by key.
 * @param {string} key - The filename without extension
 * @param {object} pool - The database connection pool
 */
const executeVariableQuery = async (key, pool) => {
  try {
    const filePath = path.join(SQL_DIR, `${key}.sql`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`SQL file for variable '${key}' not found.`);
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Simple query execution
    // Note: This assumes queries in the folder don't require parameters
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(sql);
      return rows;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`Error executing query for ${key}:`, error);
    throw error;
  }
};

module.exports = {
  getAvailableVariables,
  executeVariableQuery
};
