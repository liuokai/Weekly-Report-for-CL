// 数据处理工具函数

// 解析CSV数据
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return { headers, rows };
}

// 获取唯一的年份列表
export function getUniqueYears(data) {
  const years = [...new Set(data.rows.map(row => row['时间']))];
  return years.filter(year => year).sort();
}

// 获取唯一的城市列表
export function getUniqueCities(data) {
  const cities = [...new Set(data.rows.map(row => row['城市']))];
  return cities.filter(city => city).sort();
}

// 获取指标字段（除时间和城市外的其他字段）
export function getMetricsFields(headers) {
  return headers.filter(header => header !== '时间' && header !== '城市');
}

// 根据筛选条件过滤数据
export function filterData(data, selectedYears, selectedCities) {
  return data.rows.filter(row => {
    const yearMatch = selectedYears.length === 0 || selectedYears.includes(row['时间']);
    const cityMatch = selectedCities.length === 0 || selectedCities.includes('全部') || selectedCities.includes(row['城市']) || selectedCities.length === 0;
    return yearMatch && cityMatch;
  });
}