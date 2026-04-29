import React, { useState } from 'react';

interface Specialty {
  name: string;
  color: string;
}

const SPECIALTIES: Specialty[] = [
  { name: 'Cardiology', color: '#E74C3C' },
  { name: 'Neurology', color: '#3498DB' },
  { name: 'Endocrinology', color: '#9B59B6' },
  { name: 'Infectious Disease', color: '#F39C12' },
  { name: 'Pulmonology', color: '#1ABC9C' },
  { name: 'Gastroenterology', color: '#E67E22' },
  { name: 'Rheumatology', color: '#16A085' },
  { name: 'Oncology', color: '#8E44AD' },
  { name: 'Nephrology', color: '#2980B9' },
  { name: 'Psychiatry', color: '#D35400' },
];

interface ExpertPanelSelectorProps {
  onSelectionChange: (selected: string[]) => void;
}

const ExpertPanelSelector: React.FC<ExpertPanelSelectorProps> = ({ onSelectionChange }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSpecialty = (specialtyName: string) => {
    const newSelected = selected.includes(specialtyName)
      ? selected.filter(s => s !== specialtyName)
      : [...selected, specialtyName];
    
    setSelected(newSelected);
    onSelectionChange(newSelected);
  };

  return (
    <div className="w-full animate-fadeIn">
      <div className="max-w-[80%] mx-auto">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[var(--border-light)]">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-[var(--accent-purple)] mb-1">Expert Panel Mode</h3>
            <p className="text-sm text-[var(--text-meta)]">
              Select specialists to participate in the case discussion:
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {SPECIALTIES.map((specialty) => (
              <button
                key={specialty.name}
                onClick={() => toggleSpecialty(specialty.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selected.includes(specialty.name)
                    ? 'text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selected.includes(specialty.name) ? specialty.color : undefined,
                }}
              >
                {specialty.name}
              </button>
            ))}
          </div>
          
          {selected.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-light)]">
              <p className="text-sm text-[var(--text-secondary)]">
                <strong>{selected.length}</strong> specialist{selected.length > 1 ? 's' : ''} selected. 
                Type your case to start the discussion.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertPanelSelector;
