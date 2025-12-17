import React, { useState, useMemo } from 'react';
import DataContainer from '../Common/DataContainer';
import DataTable from '../Common/DataTable';

const VolumeDecompositionContainer = () => {
  // 保持空数据状态，去掉填充的数据
  const [data] = useState([]);

  const tableData = useMemo(() => {
    return data.map((row, index) => {
      const currentVol = parseInt(row['今年订单量'] || 0, 10);
      const lastYearVol = parseInt(row['上年订单量'] || 0, 10);
      let yoy = 0;
      if (lastYearVol > 0) {
        yoy = (currentVol - lastYearVol) / lastYearVol * 100;
      }
      
      return {
        key: index,
        city: row['城市名称'],
        currentVolume: currentVol,
        lastYearVolume: lastYearVol,
        yoyRate: `${yoy.toFixed(2)}%`
      };
    });
  }, [data]);

  const columns = [
    { key: 'city', title: '城市名称', dataIndex: 'city' },
    { 
      key: 'currentVolume', 
      title: '今年客次量', 
      dataIndex: 'currentVolume',
      render: (val) => val.toLocaleString()
    },
    { 
      key: 'lastYearVolume', 
      title: '上年客次量', 
      dataIndex: 'lastYearVolume',
      render: (val) => val.toLocaleString()
    },
    { 
      key: 'yoyRate', 
      title: '同比变动', 
      dataIndex: 'yoyRate',
      render: (val) => {
        const num = parseFloat(val);
        const isNegative = num < 0;
        return (
          <span className={isNegative ? 'text-green-600' : 'text-red-600'}>
            {val}
          </span>
        );
      }
    }
  ];

  return (
    <DataContainer
      title="客次量拆解"
      data={{ rows: tableData }}
      renderContent={() => <DataTable data={tableData} columns={columns} />}
    />
  );
};

export default VolumeDecompositionContainer;
