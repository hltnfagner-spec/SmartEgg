
import { createContext, useState, useEffect, useContext, ReactNode, useCallback, FC } from 'react';
import { Flock, DailyRecord, Expense, Sale, FlockTask, Shed, Client, InventoryItem, FeedFormulation, View } from '../types';

interface FarmContextType {
  sheds: Shed[];
  flocks: Flock[];
  records: DailyRecord[];
  expenses: Expense[];
  sales: Sale[];
  tasks: FlockTask[];
  clients: Client[];
  inventory: InventoryItem[];
  feedFormulations: FeedFormulation[];
  
  // Navigation State
  currentView: View;
  viewParams: Record<string, any>;
  navigate: (view: View, params?: Record<string, any>) => void;

  addShed: (shed: Omit<Shed, 'id'>) => void;
  updateShed: (shedId: string, data: Omit<Shed, 'id'>) => void;
  addFlock: (flock: Omit<Flock, 'id' | 'status'>) => void;
  updateFlock: (flockId: string, data: Omit<Flock, 'id' | 'status'>) => void;
  disposeFlock: (flockId: string) => void;
  addRecord: (record: Omit<DailyRecord, 'id'>) => void;
  updateRecord: (recordId: string, data: Omit<DailyRecord, 'id'>) => void;
  deleteRecord: (recordId: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expenseId: string, data: Omit<Expense, 'id'>) => void;
  addSale: (sale: Omit<Sale, 'id' | 'totalAmount'>) => void;
  updateSale: (saleId: string, data: Omit<Sale, 'id' | 'totalAmount'>) => void;
  addTask: (task: Omit<FlockTask, 'id'>) => void;
  toggleTaskCompletion: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (clientId: string, data: Omit<Client, 'id'>) => void;
  deleteClient: (clientId: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  updateInventoryItem: (id: string, data: Partial<Omit<InventoryItem, 'id'>>) => void;
  deleteInventoryItem: (id: string) => void;
  addFeedFormulation: (formulation: Omit<FeedFormulation, 'id'>) => void;
  updateFeedFormulation: (id: string, formulation: Omit<FeedFormulation, 'id'>) => void;
  deleteFeedFormulation: (id: string) => void;
  getShedById: (id: string) => Shed | undefined;
  getFlockById: (id: string) => Flock | undefined;
  getClientById: (id: string) => Client | undefined;
  getAvailableSheds: () => Shed[];
  getRecordsByFlockId: (flockId: string) => DailyRecord[];
  getExpensesByFlockId: (flockId: string) => Expense[];
  getSalesByFlockId: (flockId: string) => Sale[];
  getTasksByFlockId: (flockId: string) => FlockTask[];
  getHensCountOnDate: (flockId: string, date: Date) => number;
  clearData: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewParams, setViewParams] = useState<Record<string, any>>({});

  const [sheds, setSheds] = useState<Shed[]>(() => {
    const savedSheds = localStorage.getItem('farm_sheds');
    return savedSheds ? JSON.parse(savedSheds) : [];
  });

  const [flocks, setFlocks] = useState<Flock[]>(() => {
    const savedFlocks = localStorage.getItem('farm_flocks');
    return savedFlocks ? JSON.parse(savedFlocks) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
      const savedClients = localStorage.getItem('farm_clients');
      return savedClients ? JSON.parse(savedClients) : [];
  });

  const [records, setRecords] = useState<DailyRecord[]>(() => {
    const savedRecords = localStorage.getItem('farm_records');
    return savedRecords ? JSON.parse(savedRecords) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const savedExpenses = localStorage.getItem('farm_expenses');
    return savedExpenses ? JSON.parse(savedExpenses) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const savedSales = localStorage.getItem('farm_sales');
    return savedSales ? JSON.parse(savedSales) : [];
  });

