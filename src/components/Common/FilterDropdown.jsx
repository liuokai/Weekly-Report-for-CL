import React, { useState, useRef, useEffect } from 'react';

const FilterDropdown = ({ label, value, options, onChange, showAllOption = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isSelected = value !== null && value !== undefined && value !== '全部' && value !== '';

  return (
    <div className={`relative inline-block text-left mr-4 ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      <button
        type="button"
        className={`inline-flex justify-between w-40 rounded-md border shadow-sm px-4 py-2 bg-white text-sm font-medium focus:outline-none ${
          isSelected 
            ? 'border-[#a40035] text-[#a40035]' 
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value || `全部${label}`}
        <svg 
          className={`-mr-1 ml-2 h-5 w-5 ${isSelected ? 'text-[#a40035]' : 'text-gray-500'}`} 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 max-h-60 overflow-y-auto z-50">
          <div className="py-1">
            {showAllOption && (
              <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                      !value || value === '全部' 
                          ? 'bg-[#a40035] text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => { onChange(null); setIsOpen(false); }}
              >
                  全部{label}
              </button>
            )}

            {options.map((opt) => (
              <button
                key={opt}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  value === opt 
                    ? 'bg-[#a40035] text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => { onChange(opt); setIsOpen(false); }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
