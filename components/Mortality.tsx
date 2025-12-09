import { FC, useMemo, useState, ChangeEvent, FormEvent } from 'react';
import { useFarm } from '../context/FarmContext';
import { DailyRecord } from '../types';

// Helper para formatar data para input date (YYYY-MM-DD)
const toLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const Mortality: FC = () => {
  const { flocks, records, addRecord, updateRecord } = useFarm();
  const activeFlocks = useMemo(() => flocks.filter(f => f.status === 'Ativo' || f.status === 'Descartado'), [flocks]);

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

  const selectedFlockRecords = useMemo(() => {
    if (!formData.flockId) return [] as DailyRecord[];
    return records
      .filter(r => r.flockId === formData.flockId && r.mortality && r.mortality > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, formData.flockId]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.flockId) {
      setMessage({ type: 'error', text: 'Por favor, selecione um lote.' });
      return;
    }

    const mortalityNumber = Number(formData.mortality);
    if (Number.isNaN(mortalityNumber) || mortalityNumber < 0) {
      setMessage({ type: 'error', text: 'Informe um número válido de aves mortas.' });
      return;
    }

    const recordDate = new Date(formData.date);
    const isoDate = recordDate.toISOString();

    // Buscar se já existe registro para esse lote + data
    const existing = records.find(r => r.flockId === formData.flockId && toLocalDateString(new Date(r.date)) === formData.date);

    // Salva motivo e observações separados por ||
    const combinedNotes = [formData.reason, formData.notes].filter(Boolean).join(' || ');

    if (existing) {
      // Atualiza registro existente
      updateRecord(existing.id, {
        ...existing,
        mortality: mortalityNumber,
        notes: combinedNotes || existing.notes,
      });
      setMessage({ type: 'success', text: 'Mortalidade atualizada com sucesso.' });
    } else {
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
      addRecord(payload);
      setMessage({ type: 'success', text: 'Mortalidade registrada com sucesso.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-stone-800">Registro de Mortalidade</h1>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md text-sm text-white ${
            message.type === 'error' ? 'bg-red-500' : 'bg-green-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Lote</label>
            <select
              name="flockId"
              value={formData.flockId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              required
            >
              <option value="">Selecione um lote</option>
              {activeFlocks.map(flock => (
                <option key={flock.id} value={flock.id}>
                  {flock.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Data</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Qtd Mortas</label>
            <input
              type="number"
              name="mortality"
              min={0}
              value={formData.mortality}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Motivo</label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Selecione um motivo (opcional)</option>
              <option value="doença">Doença</option>
              <option value="descarte">Descarte</option>
              <option value="consumo">Consumo</option>
              <option value="canibalismo">Canibalismo</option>
              <option value="acidente">Acidente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Observações</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              placeholder="Ex: Ave com problema de perna, descarte por bem-estar."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-200 mt-4">
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm"
          >
            Salvar Registro
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-stone-800 mb-4">Histórico de Mortalidade do Lote</h2>
        {formData.flockId ? (
          selectedFlockRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-stone-500 border-collapse">
                <thead className="text-xs text-stone-700 uppercase bg-stone-50">
                  <tr>
                    <th className="px-4 py-3 text-center">Data</th>
                    <th className="px-4 py-3 text-center">Qtd Mortas</th>
                    <th className="px-4 py-3 text-center">Motivo</th>
                    <th className="px-4 py-3 text-center">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFlockRecords.map(record => {
                    // Extrai motivo e observações do campo notes
                    const parts = (record.notes || '').split(' || ');
                    const motivo = parts[0]?.replace('Motivo: ', '') || '-';
                    const obs = parts[1] || '-';
                    return (
                      <tr key={record.id} className="border-b hover:bg-stone-50">
                        <td className="px-4 py-2 text-center">
                          {new Date(record.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </td>
                        <td className="px-4 py-2 text-center font-medium text-stone-800">{record.mortality}</td>
                        <td className="px-4 py-2 text-center text-stone-600 capitalize">{motivo}</td>
                        <td className="px-4 py-2 text-center text-stone-600">{obs}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Nenhuma mortalidade registrada ainda para este lote.</p>
          )
        ) : (
          <p className="text-sm text-stone-500">Selecione um lote para ver o histórico de mortalidade.</p>
        )}
      </div>
    </div>
  );
};

export default Mortality;
