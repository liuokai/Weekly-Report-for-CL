// src/utils/dataLoader.js
/**
 * 数据加载和处理工具
 */

// 解析CSV数据
export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    // 更健壮的CSV行解析
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // 添加最后一个值
    values.push(currentValue.trim());
    
    // 创建行对象
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return { headers, rows };
};

// 获取唯一的值列表
export const getUniqueValues = (data, fieldName) => {
  const values = [...new Set(data.rows.map(row => row[fieldName]))];
  return values.filter(value => value).sort();
};

// 获取指标字段（排除指定字段）
export const getMetricsFields = (headers, excludeFields = []) => {
  return headers.filter(header => !excludeFields.includes(header));
};

// 根据条件过滤数据
export const filterData = (data, filters) => {
  return data.rows.filter(row => {
    return Object.keys(filters).every(key => {
      const filterValue = filters[key];
      if (!filterValue || filterValue.length === 0) return true;
      
      if (Array.isArray(filterValue)) {
        // 多选过滤
        return filterValue.includes(row[key]) || filterValue.includes('全部');
      } else {
        // 单选过滤
        return row[key] === filterValue;
      }
    });
  });
};