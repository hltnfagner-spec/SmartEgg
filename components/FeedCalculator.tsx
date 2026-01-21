import { useState, useEffect, useMemo, FC, useRef, Fragment } from 'react';
import { EditIcon, TrashIcon, CalculatorIcon } from './icons';
import StatCard from './StatCard';
import NotificationBell from './NotificationBell';
import { useFarm } from '../context/FarmContext';
import { FeedIngredient, FeedFormulation } from '../types';

// v1.1 - Added inline edit button for each ingredient
const FeedCalculator: FC = () => {
  const { feedFormulations, addFeedFormulation, updateFeedFormulation, deleteFeedFormulation } = useFarm();
  const [activeTab, setActiveTab] = useState<'list' | 'calculator'>('list');
  const [selectedFormulation, setSelectedFormulation] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<number>(0);
  const [batchResults, setBatchResults] = useState<any>(null);
  
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
  
  // Estado para edição inline de ingrediente
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editingIngredient, setEditingIngredient] = useState({ name: '', pricePerKg: '', quantityKg: '' });
  
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
      // Abrir modal de edição em vez de mudar de aba
      // setActiveTab('list'); // Mantém na aba de lista
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
      // Abrir modal de criação em vez de mudar de aba
      // setActiveTab('list'); // Mantém na aba de lista
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

  const startEditIngredient = (ingredient: FeedIngredient) => {
    setEditingIngredientId(ingredient.id);
    setEditingIngredient({
      name: ingredient.name,
      pricePerKg: ingredient.pricePerKg.toString(),
      quantityKg: ingredient.quantityKg.toString()
    });
  };

  const saveEditIngredient = () => {
    if (!editingIngredientId) return;
    
    const price = parseFloat(editingIngredient.pricePerKg.replace(',', '.'));
    const quantity = parseFloat(editingIngredient.quantityKg.replace(',', '.'));
    
    if (!editingIngredient.name || isNaN(price) || isNaN(quantity)) {
      alert('Preencha todos os campos corretamente.');
      return;
    }
    
    setIngredients(ingredients.map(ing => 
      ing.id === editingIngredientId 
        ? { ...ing, name: editingIngredient.name, pricePerKg: price, quantityKg: quantity }
        : ing
    ));
    setEditingIngredientId(null);
  };

  const cancelEditIngredient = () => {
    setEditingIngredientId(null);
  };

  // Formata número: inteiro se não tem decimais, senão mostra 3 casas decimais
  const formatQuantity = (num: number): string => {
    if (Number.isInteger(num)) {
      return num.toString();  // 60 → "60"
    }
    return num.toFixed(3);  // 0.2 → "0.200"
  };

  const totalWeight = ingredients.reduce((sum, item) => sum + item.quantityKg, 0);
  const totalCost = ingredients.reduce((sum, item) => sum + (item.pricePerKg * item.quantityKg), 0);
  const costPerKg = totalWeight > 0 ? totalCost / totalWeight : 0;

  const calculateBatch = () => {
    const formulation = feedFormulations.find(f => f.id === selectedFormulation);
    if (!formulation || !targetWeight) return;

    const ratio = targetWeight / formulation.totalWeight;
    const calculatedIngredients = formulation.ingredients.map(ing => ({
      ...ing,
      calculatedWeight: ing.quantityKg * ratio,
      calculatedCost: ing.pricePerKg * (ing.quantityKg * ratio)
    }));

    setBatchResults({
      formulation: formulation.name,
      targetWeight,
      ingredients: calculatedIngredients,
      totalCost: calculatedIngredients.reduce((sum, ing) => sum + ing.calculatedCost, 0),
      costPerKg: calculatedIngredients.reduce((sum, ing) => sum + ing.calculatedCost, 0) / targetWeight
    });
  };

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
      {/* Botões de Navegação */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'list' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          📋 Formulações
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-4 py-2 rounded-lg font-bold transition ${activeTab === 'calculator' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          🧮 Calculadora de Batidas
        </button>
      </div>
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
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-500">
                          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                              <tr>
                                  <th className="px-4 lg:px-6 py-3">Nome da Ração</th>
                                  <th className="px-4 lg:px-6 py-3">Fase</th>
                                  <th className="px-4 lg:px-6 py-3 text-right">Peso (kg)</th>
                                  <th className="px-4 lg:px-6 py-3 text-right">Custo Total</th>
                                  <th className="px-4 lg:px-6 py-3 text-right">Custo/Kg</th>
                                  <th className="px-4 lg:px-6 py-3 text-center">Ações</th>
                              </tr>
                          </thead>
                          <tbody>
                              {feedFormulations.length > 0 ? feedFormulations.map(formula => (
                                  <Fragment key={formula.id}>
                                      <tr className="bg-white hover:bg-slate-50">
                                          <td className="px-4 lg:px-6 pt-4 pb-1 font-medium text-slate-900 border-t border-slate-100">
                                              {formula.name}
                                          </td>
                                          <td className="px-4 lg:px-6 pt-4 pb-1 border-t border-slate-100">
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                  ${formula.phase === 'Pré-inicial' ? 'bg-indigo-100 text-indigo-700' :
                                                    formula.phase === 'Inicial' ? 'bg-blue-100 text-blue-700' :
                                                    formula.phase === 'Crescimento' ? 'bg-green-100 text-green-700' :
                                                    formula.phase === 'Postura' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-slate-100 text-slate-700'}`}>
                                                  {formula.phase}
                                              </span>
                                          </td>
                                          <td className="px-4 lg:px-6 pt-4 pb-1 text-right border-t border-slate-100">{formula.totalWeight} kg</td>
                                          <td className="px-4 lg:px-6 pt-4 pb-1 text-right border-t border-slate-100">{formula.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                          <td className="px-4 lg:px-6 pt-4 pb-1 text-right font-bold text-slate-800 border-t border-slate-100">{formula.costPerKg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                          <td className="px-4 lg:px-6 pt-4 pb-1 text-center space-x-2 border-t border-slate-100">
                                              <button onClick={() => handleEdit(formula)} className="p-1 text-slate-400 hover:text-orange-500"><EditIcon /></button>
                                              <button onClick={() => handleDelete(formula.id)} className="p-1 text-slate-400 hover:text-red-500"><TrashIcon /></button>
                                          </td>
                                      </tr>
                                      <tr className="bg-white hover:bg-slate-50">
                                          <td colSpan={6} className="px-4 lg:px-6 pb-4 pt-2">
                                              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                  {formula.notes && (
                                                      <div className="mb-3 pb-2 border-b border-slate-200">
                                                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observações:</span>
                                                          <p className="text-sm text-slate-600 mt-1">{formula.notes}</p>
                                                      </div>
                                                  )}
                                                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Ingredientes:</span>
                                                  <div className="flex flex-wrap gap-2">
                                                      {formula.ingredients.map((ing, idx) => (
                                                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-sm">
                                                              {ing.name}: <span className="font-bold ml-1 text-slate-900">{formatQuantity(ing.quantityKg)} kg</span>
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

                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-slate-100">
                      {feedFormulations.length > 0 ? feedFormulations.map(formula => (
                          <div key={formula.id} className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-slate-900 truncate">{formula.name}</h3>
                                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium 
                                          ${formula.phase === 'Pré-inicial' ? 'bg-indigo-100 text-indigo-700' :
                                            formula.phase === 'Inicial' ? 'bg-blue-100 text-blue-700' :
                                            formula.phase === 'Crescimento' ? 'bg-green-100 text-green-700' :
                                            formula.phase === 'Postura' ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-100 text-slate-700'}`}>
                                          {formula.phase}
                                      </span>
                                  </div>
                                  <div className="flex space-x-1 ml-2">
                                      <button onClick={() => handleEdit(formula)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-slate-100 rounded-lg"><EditIcon /></button>
                                      <button onClick={() => handleDelete(formula.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg"><TrashIcon /></button>
                                  </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                                      <p className="text-xs text-slate-500">Peso</p>
                                      <p className="font-semibold text-slate-800">{formula.totalWeight} kg</p>
                                  </div>
                                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                                      <p className="text-xs text-slate-500">Custo Total</p>
                                      <p className="font-semibold text-slate-800">{formula.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                  </div>
                                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                                      <p className="text-xs text-orange-600">Custo/Kg</p>
                                      <p className="font-bold text-orange-600">{formula.costPerKg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                  </div>
                              </div>
                              {formula.notes && (
                                  <div className="bg-amber-50 rounded-lg p-2 border border-amber-100 mb-3">
                                      <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Observações:</span>
                                      <p className="text-sm text-slate-600 mt-1">{formula.notes}</p>
                                  </div>
                              )}
                              <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Ingredientes:</span>
                                  <div className="flex flex-wrap gap-1">
                                      {formula.ingredients.map((ing, idx) => (
                                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-slate-700 border border-slate-200">
                                              {ing.name}: <span className="font-bold ml-1">{formatQuantity(ing.quantityKg)}kg</span>
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      )) : (
                          <div className="text-center py-10 text-slate-400">
                              <CalculatorIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                              <p>Nenhuma formulação cadastrada.</p>
                              <button onClick={handleCreateNew} className="text-orange-500 font-medium hover:underline mt-2">Criar primeira fórmula</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna de Configuração */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Calculadora de Batidas</h3>
            
            {/* Seletor de Formulação */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Selecione a Formulação</label>
                <select 
                  value={selectedFormulation}
                  onChange={(e) => setSelectedFormulation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Escolha uma formulação...</option>
                  {feedFormulations.map(form => (
                    <option key={form.id} value={form.id}>{form.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Peso da Batida (kg)</label>
                <input 
                  type="number"
                  value={targetWeight === 0 ? '' : targetWeight}
                  onChange={(e) => setTargetWeight(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 150"
                />
              </div>

              <button
                onClick={calculateBatch}
                disabled={!selectedFormulation || !targetWeight}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Calcular Batida
              </button>
            </div>
          </div>

          {/* Coluna de Resultados */}
          <div className="lg:col-span-2">
            {batchResults ? (
              <div className="space-y-6">
                {/* Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    title="Peso Total"
                    value={`${batchResults.targetWeight.toFixed(1)} kg`}
                    icon={<span className="text-xl">⚖️</span>}
                    colorClass="bg-white"
                    iconColorClass="bg-blue-100 text-blue-600"
                  />
                  <StatCard
                    title="Custo Total"
                    value={`R$ ${batchResults.totalCost.toFixed(2)}`}
                    icon={<span className="text-xl">$</span>}
                    colorClass="bg-white"
                    iconColorClass="bg-green-100 text-green-600"
                  />
                  <StatCard
                    title="Custo por Kg"
                    value={`R$ ${batchResults.costPerKg.toFixed(2)}`}
                    icon={<span className="text-xl">🧮</span>}
                    colorClass="bg-white"
                    iconColorClass="bg-orange-100 text-orange-600"
                  />
                </div>

                {/* Lista de Ingredientes */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">
                    Ingredientes para {batchResults.formulation}
                  </h4>
                  <div className="space-y-4">
                    {batchResults.ingredients.map((ing: any) => (
                      <div key={ing.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="col-span-4 font-bold text-slate-700">{ing.name}</div>
                        <div className="col-span-3 text-center font-medium text-blue-600">
                          {ing.calculatedWeight.toFixed(2)} kg
                        </div>
                        <div className="col-span-2 text-center text-slate-600">
                          R$ {ing.pricePerKg.toFixed(2)}/kg
                        </div>
                        <div className="col-span-3 text-right font-bold text-green-600">
                          R$ {ing.calculatedCost.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
                <CalculatorIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600">
                  Selecione uma formulação e informe o peso desejado para calcular a batida.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedCalculator;
