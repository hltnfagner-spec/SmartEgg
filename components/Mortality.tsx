import { FC, useMemo, useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { DailyRecord } from '../types';
import { TrashIcon } from './icons';

// Helper para formatar data para input date (YYYY-MM-DD)
const toLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export const AddMortalityForm: FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { flocks, records, addRecord, updateRecord, deleteRecord } = useFarm();
  
  useEffect(() => {
    console.log('[Mortality] AddMortalityForm montado');
  }, []);
  const activeFlocks = useMemo(() => flocks.filter(f => f.status === 'Ativo'), [flocks]);

  const [formData, setFormData] = useState({
    flockId: activeFlocks.length > 0 ? activeFlocks[0].id : '',
    date: toLocalDateString(new Date()),
    mortality: '',
    reason: '',
    notes: '',
  });

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('[Mortality] Botão Salvar clicado');
    // alert('Tentando salvar mortalidade...'); 
    
    setMessage(null);

    console.log('[Mortality] Dados do formulário:', formData);

    if (!formData.flockId) {
      console.log('[Mortality] Falha: flockId ausente');
      setMessage({ type: 'error', text: 'Por favor, selecione um lote.' });
      return;
    }

    const mortalityNumber = Number(formData.mortality);
    if (Number.isNaN(mortalityNumber) || mortalityNumber < 0) {
      console.log('[Mortality] Falha: mortalityNumber inválido', formData.mortality);
      setMessage({ type: 'error', text: 'Informe um número válido de aves mortas.' });
      return;
    }

    const recordDate = new Date(formData.date);
    const isoDate = recordDate.toISOString();

    console.log('[Mortality] Procurando registro existente para:', formData.flockId, formData.date);
    // Buscar se já existe registro para esse lote + data
    const existing = records.find(r => r.flockId === formData.flockId && toLocalDateString(new Date(r.date)) === formData.date);
    console.log('[Mortality] Registro existente encontrado:', existing);

    // Salva motivo e observações separados por ||
    const combinedNotes = [formData.reason, formData.notes].filter(Boolean).join(' || ');

    if (existing) {
      console.log('[Mortality] Chamando updateRecord para ID:', existing.id);
      // Atualiza registro existente
      updateRecord(existing.id, {
        ...existing,
        mortality: mortalityNumber,
        notes: combinedNotes || existing.notes,
      });
      setMessage({ type: 'success', text: 'Mortalidade atualizada com sucesso.' });
    } else {
      console.log('[Mortality] Chamando addRecord');
      // Cria novo registro mínimo, com demais campos zerados
      const payload: Omit<DailyRecord, 'id'> = {
        flockId: formData.flockId,
        date: isoDate,
        eggsCollected: 0,
        brokenEggs: 0,
        feedConsumedKg: 0,
        mortality: mortalityNumber,
        notes: combinedNotes || undefined,
      };
      console.log('[Mortality] Payload para addRecord:', payload);
      addRecord(payload);
      setMessage({ type: 'success', text: 'Mortalidade registrada com sucesso.' });
    }
    
    if (onClose) {
        setTimeout(onClose, 1500);
    } else {
        // Reset form partially if not closing
        setFormData(prev => ({
            ...prev,
            mortality: '',
            reason: '',
            notes: ''
        }));
    }
  };

  return (
      <div className="p-4 sm:p-6 space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg text-sm text-white ${
            message.type === 'error' ? 'bg-red-500' : 'bg-green-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Lote</label>
            <select
              name="flockId"
              value={formData.flockId}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              required
            >
              <option value="">Selecione...</option>
              {activeFlocks.map(flock => (
                <option key={flock.id} value={flock.id}>
                  {flock.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Data</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Qtd Mortas</label>
            <input
              type="number"
              name="mortality"
              min={0}
              value={formData.mortality}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Motivo</label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            >
              <option value="">Selecione...</option>
              <option value="doença">Doença</option>
              <option value="descarte">Descarte</option>
              <option value="consumo">Consumo</option>
              <option value="canibalismo">Canibalismo</option>
              <option value="acidente">Acidente</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Observações</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
            placeholder="Ex: Ave com problema de perna, descarte por bem-estar..."
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-200 space-x-3">
          {onClose && (
             <button 
               type="button" 
               onClick={onClose} 
               className="px-6 py-2 text-sm font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-lg hover:bg-stone-200 transition-colors"
             >
               Cancelar
             </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-sm transition-colors"
          >
            Salvar Registro
          </button>
        </div>
      </form>
      </div>
  );
};

export const Mortality: FC = () => {
  const { flocks, records, deleteRecord } = useFarm();
  const [selectedFlockId, setSelectedFlockId] = useState('');

  const handleDeleteRecord = (recordId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de mortalidade? Esta ação não pode ser desfeita.')) {
      deleteRecord(recordId);
    }
  };

  const selectedFlockRecords = useMemo(() => {
    // Primeiro filtra registros com mortalidade > 0
    const mortalityRecords = records.filter(r => r.mortality > 0);
    
    // Se não tem lote selecionado, mostra todos os registros de mortalidade
    if (!selectedFlockId) {
      return mortalityRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    // Se tem lote selecionado, filtra apenas registros daquele lote
    return mortalityRecords
      .filter(r => r.flockId === selectedFlockId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, selectedFlockId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Registro de Mortalidade</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Controle e acompanhamento de mortalidade por lote</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
            Novo Registro
          </h2>
        </div>
        
        <AddMortalityForm />
      </div>

      {/* Tabela de Histórico com Filtro Integrado */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-white">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <h2 className="text-base sm:text-lg font-semibold text-stone-800 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Histórico de Mortalidade
              {selectedFlockId && (
                <span className="ml-2 sm:ml-3 text-sm font-normal text-stone-600">
                  - {flocks.find(f => f.id === selectedFlockId)?.name}
                </span>
              )}
            </h2>
            
            {/* Filtro Integrado */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="text-sm font-medium text-stone-700 whitespace-nowrap">Filtrar:</label>
              <select
                value={selectedFlockId}
                onChange={(e) => setSelectedFlockId(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
              >
                <option value="">Todos os lotes</option>
                {flocks.filter(f => f.status === 'Ativo').map(flock => (
                  <option key={flock.id} value={flock.id}>
                    {flock.name}
                  </option>
                ))}
              </select>
              {selectedFlockRecords.length > 0 && (
                <span className="text-xs sm:text-sm text-stone-500 whitespace-nowrap">
                  {selectedFlockRecords.length} registros
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {selectedFlockRecords.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-700 uppercase tracking-wider">Data</th>
                      <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-stone-700 uppercase tracking-wider">Qtd Mortas</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-700 uppercase tracking-wider hidden sm:table-cell">Motivo</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-stone-700 uppercase tracking-wider hidden lg:table-cell">Observações</th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-stone-700 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-stone-200">
                    {selectedFlockRecords.map((record, index) => {
                      const parts = (record.notes || '').split(' || ');
                      const motivo = parts[0]?.replace('Motivo: ', '') || '-';
                      const obs = parts[1] || '-';
                      
                      return (
                        <tr key={record.id} className={`hover:bg-stone-50 transition-colors ${index === 0 ? 'bg-red-50' : ''}`}>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-stone-900">
                            <div className="flex items-center">
                              <span className="text-stone-600">
                                {new Date(record.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                              </span>
                              {index === 0 && (
                                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full hidden sm:inline">Recente</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-800">
                              {record.mortality}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-stone-600 capitalize hidden sm:table-cell">
                            {motivo === '-' ? (
                              <span className="text-stone-400 italic">Não informado</span>
                            ) : (
                              motivo
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-stone-600 hidden lg:table-cell">
                            {obs === '-' ? (
                              <span className="text-stone-400 italic">Sem observações</span>
                            ) : (
                              <div className="max-w-xs truncate" title={obs}>
                                {obs}
                              </div>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-stone-500 hover:text-red-600 transition-colors p-2"
                              title="Excluir este registro de mortalidade"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">📋</span>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-stone-700 mb-2">Nenhum registro encontrado</h3>
              <p className="text-stone-500 text-sm">
                {selectedFlockId 
                  ? 'Este lote ainda não possui registros de mortalidade.'
                  : 'Não há registros de mortalidade para exibir.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mortality;
