import { useMemo, useState } from 'react';

const useTableSorting = (columns, data) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const items = Array.isArray(data) ? [...data] : [];
    if (!sortConfig.key) return items;
    const column = Array.isArray(columns) ? columns.find(c => c.key === sortConfig.key) : null;
    const dataIndex = column ? column.dataIndex : sortConfig.key;

    const cleanValue = (val) => {
      if (val == null) return -Infinity;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        if (/^[^0-9]+$/.test(val) && val !== '-Infinity' && val !== 'Infinity') {
          return val;
        }
        const cleanStr = val.replace(/,/g, '').replace('%', '').replace(/[¥￥]/g, '').trim();
        const num = parseFloat(cleanStr);
        if (!isNaN(num)) return num;
        return val;
      }
      return val;
    };

    items.sort((a, b) => {
      const aClean = cleanValue(a[dataIndex]);
      const bClean = cleanValue(b[dataIndex]);

      if (typeof aClean === 'string' && typeof bClean === 'string') {
        return sortConfig.direction === 'asc'
          ? aClean.localeCompare(bClean, 'zh-CN')
          : bClean.localeCompare(aClean, 'zh-CN');
      }
      if (aClean < bClean) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aClean > bClean) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [data, columns, sortConfig]);

  return { sortedData, sortConfig, handleSort };
};

export default useTableSorting;
