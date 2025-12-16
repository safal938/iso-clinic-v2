import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="sticky top-0 z-20 bg-[#F1F5F9]/90 backdrop-blur-md pt-4 pb-4">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-slate-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full pl-12 pr-4 py-4 rounded-2xl text-slate-800 placeholder-slate-400 bg-white border-transparent focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all shadow-sm"
          placeholder="Search by name, ID, or diagnosis..."
        />
      </div>
    </div>
  );
};
