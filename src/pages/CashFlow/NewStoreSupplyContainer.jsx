import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';
import useTableSorting from '../../components/Common/useTableSorting';

const NewStoreSupplyContainer = () => {
  const { data, loading, error } = useFetchData('getNewStoreSupplySummary', [], [], { manual: false });

  const { tableData, summaryRow } = useMemo(() => {
    if (!data || data.length === 0) return { tableData: [], summaryRow: null };

    const summary = data.find(item => item['统计城市'] === '合计');
    const rows = data.filter(item => item['统计城市'] !== '合计');

    return { tableData: rows, summaryRow: summary };
  }, [data]);

  const columns = [
    { key: 'city', title: '统计城市', dataIndex: '统计城市' },
    { key: 'store_count', title: '门店数量', dataIndex: '门店数量', align: 'right' },
    { key: 'avg_area', title: '店均面积', dataIndex: '店均面积', align: 'right' },
    { key: 'avg_bed', title: '店均床位数', dataIndex: '店均床位数', align: 'right' },
    { key: 'area_per_bed', title: '单床位面积', dataIndex: '单床位面积', align: 'right' },
    { key: 'space_utilization', title: '空间利用率', dataIndex: '空间利用率', align: 'right' },
  ];

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, tableData);

  return (
    <DataContainer title="新店供应总结">
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
