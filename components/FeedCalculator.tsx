import { useState, useEffect, useMemo, FC, useRef, Fragment } from 'react';
import { EditIcon, TrashIcon, CalculatorIcon } from './icons';
import StatCard from './StatCard';
import NotificationBell from './NotificationBell';
import IngredientPriceInput from './IngredientPriceInput';
import { useFarm } from '../context/FarmContext';
import { FeedIngredient, FeedFormulation } from '../types';

// v1.1 - Added inline edit button for each ingredient
const FeedCalculator: FC = () => {
  const { feedFormulations, addFeedFormulation, updateFeedFormulation, deleteFeedFormulation } = useFarm();
  const [activeTab, setActiveTab] = useState<'list' | 'calculator' | 'prices'>('list');
  const [selectedFormulation, setSelectedFormulation] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<number>(0);
  const [batchResults, setBatchResults] = useState<any>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  
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
      setShowFormModal(true);
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
      setShowFormModal(true);
  };

  const handleCloseModal = () => {
      setShowFormModal(false);
      setFormulationId(null);
      setFormulationName('');
      setFormulationPhase('Postura');
      setFormulationNotes('');
      setIngredients([]);
  };

  const addIngredient = () => {
    const quantity = parseFloat(currentIngredient.quantity) || 0;
    const price = parseFloat(currentIngredient.price) || 0;
    const name = currentIngredient.name;
    
    if (name && !isNaN(price) && price > 0 && !isNaN(quantity) && quantity > 0) {
      setIngredients([...ingredients, {
        id: `ing-${Date.now()}`,
        name: name,
        pricePerKg: price,
        quantityKg: quantity
      }]);
      
      // Limpa inputs
      setCurrentIngredient({ name: '', price: '', quantity: '' });
      setQuantityInputValue('');
      setPriceInputValue('');
      
      // Limpa input de quantidade no DOM
      const quantityInput = quantityInputRef.current;
      if (quantityInput) quantityInput.value = '';
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

  // Componente interno para atualização em lote de preços
  const PriceBulkUpdateTab = () => {
    const [priceUpdates, setPriceUpdates] = useState<{[key: string]: {newPrice: number, purchaseInfo: any}}>({});

    // Extrair ingredientes únicos de todas as formulações
    const uniqueIngredients = useMemo(() => {
      const ingredientsMap = new Map();
      
      feedFormulations.forEach(formulation => {
        formulation.ingredients.forEach(ing => {
          if (!ingredientsMap.has(ing.name)) {
            ingredientsMap.set(ing.name, {
              name: ing.name,
              currentPrice: ing.pricePerKg,
              usedInFormulations: [formulation.name]
            });
          } else {
            const existing = ingredientsMap.get(ing.name);
            if (!existing.usedInFormulations.includes(formulation.name)) {
              existing.usedInFormulations.push(formulation.name);
            }
          }
        });
      });
      
      return Array.from(ingredientsMap.values());
    }, [feedFormulations]);

    const handleBulkUpdate = () => {
      if (Object.keys(priceUpdates).length === 0) {
        alert('Nenhum preço foi alterado.');
        return;
      }

      let updatedCount = 0;
      
      feedFormulations.forEach(formulation => {
        let hasChanges = false;
        const updatedIngredients = formulation.ingredients.map(ing => {
          if (priceUpdates[ing.name]) {
            hasChanges = true;
            return {
              ...ing,
              pricePerKg: priceUpdates[ing.name].newPrice,
              purchaseInfo: {
                ...priceUpdates[ing.name].purchaseInfo,
                lastUpdated: new Date().toISOString()
              }
            };
          }
          return ing;
        });
        
        if (hasChanges) {
          const newTotalCost = updatedIngredients.reduce((sum, ing) => sum + (ing.pricePerKg * ing.quantityKg), 0);
          const newTotalWeight = updatedIngredients.reduce((sum, ing) => sum + ing.quantityKg, 0);
          
          updateFeedFormulation(formulation.id, {
            ...formulation,
            ingredients: updatedIngredients,
            totalCost: parseFloat(newTotalCost.toFixed(2)),
            costPerKg: parseFloat((newTotalCost / newTotalWeight).toFixed(2))
          });
          updatedCount++;
        }
      });

      alert(`✅ ${updatedCount} formulação(ões) atualizada(s) com sucesso!`);
      setPriceUpdates({});
      setActiveTab('list');
    };

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">💰 Atualizar Preços de Insumos</h3>
            <p className="text-sm text-slate-600">
              Atualize os preços dos ingredientes. As alterações serão aplicadas a todas as formulações que usam cada ingrediente.
            </p>
          </div>
          
          {uniqueIngredients.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p>Nenhum ingrediente cadastrado ainda.</p>
              <button onClick={() => setActiveTab('list')} className="text-orange-500 font-medium hover:underline mt-2">
                Criar primeira fórmula
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {uniqueIngredients.map(ingredient => (
                <div key={ingredient.name} className="border-b border-slate-200 pb-6 last:border-b-0">
                  <div className="mb-3">
                    <h4 className="font-bold text-lg text-slate-800">{ingredient.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Preço atual: <span className="font-bold text-blue-600">R$ {ingredient.currentPrice.toFixed(2)}/kg</span>
                    </p>
                  </div>
                  
                  <IngredientPriceInput
                    currentPrice={ingredient.currentPrice}
                    ingredientName={ingredient.name}
                    onPriceChange={(newPrice, purchaseInfo) => {
                      setPriceUpdates(prev => ({
                        ...prev,
                        [ingredient.name]: { newPrice, purchaseInfo }
                      }));
                    }}
                  />
                  
                  {priceUpdates[ingredient.name] && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✓ Novo preço: <span className="font-bold">R$ {priceUpdates[ingredient.name].newPrice.toFixed(2)}/kg</span>
                        {ingredient.currentPrice !== priceUpdates[ingredient.name].newPrice && (
                          <span className={`ml-2 ${priceUpdates[ingredient.name].newPrice > ingredient.currentPrice ? 'text-red-600' : 'text-green-600'}`}>
                            ({priceUpdates[ingredient.name].newPrice > ingredient.currentPrice ? '↑' : '↓'} 
                            {Math.abs(((priceUpdates[ingredient.name].newPrice - ingredient.currentPrice) / ingredient.currentPrice) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleBulkUpdate}
                  disabled={Object.keys(priceUpdates).length === 0}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ✅ Aplicar ({Object.keys(priceUpdates).length} ingrediente{Object.keys(priceUpdates).length !== 1 ? 's' : ''})
                </button>
                <button
                  onClick={() => {
                    setPriceUpdates({});
                    setActiveTab('list');
                  }}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

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

      handleCloseModal();
  };

  return (
    <div className="space-y-6">
      {/* Botões de Navegação */}
      <div className="flex gap-1 sm:gap-2 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-bold transition text-sm sm:text-lg leading-tight ${activeTab === 'list' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Formulações
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-bold transition text-sm sm:text-lg leading-tight ${activeTab === 'calculator' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Calculadora
        </button>
        <button
          onClick={() => setActiveTab('prices')}
          className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-bold transition text-sm sm:text-lg leading-tight ${activeTab === 'prices' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Preços
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
                      + Nova Formula
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
                                                    formula.phase === 'Pré-postura' ? 'bg-purple-100 text-purple-700' :
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
                                            formula.phase === 'Pré-postura' ? 'bg-purple-100 text-purple-700' :
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
      ) : activeTab === 'calculator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Coluna de Configuração */}
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">Calculadora de Batidas</h3>
            
            {/* Seletor de Formulação */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Selecione a Formulação</label>
                <select 
                  value={selectedFormulation}
                  onChange={(e) => setSelectedFormulation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
                >
                  <option value="">Escolha uma formulação...</option>
                  {feedFormulations.map(form => (
                    <option key={form.id} value={form.id}>{form.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Peso da Batida (kg)</label>
                <input 
                  type="number"
                  value={targetWeight === 0 ? '' : targetWeight}
                  onChange={(e) => setTargetWeight(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-base font-semibold"
                  placeholder="Ex: 150"
                />
                
                {/* Botões de Atalho */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setTargetWeight(100)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                  >
                    100kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetWeight(150)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                  >
                    150kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetWeight(200)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                  >
                    200kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetWeight(500)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                  >
                    500kg
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={calculateBatch}
                  disabled={!selectedFormulation || !targetWeight}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Calcular Batida
                </button>
                {batchResults && (
                  <button
                    onClick={() => {
                      setBatchResults(null);
                      setSelectedFormulation('');
                      setTargetWeight(0);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition"
                    title="Nova Batida"
                  >
                    🔄
                  </button>
                )}
              </div>
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
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl shadow-sm border border-slate-200">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">
                    Ingredientes para {batchResults.formulation}
                  </h4>
                  
                  {/* Cabeçalho Desktop */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 items-center mb-3 pb-2 border-b border-slate-200">
                    <div className="col-span-6 font-semibold text-slate-600 text-sm uppercase tracking-wide">
                      Ingrediente
                    </div>
                    <div className="col-span-3 text-right font-semibold text-slate-600 text-sm uppercase tracking-wide">
                      Quantidade
                    </div>
                    <div className="col-span-3 text-right font-semibold text-slate-600 text-sm uppercase tracking-wide">
                      Custo
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {batchResults.ingredients.map((ing: any) => (
                      <div key={ing.id} className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                        {/* Layout Mobile */}
                        <div className="block sm:hidden space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-slate-800 text-base">{ing.name}</div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{ing.calculatedWeight.toFixed(2)} kg</div>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                            <span>Preço/kg: R$ {ing.pricePerKg.toFixed(2)}</span>
                            <span className="font-semibold text-green-600">Total: R$ {ing.calculatedCost.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {/* Layout Desktop */}
                        <div className="hidden sm:block">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Nome do Ingrediente */}
                            <div className="col-span-6 font-bold text-slate-700">
                              {ing.name}
                            </div>
                            
                            {/* Quantidade em KG - Alinhado à direita */}
                            <div className="col-span-3 text-right">
                              <div className="text-3xl font-bold text-blue-600">
                                {ing.calculatedWeight.toFixed(2)} <span className="text-lg">kg</span>
                              </div>
                            </div>
                            
                            {/* Preço e Custo */}
                            <div className="col-span-3 text-right space-y-1">
                              <div className="text-sm text-slate-500">
                                R$ {ing.pricePerKg.toFixed(2)}/kg
                              </div>
                              <div className="font-semibold text-green-600">
                                R$ {ing.calculatedCost.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
                <CalculatorIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 text-sm sm:text-base">
                  Selecione uma formulação e informe o peso desejado para calcular a batida.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <PriceBulkUpdateTab />
      )}

      {/* Modal de Formulário */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                {formulationId ? 'Editar Formula' : 'Nova Formula'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Side */}
                <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-100 h-fit space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Detalhes da Ração</h3>
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
                          <option value="Pré-postura">Pré-postura</option>
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

                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Adicionar Ingrediente</h3>
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
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Preço do Ingrediente</label>
                          <IngredientPriceInput
                            currentPrice={parseFloat(currentIngredient.price) || 0}
                            ingredientName={currentIngredient.name}
                            onPriceChange={(price, purchaseInfo) => {
                              setCurrentIngredient(prev => ({
                                ...prev,
                                price: price.toString(),
                                purchaseInfo
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Qtd (kg)</label>
                          <input 
                            type="text" 
                            ref={quantityInputRef}
                            value={currentIngredient.quantity}
                            onChange={e => {
                              let value = e.target.value;
                              value = value.replace(/[^0-9.,]/g, '');
                              e.target.value = value;
                              setCurrentIngredient(prev => ({
                                ...prev,
                                quantity: value
                              }));
                            }}
                            placeholder="0.00" 
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

                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-semibold text-slate-800">Composição: {formulationName || 'Nova Mistura'}</h3>
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
                                {editingIngredientId === item.id ? (
                                  <>
                                    <td className="px-4 py-2">
                                      <input 
                                        type="text"
                                        value={editingIngredient.name}
                                        onChange={e => setEditingIngredient({...editingIngredient, name: e.target.value})}
                                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input 
                                        type="text"
                                        value={editingIngredient.pricePerKg}
                                        onChange={e => setEditingIngredient({...editingIngredient, pricePerKg: e.target.value.replace(/[^0-9.,]/g, '')})}
                                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input 
                                        type="text"
                                        value={editingIngredient.quantityKg}
                                        onChange={e => setEditingIngredient({...editingIngredient, quantityKg: e.target.value.replace(/[^0-9.,]/g, '')})}
                                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                                      />
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-slate-400 text-sm">--</td>
                                    <td className="px-4 py-2 text-center space-x-1">
                                      <button onClick={saveEditIngredient} className="text-green-500 hover:text-green-600 text-xs font-medium">Salvar</button>
                                      <button onClick={cancelEditIngredient} className="text-slate-400 hover:text-slate-600 text-xs">Cancelar</button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                                    <td className="px-4 py-3 text-right">R$ {item.pricePerKg.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">{formatQuantity(item.quantityKg)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-800">R$ {(item.pricePerKg * item.quantityKg).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-center space-x-1">
                                      <button onClick={() => startEditIngredient(item)} className="text-slate-400 hover:text-orange-500 transition-colors">
                                        <EditIcon />
                                      </button>
                                      <button onClick={() => removeIngredient(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <TrashIcon />
                                      </button>
                                    </td>
                                  </>
                                )}
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
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                <button 
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveFormulation}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm"
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
