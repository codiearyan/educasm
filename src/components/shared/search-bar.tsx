'use client';

import { useState, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export const SearchBar = ({
  onSearch,
  placeholder = 'Search...',
  initialValue = '',
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialValue);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  return (
    <div className="relative w-full animate-slide-up">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full h-12 pl-12 pr-4 text-lg bg-card/50 backdrop-blur-sm
          border border-gray-700 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-primary
          placeholder:text-gray-500
          transition-all"
      />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
    </div>
  );
}; 