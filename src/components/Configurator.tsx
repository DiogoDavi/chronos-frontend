import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Calendar, X, Clock, Edit2 } from 'lucide-react';
import { Unit, UnitPremises, ServiceWindow, CalendarException } from '../types/logistics';
import { supabase } from '../services/supabase';
import { usePremisesStore } from '../store/usePremisesStore';

interface ConfiguratorProps {
  theme: 'dark' | 'light';
}

export const Configurator: React.FC<ConfiguratorProps> = ({
  theme = 'light'
}) => {
  const { premises, savePremises, fetchPremises, isLoading } = usePremisesStore();
  const [selectedUnit, setSelectedUnit] = useState<Unit>(() =>
    (localStorage.getItem('configurator_selected_unit') as Unit) || 'JPA'
  );

  const [localConfig, setLocalConfig] = useState<UnitPremises>(() => premises[selectedUnit] || {
    unit: selectedUnit,
    operatingDays: [1, 2, 3, 4, 5, 6],
    windows: [{ id: '1', start: '08:00', end: '18:00' }],
    priorityPlates: [],
    meta_aguardando_liberacao: 45,
    meta_aguardando_doca: 60,
    meta_em_doca: 120,
    meta_concluido_saida: 180,
    refresh_seconds: 120,
    exceptions: []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [plateInput, setPlateInput] = useState('');
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [newException, setNewException] = useState({
    date: new Date().toISOString().split('T')[0],
    is_active: true,
    start_time: '',
    end_time: '',
    description: ''
  });

  useEffect(() => {
    localStorage.setItem('configurator_selected_unit', selectedUnit);
  }, [selectedUnit]);

  useEffect(() => {
    if (premises[selectedUnit]) {
      // Only update local state if it's different from the store (to avoid losing unsaved changes on refresh)
      // and if we are not currently saving
      setLocalConfig(premises[selectedUnit]);
    } else {
      setLocalConfig({
        unit: selectedUnit,
        operatingDays: [1, 2, 3, 4, 5, 6],
        windows: [{ id: '1', start: '08:00', end: '18:00' }],
        priorityPlates: [],
        meta_aguardando_liberacao: 45,
        meta_aguardando_doca: 60,
        meta_em_doca: 120,
        meta_concluido_saida: 180,
        refresh_seconds: 120,
        exceptions: []
      } as UnitPremises);
    }
  }, [selectedUnit, premises]);

  const units: Unit[] = ['JPA', 'CPG', 'NAT', 'MSR'];
  const daysOfWeekFull = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const toggleDay = (dayIndex: number) => {
    setLocalConfig(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(dayIndex)
        ? prev.operatingDays.filter(d => d !== dayIndex)
        : [...prev.operatingDays, dayIndex]
    }));
  };

  const handleAddPlate = () => {
    const plate = plateInput.toUpperCase().trim();
    if (plate && !localConfig.priorityPlates.includes(plate)) {
      setLocalConfig(prev => ({
        ...prev,
        priorityPlates: [...prev.priorityPlates, plate]
      }));
      setPlateInput('');
    }
  };

  const handleRemovePlate = (plate: string) => {
    setLocalConfig(prev => ({
      ...prev,
      priorityPlates: prev.priorityPlates.filter(p => p !== plate)
    }));
  };

  const addServiceWindow = () => {
    if (localConfig.windows.length >= 5) return;
    const newWindow: ServiceWindow = {
      id: Math.random().toString(36).substr(2, 9),
      start: '08:00',
      end: '18:00'
    };
    setLocalConfig(prev => ({
      ...prev,
      windows: [...prev.windows, newWindow]
    }));
  };

  const removeServiceWindow = (id: string) => {
    setLocalConfig(prev => ({
      ...prev,
      windows: prev.windows.filter(w => w.id !== id)
    }));
  };

  const updateServiceWindow = (id: string, field: 'start' | 'end', value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      windows: prev.windows.map(w => w.id === id ? { ...w, [field]: value } : w)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Remove meta_concluido_saida from save payload as it is generated in DB
      const { meta_concluido_saida, ...configToSave } = localConfig;
      await savePremises(selectedUnit, configToSave as UnitPremises);
      alert('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message || error?.details || JSON.stringify(error);
      alert(`Erro ao salvar as premissas da unidade: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!newException.date) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('unit_calendar_exceptions')
        .insert([{
          unit: selectedUnit,
          date: newException.date,
          is_active: newException.is_active,
          start_time: newException.start_time || null,
          end_time: newException.end_time || null,
          description: newException.description
        }]);

      if (error) throw error;
      setShowExceptionForm(false);
      setNewException({
        date: new Date().toISOString().split('T')[0],
        is_active: true,
        start_time: '',
        end_time: '',
        description: ''
      });
      await fetchPremises(); // Refresh data to show new exception
    } catch (err) {
      console.error('Error saving exception:', err);
      alert('Erro ao salvar exceção');
    } finally {
      setIsSaving(false);
    }
  };

  const removeException = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('unit_calendar_exceptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchPremises();
    } catch (err) {
      console.error('Error removing exception:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!localConfig) return null;

  const isDark = theme === 'dark';

  return (
    <div className="space-y-12">
      {/* Main Configuration Card */}
      <div className={`rounded-[32px] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-zinc-100 ${isDark ? 'bg-[#0F0F11] border-white/5' : 'bg-white'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">

          {/* Left Column */}
          <div className="space-y-10">
            {/* Unit Selection */}
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1 space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Unidade</label>
                <div className="relative">
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value as Unit)}
                    className={`w-full appearance-none rounded-2xl px-5 py-4 text-sm font-bold border outline-none transition-all ${isDark ? 'bg-zinc-900 border-white/10 text-white focus:border-indigo-500' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      }`}
                  >
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-8 py-4 bg-[#5B47FB] hover:bg-[#4A38E0] text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : 'Salvar Premissas'}
              </button>
            </div>

            {/* Operating Days */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Dias de Funcionamento</label>
              <div className="flex flex-wrap gap-2.5">
                {daysOfWeekFull.map((day, index) => {
                  const dayIndex = (index + 1) % 7;
                  const isActive = localConfig.operatingDays.includes(dayIndex);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDay(dayIndex)}
                      className={`px-4 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${isActive
                        ? 'bg-[#EBE9FF] border-[#5B47FB]/30 text-[#5B47FB]'
                        : isDark ? 'bg-zinc-900 border-white/5 text-zinc-500' : 'bg-transparent border-zinc-200 text-zinc-400'
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Plates */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Placas Prioritárias</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={plateInput}
                  onChange={(e) => setPlateInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPlate()}
                  placeholder="AAA-1234"
                  className={`flex-1 rounded-2xl px-5 py-4 text-sm font-bold border outline-none transition-all ${isDark ? 'bg-zinc-900 border-white/10 text-white focus:border-indigo-500' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    }`}
                />
                <button
                  onClick={handleAddPlate}
                  className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition-all ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100'
                    }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {localConfig.priorityPlates.map(p => (
                  <div key={p} className={`px-4 py-2 rounded-xl text-[11px] font-bold border flex items-center gap-2 ${isDark ? 'bg-zinc-900 border-white/5 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm'
                    }`}>
                    {p}
                    <button onClick={() => handleRemovePlate(p)}>
                      <X className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-10">
            {/* Service Windows */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Janelas de Atendimento (Máx 5)</label>
                <button
                  onClick={addServiceWindow}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100'
                    }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {localConfig.windows.length === 0 && (
                  <div className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${isDark ? 'border-white/5 bg-white/5' : 'border-zinc-100 bg-zinc-50/50'
                    }`}>
                    <Clock className="w-8 h-8 text-zinc-300" />
                    <span className="text-xs text-zinc-400 font-medium tracking-tight">Nenhuma janela cadastrada</span>
                  </div>
                )}
                {localConfig.windows.map((window, idx) => (
                  <div key={window.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${isDark ? 'bg-zinc-900 border-white/10 focus-within:border-indigo-500' : 'bg-zinc-50 border-zinc-100 focus-within:border-indigo-200'
                    } transition-all`}>
                    <span className="text-[10px] font-black text-zinc-400 w-6">#{idx + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Início</span>
                        <input
                          type="time"
                          value={window.start}
                          onChange={(e) => updateServiceWindow(window.id, 'start', e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-zinc-100 text-zinc-800'
                            }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Fim</span>
                        <input
                          type="time"
                          value={window.end}
                          onChange={(e) => updateServiceWindow(window.id, 'end', e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-zinc-100 text-zinc-800'
                            }`}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeServiceWindow(window.id)}
                      className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-red-500/10 text-zinc-500 hover:text-red-500' : 'hover:bg-red-50 text-zinc-400 hover:text-red-500'
                        }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Goals */}
            <div className="space-y-6">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Metas de Tempo (Minutos)</label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Liberação *</span>
                  <input
                    type="number"
                    value={localConfig.meta_aguardando_liberacao}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, meta_aguardando_liberacao: Number(e.target.value) }))}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold border outline-none ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      }`}
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Doca *</span>
                  <input
                    type="number"
                    value={localConfig.meta_aguardando_doca}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, meta_aguardando_doca: Number(e.target.value) }))}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold border outline-none ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      }`}
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Em Doca *</span>
                  <input
                    type="number"
                    value={localConfig.meta_em_doca}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, meta_em_doca: Number(e.target.value) }))}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold border outline-none ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                      }`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block leading-relaxed">Concluído (Automático - Soma das metas)</span>
                <div className={`w-40 rounded-xl px-4 py-3 text-sm font-bold border transition-all ${isDark ? 'bg-zinc-900/50 border-white/5 text-zinc-500' : 'bg-zinc-100/50 border-zinc-100 text-zinc-400'
                  }`}>
                  {(localConfig.meta_aguardando_liberacao || 0) + (localConfig.meta_aguardando_doca || 0) + (localConfig.meta_em_doca || 0)} min
                </div>
              </div>
            </div>

            {/* Panel Refresh */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Atualização do Painel (Segundos)</label>
              <input
                type="number"
                value={localConfig.refresh_seconds}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, refresh_seconds: Number(e.target.value) }))}
                className={`w-48 rounded-xl px-4 py-3 text-sm font-bold border outline-none ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  }`}
              />
            </div>

            {/* Calendar Exceptions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Exceções do Calendário</label>
                <button
                  onClick={() => setShowExceptionForm(!showExceptionForm)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl border transition-all ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100'
                    } ${showExceptionForm ? 'bg-[#5B47FB] border-[#5B47FB] text-white' : ''}`}>
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              {showExceptionForm && (
                <div className={`p-6 rounded-3xl border space-y-4 mb-4 ${isDark ? 'bg-zinc-900/50 border-white/10' : 'bg-zinc-50 border-zinc-100'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Data</span>
                      <input
                        type="date"
                        value={newException.date}
                        onChange={e => setNewException(prev => ({ ...prev, date: e.target.value }))}
                        className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-800'
                          }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1 block">Unidade Ativa?</span>
                      <button
                        onClick={() => setNewException(prev => ({ ...prev, is_active: !prev.is_active }))}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${newException.is_active
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-500 shadow-sm shadow-emerald-500/10'
                          : 'bg-red-50 border-red-200 text-red-500 shadow-sm shadow-red-500/10'
                          }`}
                      >
                        {newException.is_active ? (
                          <div className="w-6 h-6 bg-[#00D084] rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                            <X className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Início (Opcional)</span>
                      <div className="relative">
                        <input
                          type="time"
                          value={newException.start_time || ''}
                          onChange={e => setNewException(prev => ({ ...prev, start_time: e.target.value }))}
                          className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-800'
                            }`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Fim (Opcional)</span>
                      <div className="relative">
                        <input
                          type="time"
                          value={newException.end_time || ''}
                          onChange={e => setNewException(prev => ({ ...prev, end_time: e.target.value }))}
                          className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-800'
                            }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Descrição</span>
                    <input
                      type="text"
                      placeholder="Ex: Feriado Municipal, Manutenção, etc..."
                      value={newException.description || ''}
                      onChange={e => setNewException(prev => ({ ...prev, description: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border outline-none ${isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-800'
                        }`}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowExceptionForm(false)}
                      className="px-6 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddException}
                      className="px-6 py-2.5 bg-[#5B47FB] hover:bg-[#4A38E0] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Adicionar Exceção
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {(!localConfig.exceptions || localConfig.exceptions.length === 0) ? (
                  <div className={`p-10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 text-center ${isDark ? 'border-white/5 bg-white/5' : 'border-zinc-100 bg-zinc-50/50'
                    }`}>
                    <span className="text-[11px] text-zinc-400 font-bold tracking-tight">Nenhuma exceção cadastrada</span>
                  </div>
                ) : (
                  localConfig.exceptions.map(exc => (
                    <div key={exc.id} className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                      }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${exc.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div>
                          <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-zinc-800'}`}>
                            {new Date(exc.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            {exc.start_time && ` • ${exc.start_time.slice(0, 5)} - ${exc.end_time?.slice(0, 5)}`}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-medium">{exc.description || (exc.is_active ? 'Atendimento Diferenciado' : 'Unidade Fechada')}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => exc.id && removeException(exc.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Saved Premises */}
      <div className="space-y-8">
        <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Premissas Salvas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(premises).map(([unit, config]) => {
            const prem = config as UnitPremises;
            return (
              <div
                key={unit}
                onClick={() => setSelectedUnit(unit as Unit)}
                className={`p-8 rounded-[32px] border transition-all cursor-pointer group ${selectedUnit === unit
                  ? (isDark ? 'bg-[#5B47FB]/10 border-[#5B47FB]/30' : 'bg-[#EBE9FF]/30 border-[#5B47FB]/20')
                  : (isDark ? 'bg-[#0F0F11] border-white/5 hover:border-white/20' : 'bg-white border-zinc-100 hover:border-zinc-300')
                  }`}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all ${selectedUnit === unit
                      ? 'bg-[#5B47FB] text-white shadow-lg shadow-indigo-500/20'
                      : (isDark ? 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700' : 'bg-[#EBE9FF] text-[#5B47FB] group-hover:bg-[#E0DEFF]')
                      }`}>
                      {unit}
                    </div>
                    <div>
                      <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-zinc-800'}`}>Unidade {unit}</h4>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-0.5">
                        {prem.windows?.length || 0} Janelas • {prem.priorityPlates?.length || 0} Placas
                      </p>
                    </div>
                  </div>
                  <button className={`p-2 rounded-lg transition-all ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-300 hover:text-zinc-600'}`}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Dias</span>
                    <p className={`text-[10px] font-bold leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {prem.operatingDays?.map(d => daysOfWeekFull[(d === 0 ? 6 : d - 1)]).join(', ') || 'Nenhum dia'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
