import React, { useState, useEffect } from 'react';

const FilterDropdown = ({
  label,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "请选择"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 检查点击的元素是否在下拉框内
      const dropdownElement = document.getElementById(`dropdown-${label}`);
      if (isOpen && dropdownElement && !dropdownElement.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, label]);

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...options]);
    }
  };

  const handleOptionChange = (option) => {
    let newSelected;
    if (selectedValues.includes(option)) {
      newSelected = selectedValues.filter(val => val !== option);
    } else {
      newSelected = [...selectedValues, option];
    }
    onSelectionChange(newSelected);
  };

  return (
    <div className="relative" id={`dropdown-${label}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-[#a40035] focus:border-[#a40035] sm:text-sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <div className="flex justify-between items-center">
            <span>
              {selectedValues.length > 0 
                ? `${selectedValues.length} 个${label}已选择` 
                : placeholder}
            </span>
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </button>
        
        {isOpen && (
          <div 
            className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md p-2 max-h-60 overflow-y-auto border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center py-1">
              <input
                type="checkbox"
                id={`${label}-all`}
                checked={selectedValues.length === options.length && options.length > 0}
                onChange={handleSelectAll}
                className="mr-2 h-4 w-4 text-[#a40035] border-gray-300 rounded focus:ring-[#a40035]"
              />
              <label htmlFor={`${label}-all`} className="text-sm text-gray-700 cursor-pointer">
                全选
              </label>
            </div>
            {options.map(option => (
              <div key={option} className="flex items-center py-1">
                <input
                  type="checkbox"
                  id={`${label}-${option}`}
                  checked={selectedValues.includes(option)}
                  onChange={() => handleOptionChange(option)}
                  className="mr-2 h-4 w-4 text-[#a40035] border-gray-300 rounded focus:ring-[#a40035]"
                />
                <label htmlFor={`${label}-${option}`} className="text-sm text-gray-700 cursor-pointer">
                  {option}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterDropdown;