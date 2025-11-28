import { useState, useEffect, useMemo, FC, useRef, Fragment } from 'react';
import { EditIcon, TrashIcon, CalculatorIcon } from './icons';
import StatCard from './StatCard';
import NotificationBell from './NotificationBell';
import { useFarm } from '../context/FarmContext';
import { FeedIngredient, FeedFormulation } from '../types';

const FeedCalculator: FC = () => {
  const { feedFormulations, addFeedFormulation, updateFeedFormulation, deleteFeedFormulation } = useFarm();
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  
  // Editor State
  const [formulationId, setFormulationId] = useState<string | null>(null); // If editing existing
  const [formulationName, setFormulationName] = useState('');
  const [formulationPhase, setFormulationPhase] = useState<FeedFormulation['phase']>('Postura');
  const [formulationNotes, setFormulationNotes] = useState('');
  const [ingredients, setIngredients] = useState<FeedIngredient[]>([]);
  
  // Current Ingredient Input State
  const [currentIngredient, setCurrentIngredient] = useState({ name: '', price: '', quantity: '' });
  const [quantityInputValue, setQuantityInputValue] = useState('');
  const [priceInputValue, setPriceInputValue] = useState('');
  
  // Refs for inputs
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (feedFormulations.length === 0 && activeTab === 'list') {
          // Opcional: pode forçar ir para editor se não tiver nada, mas pode ser irritante
      }
  }, [feedFormulations, activeTab]);

  const handleEdit = (formulation: FeedFormulation) => {
      setFormulationId(formulation.id);
      setFormulationName(formulation.name);
      setFormulationPhase(formulation.phase);
      setFormulationNotes(formulation.notes || '');
      setIngredients([...formulation.ingredients]);
      setActiveTab('editor');
  };

  const handleDelete = (id: string) => {
      if (window.confirm('Deseja excluir esta formulação?')) {
          deleteFeedFormulation(id);
      }
  };

  const handleCreateNew = () => {
      setFormulationId(null);
      setFormulationName('');
      setFormulationPhase('Postura');
      setFormulationNotes('');
      setIngredients([]);
      setActiveTab('editor');
  };

  const addIngredient = () => {
    // Pega valores diretamente dos inputs do DOM
    const quantityInput = quantityInputRef.current;
    const priceInput = priceInputRef.current;
    
    if (!quantityInput || !priceInput) return;
    
    const quantity = parseFloat(quantityInput.value.replace(',', '.'));
    const price = parseFloat(priceInput.value.replace(',', '.'));
    
    const nameInput = document.querySelector('input[placeholder="Ex: Milho"]') as HTMLInputElement;
    const name = nameInput?.value || '';
    
    if (name && !isNaN(price) && price > 0 && !isNaN(quantity) && quantity > 0) {
      setIngredients([...ingredients, {
        id: `ing-${Date.now()}`,
        name: name,
        pricePerKg: price,
        quantityKg: quantity
      }]);
      
      // Limpa inputs diretamente no DOM
      if (nameInput) nameInput.value = '';
      if (quantityInput) quantityInput.value = '';
      if (priceInput) priceInput.value = '';
      
      setCurrentIngredient({ name: '', price: '', quantity: '' });
      setQuantityInputValue('');
      setPriceInputValue('');
    }
  };

  const removeIngredient = (id: string) => {
      setIngredients(ingredients.filter(i => i.id !== id));
  }

  const totalWeight = ingredients.reduce((sum, item) => sum + item.quantityKg, 0);
  const totalCost = ingredients.reduce((sum, item) => sum + (item.pricePerKg * item.quantityKg), 0);
  const costPerKg = totalWeight > 0 ? totalCost / totalWeight : 0;

  const handleSaveFormulation = () => {
      if (!formulationName) {
          alert('Por favor, dê um nome para a formulação.');
          return;
      }
      if (ingredients.length === 0) {
          alert('Adicione pelo menos um ingrediente.');
          return;
      }

      const payload = {
          name: formulationName,
          phase: formulationPhase,
          notes: formulationNotes,
          ingredients: ingredients,
          totalWeight: parseFloat(totalWeight.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          costPerKg: parseFloat(costPerKg.toFixed(2))
      };

      if (formulationId) {
          updateFeedFormulation(formulationId, payload);
      } else {
          addFeedFormulation(payload);
      }

      setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Formulação e Custo de Ração</h1>
        <div className="flex items-center space-x-4">
             <NotificationBell />
        </div>
      </div>

      {activeTab === 'list' ? (
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-slate-800">Fórmulas Cadastradas</h2>
                  <button onClick={handleCreateNew} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium shadow-sm">
                      + Nova Fórmula
                  </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-500">
                          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                              <tr>
                                  <th className="px-6 py-3">Nome da Ração</th>
                                  <th className="px-6 py-3">Fase</th>
                                  <th className="px-6 py-3 text-right">Peso da Batida (kg)</th>
                                  <th className="px-6 py-3 text-right">Custo Total</th>
                                  <th className="px-6 py-3 text-right">Custo por Kg</th>
                                  <th className="px-6 py-3 text-center">Ações</th>
                              </tr>
                          </thead>
                          <tbody>
                              {feedFormulations.length > 0 ? feedFormulations.map(formula => (
                                  <Fragment key={formula.id}>
                                      <tr className="bg-white hover:bg-slate-50">
                                          <td className="px-6 pt-4 pb-1 font-medium text-slate-900 border-t border-slate-100">
                                              {formula.name}
                                              {formula.notes && <p className="text-xs text-slate-400 font-normal truncate max-w-xs">{formula.notes}</p>}
                                          </td>
                                          <td className="px-6 pt-4 pb-1 border-t border-slate-100">
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                  ${formula.phase === 'Pré-inicial' ? 'bg-indigo-100 text-indigo-700' :
                                                    formula.phase === 'Inicial' ? 'bg-blue-100 text-blue-700' :
                                                    formula.phase === 'Crescimento' ? 'bg-green-100 text-green-700' :
                                                    formula.phase === 'Postura' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-slate-100 text-slate-700'}`}>
                                                  {formula.phase}
                                              </span>
                                          </td>
                                          <td className="px-6 pt-4 pb-1 text-right border-t border-slate-100">{formula.totalWeight} kg</td>
                                          <td className="px-6 pt-4 pb-1 text-right border-t border-slate-100">{formula.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                          <td className="px-6 pt-4 pb-1 text-right font-bold text-slate-800 border-t border-slate-100">{formula.costPerKg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                          <td className="px-6 pt-4 pb-1 text-center space-x-2 border-t border-slate-100">
                                              <button onClick={() => handleEdit(formula)} className="p-1 text-slate-400 hover:text-orange-500"><EditIcon /></button>
                                              <button onClick={() => handleDelete(formula.id)} className="p-1 text-slate-400 hover:text-red-500"><TrashIcon /></button>
                                          </td>
                                      </tr>
                                      <tr className="bg-white hover:bg-slate-50">
                                          <td colSpan={6} className="px-6 pb-4 pt-2">
                                              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Ingredientes:</span>
                                                  <div className="flex flex-wrap gap-2">
                                                      {formula.ingredients.map((ing, idx) => (
                                                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-sm">
                                                              {ing.name}: <span className="font-bold ml-1 text-slate-900">{ing.quantityKg.toFixed(3)} kg</span>
                                                          </span>
                                                      ))}
                                                  </div>
                                              </div>
                                          </td>
                                      </tr>
                                  </Fragment>
                              )) : (
                                  <tr>
                                      <td colSpan={6} className="text-center py-10 text-slate-400">
                                          <CalculatorIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                          <p>Nenhuma formulação cadastrada.</p>
                                          <button onClick={handleCreateNew} className="text-orange-500 font-medium hover:underline mt-2">Criar primeira fórmula</button>
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Form Side */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Detalhes da Ração</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Nome da Fórmula</label>
                            <input 
                                type="text" 
                                value={formulationName}
                                onChange={e => setFormulationName(e.target.value)}
                                placeholder="Ex: Ração Postura Fase 1" 
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Fase</label>
                            <select 
                                value={formulationPhase}
                                onChange={e => setFormulationPhase(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="Pré-inicial">Pré-inicial</option>
                                <option value="Inicial">Inicial</option>
                                <option value="Crescimento">Crescimento</option>
                                <option value="Postura">Postura</option>
                                <option value="Engorda">Engorda</option>
                                <option value="Outra">Outra</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Observações</label>
                            <textarea 
                                value={formulationNotes}
                                onChange={e => setFormulationNotes(e.target.value)}
                                rows={2}
                                placeholder="Ex: Mistura para inverno" 
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" 
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Adicionar Ingrediente</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Ingrediente</label>
                            <input 
                                type="text" 
                                value={currentIngredient.name}
                                onChange={e => setCurrentIngredient({...currentIngredient, name: e.target.value})}
                                placeholder="Ex: Milho" 
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Preço/Kg (R$)</label>
                                <input 
                                    type="text" 
                                    ref={priceInputRef}
                                    onChange={e => {
    let value = e.target.value;
    // Permite apenas números, ponto e vírgula
    value = value.replace(/[^0-9.,]/g, '');
    e.target.value = value; // Força o valor no DOM
}}
                                    placeholder="0.00" 
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Qtd (kg)</label>
                                <input 
                                    type="text" 
                                    ref={quantityInputRef}
                                    onChange={e => {
    let value = e.target.value;
    // Permite apenas números, ponto e vírgula
    value = value.replace(/[^0-9.,]/g, '');
    e.target.value = value; // Força o valor no DOM
}}
                                    placeholder="0.0" 
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" 
                                />
                            </div>
                        </div>
                        <button 
                            onClick={addIngredient}
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors mt-2"
                        >
                            + Adicionar Ingrediente
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Side */}
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                        title="Peso Total" 
                        value={`${totalWeight.toFixed(1)} kg`}
                        icon={<span className="text-xl font-bold">⚖️</span>}
                        colorClass="bg-white"
                        iconColorClass="bg-blue-100 text-blue-600"
                    />
                    <StatCard 
                        title="Custo Total" 
                        value={`R$ ${totalCost.toFixed(2)}`}
                        icon={<span className="text-xl font-bold">$</span>}
                        colorClass="bg-white"
                        iconColorClass="bg-green-100 text-green-600"
                    />
                    <StatCard 
                        title="Custo por Kg" 
                        value={`R$ ${costPerKg.toFixed(2)}`}
                        icon={<span className="text-xl font-bold">🧮</span>}
                        colorClass="bg-white"
                        iconColorClass="bg-orange-100 text-orange-600"
                    />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Composição: {formulationName || 'Nova Mistura'}</h2>
                        <button onClick={() => setIngredients([])} className="text-sm text-slate-400 hover:text-red-500 transition-colors flex items-center">
                            Limpar Tudo
                        </button>
                    </div>

                    {ingredients.length > 0 ? (
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Ingrediente</th>
                                        <th className="px-4 py-3 text-right">Preço/Kg</th>
                                        <th className="px-4 py-3 text-right">Qtd (kg)</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                        <th className="px-4 py-3 rounded-r-lg w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="space-y-1">
                                    {ingredients.map(item => (
                                        <tr key={item.id} className="border-b border-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                                            <td className="px-4 py-3 text-right">R$ {item.pricePerKg.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right">{item.quantityKg.toFixed(3)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                R$ {(item.pricePerKg * item.quantityKg).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => removeIngredient(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <TrashIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 m-4">
                            <CalculatorIcon className="h-12 w-12 mb-2 opacity-20" />
                            <p>Adicione ingredientes para calcular o custo.</p>
                        </div>
                    )}
                    
                    <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end space-x-3">
                        <button 
                            onClick={() => setActiveTab('list')}
                            className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveFormulation}
                            className="px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm"
                        >
                            Salvar Formulação
                        </button>
                    </div>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default FeedCalculator;
