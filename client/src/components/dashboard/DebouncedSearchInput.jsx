import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedCallback } from '../../utils/debounce';

/**
 * Debounced search input component for better performance
 * Prevents excessive API calls or filtering operations
 */
const DebouncedSearchInput = React.memo(function DebouncedSearchInput({
  placeholder = "Search...",
  onSearch,
  delay = 300,
  className = "",
  disabled = false,
  initialValue = ""
}) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function to prevent excessive calls
  const debouncedSearch = useDebouncedCallback(
    async (term) => {
      setIsSearching(true);
      try {
        await onSearch(term);
      } finally {
        setIsSearching(false);
      }
    },
    delay,
    [onSearch]
  );

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    debouncedSearch('');
  }, [debouncedSearch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search 
          size={16} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
        />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${isSearching ? 'bg-blue-50' : ''}
          `}
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
        </div>
      )}
    </div>
  );
});

export default DebouncedSearchInput;