import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';
import useTableSorting from '../../components/Common/useTableSorting';

const NewStoreSupplyContainer = () => {
  const { data, loading, error } = useFetchData('getNewStoreSupplySummary', [], [], { manual: false });

  const { tableData, summaryRow } = useMemo(() => {
    if (!data || data.length === 0) return { tableData: [], summaryRow: null };

    const summary = data.find(item => item.city_name === '合计');
    const rows = data.filter(item => item.city_name !== '合计');

    return { tableData: rows, summaryRow: summary };
  }, [data]);

  const columns = [
    { key: 'city', title: '统计城市', dataIndex: 'city_name' },
    { key: 'store_count', title: '门店数量', dataIndex: 'store_count', align: 'right' },
    { key: 'avg_area', title: '店均面积', dataIndex: 'avg_area_per_store', align: 'right' },
    { key: 'avg_bed', title: '店均床位数', dataIndex: 'avg_bed_per_store', align: 'right' },
    { key: 'area_per_bed', title: '单床位面积', dataIndex: 'area_per_bed', align: 'right' },
    { key: 'space_utilization', title: '空间利用率', dataIndex: 'space_utilization_rate', align: 'right' },
  ];

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, tableData);

  // 计算昨天的日期
  const yesterday = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }, []);

  // 构建带日期范围的标题
  const titleWithDateRange = useMemo(() => (
    <>
      新店供应总结
      <span className="ml-3 text-sm font-normal text-[#a40035]">
        数据区间: 2026-01-01 ~ {yesterday}
      </span>
    </>
  ), [yesterday]);

  return (
    <DataContainer title={titleWithDateRange}>
      <DataTable
        data={sortedData}
        columns={columns}
        loading={loading}
        error={error}
        maxHeight="none"
        summaryRow={summaryRow}
        summaryPosition="bottom"
        summaryClassName="bg-gray-100 font-bold"
        onSort={handleSort}
        sortConfig={sortConfig}
      />
    </DataContainer>
  );
};

export default NewStoreSupplyContainer;
