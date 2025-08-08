
import React, { useState, useEffect, useRef } from 'react';

interface SearchableDropdownProps<T extends { id: string }> {
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder: string;
  displayProperty: keyof T;
  icon?: React.ReactNode;
}

export const SearchableDropdown = <T extends { id: string; name: string }>({
  items,
  selectedId,
  onSelect,
  placeholder,
  displayProperty,
  icon,
}: SearchableDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find(item => item.id === selectedId);

  useEffect(() => {
    if (selectedItem) {
      setSearchTerm(selectedItem[displayProperty] as string);
    } else {
      setSearchTerm('');
    }
  }, [selectedId, selectedItem, displayProperty]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset input to selected item name if user clicks away
        if (selectedItem) {
          setSearchTerm(selectedItem[displayProperty] as string);
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedItem, displayProperty]);
  
  const filteredItems = items.filter(item =>
    (item[displayProperty] as string).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item: T) => {
    onSelect(item.id);
    setSearchTerm(item[displayProperty] as string);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative flex-grow">
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if(e.target.value === '') onSelect(''); // Clear selection if input is cleared
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 block w-full px-3 py-2 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-white border border-brand-gray-300 dark:border-brand-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
        />
      </div>

      {isOpen && (
        <div className="absolute mt-1 w-full rounded-md bg-white dark:bg-brand-gray-700 shadow-lg z-10 border border-brand-gray-200 dark:border-brand-gray-600">
          <ul className="max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
            {filteredItems.map(item => (
              <li
                key={item.id}
                onClick={() => handleSelect(item)}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-brand-gray-900 dark:text-brand-gray-100 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600"
              >
                <span className={`block truncate ${selectedId === item.id ? 'font-semibold' : 'font-normal'}`}>
                  {item[displayProperty] as string}
                </span>
                {selectedId === item.id && (
                  <span className="text-brand-blue dark:text-blue-400 absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>
                  </span>
                )}
              </li>
            ))}
            {filteredItems.length === 0 && (
                <li className="select-none py-2 px-3 text-brand-gray-500">{searchTerm ? 'No matches' : 'No customers'}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