  const [tasks, setTasks] = useState<FlockTask[]>(() => {
    const savedTasks = localStorage.getItem('farm_tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const savedInventory = localStorage.getItem('farm_inventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  const [feedFormulations, setFeedFormulations] = useState<FeedFormulation[]>(() => {
      const savedFormulations = localStorage.getItem('farm_feed_formulations');
      return savedFormulations ? JSON.parse(savedFormulations) : [];
  });

  useEffect(() => {
    localStorage.setItem('farm_sheds', JSON.stringify(sheds));
  }, [sheds]);

  useEffect(() => {
    localStorage.setItem('farm_flocks', JSON.stringify(flocks));
  }, [flocks]);
  
  useEffect(() => {
    localStorage.setItem('farm_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('farm_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('farm_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('farm_sales', JSON.stringify(sales));
  }, [sales]);
  
  useEffect(() => {
    localStorage.setItem('farm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('farm_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
      localStorage.setItem('farm_feed_formulations', JSON.stringify(feedFormulations));
  }, [feedFormulations]);

  const navigate = (view: View, params: Record<string, any> = {}) => {
      setCurrentView(view);
      setViewParams(params);
  };

  const clearData = () => {
    setSheds([]);
    setFlocks([]);
    setRecords([]);
    setExpenses([]);
    setSales([]);
    setTasks([]);
    setClients([]);
    setInventory([]);
    setFeedFormulations([]);
    
    localStorage.removeItem('farm_sheds');
    localStorage.removeItem('farm_flocks');
    localStorage.removeItem('farm_clients');
    localStorage.removeItem('farm_records');
    localStorage.removeItem('farm_expenses');
    localStorage.removeItem('farm_sales');
    localStorage.removeItem('farm_tasks');
    localStorage.removeItem('farm_inventory');
    localStorage.removeItem('farm_feed_formulations');
  };

  // Helper function to manage egg stock automatically (Quantity Only - Used for Sales)
  const adjustEggStock = (amount: number) => {
       setInventory(prev => {
           const eggItem = prev.find(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
           
           if (eggItem) {
               return prev.map(i => 
                   i.id === eggItem.id 
                   ? { ...i, quantity: Math.max(0, i.quantity + amount), lastUpdated: new Date().toISOString() } 
                   : i
               );
           } else if (amount > 0) {
               // Fallback: Create new egg stock if not exists, default price
               const newItem: InventoryItem = {
                   id: `inv-auto-eggs-${Date.now()}`,
                   name: 'Ovos (Produção)',
                   category: 'Produto Final',
                   quantity: amount,
                   unit: 'unidade',
                   minThreshold: 100, // Default threshold
                   costPerUnit: 0.50, // Default estimate cost
                   lastUpdated: new Date().toISOString()
               };
               return [...prev, newItem];
           }
           return prev;
       });
  };

  const addShed = (shedData: Omit<Shed, 'id'>) => {
    const newShed: Shed = { ...shedData, id: `shed-${Date.now()}` };
    setSheds(prev => [...prev, newShed]);
  };

  const updateShed = (shedId: string, data: Omit<Shed, 'id'>) => {
    setSheds(prev => prev.map(shed =>
      shed.id === shedId ? { id: shedId, ...data } : shed
    ));
  };
  
  const addFlock = (flockData: Omit<Flock, 'id' | 'status'>) => {
    const newFlock: Flock = { ...flockData, id: `flock-${Date.now()}`, status: 'Ativo' };
    setFlocks(prev => [...prev, newFlock]);
  };

  const updateFlock = (flockId: string, data: Omit<Flock, 'id' | 'status'>) => {
    setFlocks(prev => prev.map(flock => 
      flock.id === flockId ? { ...flock, ...data } : flock
    ));
  };

  const disposeFlock = (flockId: string) => {
    setFlocks(prev => prev.map(flock => 
      flock.id === flockId ? { ...flock, status: 'Descartado' } : flock
    ));
  };

  const addRecord = (recordData: Omit<DailyRecord, 'id'>) => {
    const newRecord: DailyRecord = { 
        ...recordData, 
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` 
    };
    setRecords(prev => [...prev, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

    // WEIGHTED AVERAGE COST LOGIC
    // We update inventory manually here instead of using adjustEggStock to handle cost calculation
    setInventory(prev => {
        let newInventory = [...prev];
        const feedItem = newInventory.find(i => i.category === 'Ração');
        const feedPrice = feedItem ? feedItem.costPerUnit : 0;
        const totalRecordCost = recordData.feedConsumedKg * feedPrice;

        // 1. Deduct Feed
        if (feedItem && recordData.feedConsumedKg > 0) {
            newInventory = newInventory.map(item => 
                item.id === feedItem.id 
                ? { ...item, quantity: Math.max(0, item.quantity - recordData.feedConsumedKg), lastUpdated: new Date().toISOString() }
                : item
            );
        }

        // 2. Add Eggs with Weighted Average Cost Calculation
        const netEggs = recordData.eggsCollected - (recordData.brokenEggs || 0);
        if (netEggs > 0) {
            const eggItemIndex = newInventory.findIndex(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
            
            if (eggItemIndex >= 0) {
                const currentItem = newInventory[eggItemIndex];
                const currentTotalValue = currentItem.quantity * currentItem.costPerUnit;
                
                // Formula: (CurrentValue + NewValue) / (CurrentQty + NewQty)
                const newTotalValue = currentTotalValue + totalRecordCost;
                const newTotalQty = currentItem.quantity + netEggs;
                
                // Calculate new Average Cost
                const newCostPerUnit = newTotalQty > 0 ? newTotalValue / newTotalQty : currentItem.costPerUnit;

                newInventory[eggItemIndex] = {
                    ...currentItem,
                    quantity: newTotalQty,
                    costPerUnit: parseFloat(newCostPerUnit.toFixed(4)), // Keep precision
                    lastUpdated: new Date().toISOString()
                };
            } else {
                // Create new egg stock item if it doesn't exist
                const unitCost = totalRecordCost / netEggs;
                newInventory.push({
                    id: `inv-auto-eggs-${Date.now()}`,
                    name: 'Ovos (Produção)',
                    category: 'Produto Final',
                    quantity: netEggs,
                    unit: 'unidade',
                    minThreshold: 100,
                    costPerUnit: parseFloat(unitCost.toFixed(4)),
                    lastUpdated: new Date().toISOString()
                });
            }
        }

        return newInventory;
    });
  };
  
  const updateRecord = (recordId: string, data: Omit<DailyRecord, 'id'>) => {
    // We need the old record to calculate differences for inventory adjustment
    setRecords(prev => {
        const oldRecord = prev.find(r => r.id === recordId);
        
        if (oldRecord) {
            // Apply Differential Update to Inventory with Cost Recalculation
            setInventory(invPrev => {
                let newInventory = [...invPrev];
                const feedItem = newInventory.find(i => i.category === 'Ração');
                const feedPrice = feedItem ? feedItem.costPerUnit : 0;
                
                // Differential Values
                const feedDiff = data.feedConsumedKg - oldRecord.feedConsumedKg;
                const oldNetEggs = oldRecord.eggsCollected - (oldRecord.brokenEggs || 0);
                const newNetEggs = data.eggsCollected - (data.brokenEggs || 0);
                const eggDiff = newNetEggs - oldNetEggs;
                
                // Cost Differential (New Feed Cost - Old Feed Cost)
                const costDiff = feedDiff * feedPrice;

                // 1. Update Feed Stock
                if (feedItem && feedDiff !== 0) {
                     newInventory = newInventory.map(item => 
                        item.id === feedItem.id 
                        ? { ...item, quantity: Math.max(0, item.quantity - feedDiff), lastUpdated: new Date().toISOString() }
                        : item
                    );
                }

                // 2. Update Egg Stock & Price
                if (eggDiff !== 0 || costDiff !== 0) {
                     const eggItemIndex = newInventory.findIndex(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
                     if (eggItemIndex >= 0) {
                        const currentItem = newInventory[eggItemIndex];
                        const currentTotalValue = currentItem.quantity * currentItem.costPerUnit;
                        
                        // New Total Value = Current Value + Cost Difference (can be negative)
                        const newTotalValue = Math.max(0, currentTotalValue + costDiff);
                        const newTotalQty = Math.max(0, currentItem.quantity + eggDiff);
                        const newCostPerUnit = newTotalQty > 0 ? newTotalValue / newTotalQty : currentItem.costPerUnit;

                        newInventory[eggItemIndex] = {
                            ...currentItem,
                            quantity: newTotalQty,
                            costPerUnit: parseFloat(newCostPerUnit.toFixed(4)),
                            lastUpdated: new Date().toISOString()
                        };
                     }
                }
                return newInventory;
            });
        }

        return prev.map(rec => rec.id === recordId ? { id: recordId, ...data } : rec);
    });
  };

  const deleteRecord = (recordId: string) => {
    // Restore inventory when deleting a record
    const recordToDelete = records.find(r => r.id === recordId);
    
    if (recordToDelete) {
        setInventory(invPrev => {
            let newInventory = [...invPrev];
            const feedItem = newInventory.find(i => i.category === 'Ração');
            const feedPrice = feedItem ? feedItem.costPerUnit : 0;
            
            // Value of the record to remove
            const recordValue = recordToDelete.feedConsumedKg * feedPrice;

            // 1. Restore Feed
            if (feedItem && recordToDelete.feedConsumedKg > 0) {
                newInventory = newInventory.map(item => 
                    item.id === feedItem.id 
                    ? { ...item, quantity: item.quantity + recordToDelete.feedConsumedKg, lastUpdated: new Date().toISOString() }
                    : item
                );
            }

            // 2. Remove Eggs & Adjust Cost (Reverse Weighted Average)
            const netEggs = recordToDelete.eggsCollected - (recordToDelete.brokenEggs || 0);
            if (netEggs > 0) {
                const eggItemIndex = newInventory.findIndex(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
                if (eggItemIndex >= 0) {
                    const currentItem = newInventory[eggItemIndex];
                    const currentTotalValue = currentItem.quantity * currentItem.costPerUnit;
                    
                    // Subtract the value and quantity of the deleted record
                    const newTotalValue = Math.max(0, currentTotalValue - recordValue);
                    const newTotalQty = Math.max(0, currentItem.quantity - netEggs);
                    
                    // If we remove all eggs, keep cost same or reset. If quantity remains, recalculate.
                    const newCostPerUnit = newTotalQty > 0 ? newTotalValue / newTotalQty : currentItem.costPerUnit;

                    newInventory[eggItemIndex] = {
                        ...currentItem,
                        quantity: newTotalQty,
                        costPerUnit: parseFloat(newCostPerUnit.toFixed(4)),
                        lastUpdated: new Date().toISOString()
                    };
                }
            }
            return newInventory;
        });
    }

    setRecords(prev => prev.filter(rec => rec.id !== recordId));
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expenseData, id: `expense-${Date.now()}`};
    setExpenses(prev => [...prev, newExpense].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }

  const updateExpense = (expenseId: string, data: Omit<Expense, 'id'>) => {
      setExpenses(prev => prev.map(exp => exp.id === expenseId ? { id: expenseId, ...data } : exp));
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'totalAmount'>) => {
    const totalAmount = saleData.quantity * saleData.pricePerUnit;
    const newSale: Sale = { ...saleData, productType: saleData.productType || 'Ovos', id: `sale-${Date.now()}`, totalAmount };
    setSales(prev => [...prev, newSale].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    // Deduct from inventory if selling eggs (Quantity only, FIFO logic implies Price doesn't change on sale)
    if (saleData.productType === 'Ovos' || !saleData.productType) {
        adjustEggStock(-saleData.quantity);
    }
  }

  const updateSale = (saleId: string, data: Omit<Sale, 'id' | 'totalAmount'>) => {
      // Calculate diff to adjust inventory
      const oldSale = sales.find(s => s.id === saleId);
      
      if (oldSale && (oldSale.productType === 'Ovos' || !oldSale.productType)) {
          // Revert old quantity (add back)
           adjustEggStock(oldSale.quantity);
      }
      
      if (data.productType === 'Ovos' || !data.productType) {
          // Apply new quantity (subtract)
          adjustEggStock(-data.quantity);
      }

      const totalAmount = data.quantity * data.pricePerUnit;
      setSales(prev => prev.map(sale => sale.id === saleId ? { id: saleId, ...data, totalAmount } : sale));
  };
  
  const addTask = (taskData: Omit<FlockTask, 'id'>) => {
    const newTask: FlockTask = { ...taskData, id: `task-${Date.now()}` };
    setTasks(prev => [...prev, newTask].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
  };
  
  const toggleTaskCompletion = (taskId: string) => {
      setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      ));
  };
  
  const deleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const addClient = (clientData: Omit<Client, 'id'>) => {
      const newClient: Client = { ...clientData, id: `client-${Date.now()}` };
      setClients(prev => [...prev, newClient]);
  }

  const updateClient = (clientId: string, data: Omit<Client, 'id'>) => {
      setClients(prev => prev.map(client => client.id === clientId ? { id: clientId, ...data } : client));
  }

  const deleteClient = (clientId: string) => {
      setClients(prev => prev.filter(client => client.id !== clientId));
  }

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
      const newItem: InventoryItem = { 
          ...itemData, 
          id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, 
          lastUpdated: new Date().toISOString() 
      };
      setInventory(prev => [...prev, newItem]);
  };

  const updateInventoryItem = (id: string, data: Partial<Omit<InventoryItem, 'id'>>) => {
      setInventory(prev => prev.map(item => 
          item.id === id 
          ? { ...item, ...data, lastUpdated: new Date().toISOString() } 
          : item
      ));
  };

  const deleteInventoryItem = (id: string) => {
      setInventory(prev => prev.filter(item => item.id !== id));
  };

  const addFeedFormulation = (formulation: Omit<FeedFormulation, 'id'>) => {
      const newFormulation: FeedFormulation = { ...formulation, id: `form-${Date.now()}` };
      setFeedFormulations(prev => [...prev, newFormulation]);
  };

  const updateFeedFormulation = (id: string, data: Omit<FeedFormulation, 'id'>) => {
      setFeedFormulations(prev => prev.map(f => f.id === id ? { id, ...data } : f));
  };

  const deleteFeedFormulation = (id: string) => {
      setFeedFormulations(prev => prev.filter(f => f.id !== id));
  };

  const getShedById = useCallback((id: string) => sheds.find(s => s.id === id), [sheds]);

  const getFlockById = useCallback((id: string) => flocks.find(f => f.id === id), [flocks]);

  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  
  const getAvailableSheds = useCallback(() => {
    const occupiedShedIds = flocks.filter(f => f.status === 'Ativo').map(f => f.shedId);
    return sheds.filter(s => !occupiedShedIds.includes(s.id));
  }, [sheds, flocks]);

  const getRecordsByFlockId = useCallback((flockId: string) => {
    return records.filter(r => r.flockId === flockId);
  }, [records]);
  
  const getExpensesByFlockId = useCallback((flockId: string) => {
    return expenses.filter(e => e.flockId === flockId);
  }, [expenses]);
  
  const getSalesByFlockId = useCallback((flockId: string) => {
    return sales.filter(s => s.flockId === flockId);
  }, [sales]);
  
  const getTasksByFlockId = useCallback((flockId: string) => {
    return tasks.filter(t => t.flockId === flockId).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks]);


  const getHensCountOnDate = useCallback((flockId: string, date: Date) => {
      const flock = getFlockById(flockId);
      if (!flock) return 0;
      
      const relevantRecords = getRecordsByFlockId(flockId)
          .filter(r => new Date(r.date) <= date);
      
      const totalMortality = relevantRecords.reduce((sum, record) => sum + record.mortality, 0);

      return flock.initialHenCount - totalMortality;
  }, [getFlockById, getRecordsByFlockId]);

  return (
    <FarmContext.Provider value={{ 
        sheds, flocks, records, expenses, sales, tasks, clients, inventory, feedFormulations,
        currentView, viewParams, navigate,
        addShed, updateShed, addFlock, updateFlock, disposeFlock, 
        addRecord, updateRecord, deleteRecord, 
        addExpense, updateExpense, addSale, updateSale, 
        addTask, toggleTaskCompletion, deleteTask, 
        addClient, updateClient, deleteClient, 
        addInventoryItem, updateInventoryItem, deleteInventoryItem,
        addFeedFormulation, updateFeedFormulation, deleteFeedFormulation,
        getShedById, getFlockById, getClientById, getAvailableSheds, 
        getRecordsByFlockId, getExpensesByFlockId, getSalesByFlockId, getTasksByFlockId, getHensCountOnDate,
        clearData
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = (): FarmContextType => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
