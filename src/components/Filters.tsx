import React from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardFilters } from '../types/logistics';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 flex items-center justify-between rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left"
      >
        <span className="text-[11px] text-zinc-400 font-medium truncate">
          {selected.length > 0 ? `${label}: ${selected.join(', ')}` : label}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full mt-2 z-50 max-h-48 overflow-y-auto rounded-xl bg-zinc-900 border border-white/10 p-1 shadow-2xl scrollbar-thin overflow-hidden"
            >
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  className={`w-full px-3 py-2 rounded-lg text-[11px] text-left transition-colors flex items-center justify-between group ${selected.includes(opt) ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className="truncate">{opt}</span>
                  {selected.includes(opt) && <div className="w-1 h-1 rounded-full bg-white ml-2" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FiltersProps {
  filters: any;
  setFilters: (f: any) => void;
  availableFilters: DashboardFilters | null;
  setSearchInput: (s: string) => void;
  setQuickFilters: (f: any) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  setFilters,
  availableFilters,
  setSearchInput,
  setQuickFilters
}) => {
  return (
    <div className="space-y-2 px-3 mt-2">
      <FilterDropdown
        label="Ano"
        options={(availableFilters?.anos || []).map(String)}
        selected={filters.year}
        onChange={(val) => setFilters((prev: any) => ({ ...prev, year: val }))}
      />
      <FilterDropdown
        label="Mês"
        options={availableFilters?.meses || []}
        selected={filters.month}
        onChange={(val) => setFilters((prev: any) => ({ ...prev, month: val }))}
      />
      <FilterDropdown
        label="Dia"
        options={availableFilters?.dias || []}
        selected={filters.day}
        onChange={(val) => setFilters((prev: any) => ({ ...prev, day: val }))}
      />
      <FilterDropdown
        label="Unidade"
        options={availableFilters?.unidades || ['JPA', 'CPG', 'NAT', 'MSR']}
        selected={filters.unit}
        onChange={(val) => setFilters((prev: any) => ({ ...prev, unit: val }))}
      />
      <FilterDropdown
        label="Área"
        options={availableFilters?.areas || []}
        selected={filters.area}
        onChange={(val) => setFilters((prev: any) => ({ ...prev, area: val }))}
      />
      <FilterDropdown
        label="Transportadora"
        options={availableFilters?.transportadoras || []}
        selected={filters.transportador}
        onChange={(val) => setFilters((prev: any) => ({ ...prev, transportador: val }))}
      />
      <FilterDropdown
        label="Prioridade"
        options={['Alta', 'Média', 'Baixa', 'Normal']}
        selected={filters.priority}
        onChange={(val) => setFilters((prev: any) => ({ ...prev, priority: val }))}
      />

      <button
        onClick={() => {
          setFilters({
            unit: ['JPA'],
            transportador: [],
            material: [],
            year: [],
            month: [],
            day: [],
            priority: [],
            area: [],
          });
          setSearchInput('');
          setQuickFilters({ atrasadas: false, prioritarios: false });
        }}
        className="w-full mt-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white border border-white/5 hover:border-white/10 rounded-xl transition-all"
      >
        Limpar Filtros
      </button>
    </div>
  );
};
