import React from 'react';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * 通用分页组件
 * @param {number} total - 总条数
 * @param {number} currentPage - 当前页
 * @param {number} pageSize - 每页条数
 * @param {function} onPageChange - 页码变化回调
 * @param {function} onPageSizeChange - 每页条数变化回调
 */
const Pagination = ({ total, currentPage, pageSize, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (total === 0) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <span>共 {total} 条</span>
        <span>每页</span>
        <select
          value={pageSize}
          onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
          className="border border-[#a40035] text-[#a40035] rounded px-2 py-0.5 text-sm focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map(s => (
            <option key={s} value={s}>{s} 条</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:border-[#a40035] hover:text-[#a40035]">«</button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:border-[#a40035] hover:text-[#a40035]">‹</button>
        {pageNumbers.map((p, idx) => p === '...' ? (
          <span key={`e-${idx}`} className="px-2">…</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-1 rounded border ${currentPage === p ? 'border-[#a40035] text-[#a40035] font-bold' : 'border-gray-200 hover:border-[#a40035] hover:text-[#a40035]'}`}>{p}</button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:border-[#a40035] hover:text-[#a40035]">›</button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:border-[#a40035] hover:text-[#a40035]">»</button>
        <span className="ml-2">第 {currentPage} / {totalPages} 页</span>
      </div>
    </div>
  );
};

export default Pagination;
