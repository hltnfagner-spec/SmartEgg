
import { createContext, useState, useEffect, useContext, ReactNode, useCallback, FC } from 'react';
import { Flock, DailyRecord, Expense, Sale, FlockTask, Shed, Client, InventoryItem, FeedFormulation, View } from '../types';
import { supabase } from '../services/supabaseClient';

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

  // Usuário atual (para filtrar dados no Supabase)
  const [userId, setUserId] = useState<string | null>(null);

  const [sheds, setSheds] = useState<Shed[]>(() => {
    try {
      const savedSheds = localStorage.getItem('farm_sheds');
      return savedSheds ? JSON.parse(savedSheds) : [];
    } catch {
      return [];
    }
  });

  const [flocks, setFlocks] = useState<Flock[]>(() => {
    try {
      const savedFlocks = localStorage.getItem('farm_flocks');
      return savedFlocks ? JSON.parse(savedFlocks) : [];
    } catch {
      return [];
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
      try {
        const savedClients = localStorage.getItem('farm_clients');
        return savedClients ? JSON.parse(savedClients) : [];
      } catch {
        return [];
      }
  });

  const [records, setRecords] = useState<DailyRecord[]>(() => {
    try {
      const savedRecords = localStorage.getItem('farm_records');
      return savedRecords ? JSON.parse(savedRecords) : [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const savedExpenses = localStorage.getItem('farm_expenses');
      return savedExpenses ? JSON.parse(savedExpenses) : [];
    } catch {
      return [];
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const savedSales = localStorage.getItem('farm_sales');
      return savedSales ? JSON.parse(savedSales) : [];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<FlockTask[]>(() => {
    try {
      const savedTasks = localStorage.getItem('farm_tasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch {
      return [];
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const savedInventory = localStorage.getItem('farm_inventory');
      return savedInventory ? JSON.parse(savedInventory) : [];
    } catch {
      return [];
    }
  });

  const [feedFormulations, setFeedFormulations] = useState<FeedFormulation[]>(() => {
      try {
        const savedFormulations = localStorage.getItem('farm_feed_formulations');
        return savedFormulations ? JSON.parse(savedFormulations) : [];
      } catch {
        return [];
      }
  });

  // Função auxiliar para carregar sheds, flocks, registros diários, estoque e despesas para um usuário específico
  const loadDataForUser = useCallback(async (currentUserId: string) => {
    try {
      // Carregar sheds
      const { data: shedsData, error: shedsError } = await supabase
        .from('sheds')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: true });

      if (!shedsError && shedsData) {
        const mappedSheds: Shed[] = shedsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          capacity: s.capacity,
          notes: s.notes ?? undefined,
        }));
        setSheds(mappedSheds);
      } else if (shedsError) {
        console.error('[FarmContext] Erro ao carregar sheds do Supabase:', shedsError);
      }

      // Carregar flocks
      const { data: flocksData, error: flocksError } = await supabase
        .from('flocks')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: true });

      if (!flocksError && flocksData) {
        const mappedFlocks: Flock[] = flocksData.map((f: any) => ({
          id: f.id,
          shedId: f.shed_id,
          name: f.name,
          breed: f.breed,
          birthDate: f.birth_date,
          arrivalDate: f.arrival_date,
          plannedDisposalDate: f.planned_disposal_date,
          initialHenCount: f.initial_hen_count,
          status: f.status,
        }));
        setFlocks(mappedFlocks);
      } else if (flocksError) {
        console.error('[FarmContext] Erro ao carregar flocks do Supabase:', flocksError);
      }

      // Carregar registros diários
      const { data: recordsData, error: recordsError } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', currentUserId)
        .order('date', { ascending: true });

      if (!recordsError && recordsData) {
        const mappedRecords: DailyRecord[] = recordsData.map((r: any) => ({
          id: r.id,
          flockId: r.flock_id,
          date: r.date,
          eggsCollected: r.eggs_collected,
          brokenEggs: r.broken_eggs,
          feedConsumedKg: parseFloat(r.feed_consumed_kg),
          waterConsumedLiters: parseFloat(r.water_consumed_liters),
          mortality: r.mortality,
          notes: r.notes ?? undefined,
        }));
        setRecords(mappedRecords);
      } else if (recordsError) {
        console.error('[FarmContext] Erro ao carregar registros diários do Supabase:', recordsError);
      }

      // Carregar estoque
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', currentUserId)
        .order('last_updated', { ascending: false });

      if (!inventoryError && inventoryData) {
        const mappedInventory: InventoryItem[] = inventoryData.map((i: any) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          minThreshold: parseFloat(i.min_threshold),
          costPerUnit: parseFloat(i.cost_per_unit),
          lastUpdated: i.last_updated,
        }));
        setInventory(mappedInventory);
      } else if (inventoryError) {
        console.error('[FarmContext] Erro ao carregar estoque do Supabase:', inventoryError);
      }

      // Carregar despesas
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', currentUserId)
        .order('date', { ascending: false });

      if (!expensesError && expensesData) {
        const mappedExpenses: Expense[] = expensesData.map((e: any) => ({
          id: e.id,
          flockId: e.flock_id,
          date: e.date,
          description: e.description,
          category: e.category,
          amount: parseFloat(e.amount),
        }));
        setExpenses(mappedExpenses);
      } else if (expensesError) {
        console.error('[FarmContext] Erro ao carregar despesas do Supabase:', expensesError);
      }

      // Carregar vendas
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', currentUserId)
        .order('date', { ascending: false });

      if (!salesError && salesData) {
        const mappedSales: Sale[] = salesData.map((s: any) => ({
          id: s.id,
          flockId: s.flock_id,
          clientId: s.client_id,
          date: s.date,
          productType: s.product_type,
          saleType: s.sale_type,
          paymentMethod: s.payment_method,
          paymentStatus: s.payment_status,
          quantity: parseFloat(s.quantity),
          pricePerUnit: parseFloat(s.price_per_unit),
          totalAmount: parseFloat(s.total_amount),
          deliveryDate: s.delivery_date,
          deliveryStatus: s.delivery_status,
          deliveryAddress: s.delivery_address,
          deliveryNotes: s.delivery_notes,
        }));
        setSales(mappedSales);
      } else if (salesError) {
        console.error('[FarmContext] Erro ao carregar vendas do Supabase:', salesError);
      }

      // Carregar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: true });

      if (!clientsError && clientsData) {
        const mappedClients: Client[] = clientsData.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          type: c.type,
          notes: c.notes,
        }));
        setClients(mappedClients);
      } else if (clientsError) {
        console.error('[FarmContext] Erro ao carregar clientes do Supabase:', clientsError);
      }

      // Carregar tarefas
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', currentUserId)
        .order('due_date', { ascending: true });

      if (!tasksError && tasksData) {
        const mappedTasks: FlockTask[] = tasksData.map((t: any) => ({
          id: t.id,
          flockId: t.flock_id,
          taskType: t.task_type,
          dueDate: t.due_date,
          notes: t.notes,
          isCompleted: t.is_completed,
        }));
        setTasks(mappedTasks);
      } else if (tasksError) {
        console.error('[FarmContext] Erro ao carregar tarefas do Supabase:', tasksError);
      }

      // Carregar formulações de ração
      const { data: formulationsData, error: formulationsError } = await supabase
        .from('feed_formulations')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: true });

      if (!formulationsError && formulationsData) {
        const mappedFormulations: FeedFormulation[] = formulationsData.map((f: any) => {
          // A formulação está armazenada no campo 'data' como JSON
          const formData = f.data || {};
          return {
            id: f.id,
            name: f.name,
            phase: formData.phase || 'Outra',
            ingredients: formData.ingredients || [],
            totalWeight: formData.totalWeight || 0,
            totalCost: formData.totalCost || 0,
            costPerKg: formData.costPerKg || 0,
            notes: f.description,
          };
        });
        setFeedFormulations(mappedFormulations);
      } else if (formulationsError) {
        console.error('[FarmContext] Erro ao carregar formulações do Supabase:', formulationsError);
      }
    } catch (error) {
      console.error('[FarmContext] Erro ao carregar dados do Supabase:', error);
    }
  }, []);

  // Garante que o usuário esteja na tabela user_contacts
  const ensureUserInContacts = useCallback(async (userId: string) => {
    try {
      // Verificar se usuário já existe na tabela
      const { data: existingContact, error: checkError } = await supabase
        .from('user_contacts')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Usuário não existe, vamos buscar os dados e inserir
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (!userError && userData.user) {
          const metadata = userData.user.user_metadata || {};
          
          await supabase
            .from('user_contacts')
            .insert({
              user_id: userId,
              email: userData.user.email || '',
              name: metadata.name || '',
              phone: metadata.phone || '',
              farm_name: metadata.farmName || '',
              contact_type: 'user'
            });
        }
      }
    } catch (error) {
      console.error('[FarmContext] Erro ao verificar/inserir usuário em user_contacts:', error);
    }
  }, []);

  // Carrega dados iniciais e reage a mudanças de autenticação do Supabase
  useEffect(() => {
    const init = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!sessionError && sessionData.session) {
        const currentUserId = sessionData.session.user.id;
        setUserId(currentUserId);
        await ensureUserInContacts(currentUserId);
        await loadDataForUser(currentUserId);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const currentUserId = session.user.id;
        setUserId(currentUserId);
        
        // Garantir que usuário este salvo em user_contacts
        if (event === 'SIGNED_IN') {
          await ensureUserInContacts(currentUserId);
        }
        
        await loadDataForUser(currentUserId);
      } else {
        setUserId(null);
        setSheds([]);
        setFlocks([]);
        setRecords([]);
        setInventory([]);
        setExpenses([]);
        setSales([]);
        setClients([]);
        setTasks([]);
        setFeedFormulations([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadDataForUser, ensureUserInContacts]);

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

  // Helper function to manage egg stock automatically (Used for Sales)
  const adjustEggStock = (amount: number) => {
       if (!userId) return;

       (async () => {
         try {
           // Buscar item atual de ovos no Supabase
           const { data: eggItems, error: fetchError } = await supabase
             .from('inventory')
             .select('*')
             .eq('user_id', userId)
             .eq('category', 'Produto Final')
             .ilike('name', '%ovos%');

           if (fetchError) {
             console.error('[FarmContext] Erro ao buscar ovos no estoque:', fetchError);
             return;
           }

           const eggItem = eggItems && eggItems.length > 0 ? eggItems[0] : null;
           
           if (eggItem) {
             // Atualizar item existente
             const newQuantity = Math.max(0, parseFloat(eggItem.quantity) + amount);
             const { error: updateError } = await supabase
               .from('inventory')
               .update({ quantity: newQuantity })
               .eq('id', eggItem.id);

             if (updateError) {
               console.error('[FarmContext] Erro ao atualizar ovos no estoque:', updateError);
               return;
             }

             // Atualizar estado local
             setInventory(prev => prev.map(i => 
               i.id === eggItem.id 
               ? { ...i, quantity: newQuantity, lastUpdated: new Date().toISOString() } 
               : i
             ));
           } else if (amount > 0) {
             // Criar novo item de ovos se não existe
             const { data: newItem, error: insertError } = await supabase
               .from('inventory')
               .insert({
                 user_id: userId,
                 name: 'Ovos (Produção)',
                 category: 'Produto Final',
                 quantity: amount,
                 unit: 'unidade',
                 min_threshold: 100,
                 cost_per_unit: 0.50,
               })
               .select()
               .single();

             if (insertError || !newItem) {
               console.error('[FarmContext] Erro ao criar item de ovos no estoque:', insertError);
               return;
             }

             // Adicionar ao estado local
             const mappedItem: InventoryItem = {
               id: newItem.id,
               name: newItem.name,
               category: newItem.category,
               quantity: parseFloat(newItem.quantity),
               unit: newItem.unit,
               minThreshold: parseFloat(newItem.min_threshold),
               costPerUnit: parseFloat(newItem.cost_per_unit),
               lastUpdated: newItem.last_updated,
             };

             setInventory(prev => [...prev, mappedItem]);
           }
         } catch (err) {
           console.error('[FarmContext] Erro inesperado ao ajustar estoque de ovos:', err);
         }
       })();
  };

  const addShed = (shedData: Omit<Shed, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('sheds')
          .insert({
            user_id: userId,
            name: shedData.name,
            capacity: shedData.capacity,
            notes: shedData.notes ?? null,
          })
          .select()
          .single();

        if (error || !data) {
          console.error('[FarmContext] Erro ao adicionar shed no Supabase:', error);
          return;
        }

        const newShed: Shed = {
          id: data.id,
          name: data.name,
          capacity: data.capacity,
          notes: data.notes ?? undefined,
        };

        setSheds(prev => [...prev, newShed]);
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao adicionar shed:', err);
      }
    })();
  };

  const updateShed = (shedId: string, data: Omit<Shed, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('sheds')
          .update({
            name: data.name,
            capacity: data.capacity,
            notes: data.notes ?? null,
          })
          .eq('id', shedId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao atualizar shed no Supabase:', error);
          return;
        }

        setSheds(prev => prev.map(shed =>
          shed.id === shedId ? { id: shedId, ...data } : shed
        ));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao atualizar shed:', err);
      }
    })();
  };
  
  const addFlock = (flockData: Omit<Flock, 'id' | 'status'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('flocks')
          .insert({
            user_id: userId,
            shed_id: flockData.shedId,
            name: flockData.name,
            breed: flockData.breed,
            birth_date: flockData.birthDate,
            arrival_date: flockData.arrivalDate,
            planned_disposal_date: flockData.plannedDisposalDate,
            initial_hen_count: flockData.initialHenCount,
            status: 'Ativo',
          })
          .select()
          .single();

        if (error || !data) {
          console.error('[FarmContext] Erro ao adicionar flock no Supabase:', error);
          return;
        }

        const newFlock: Flock = {
          id: data.id,
          shedId: data.shed_id,
          name: data.name,
          breed: data.breed,
          birthDate: data.birth_date,
          arrivalDate: data.arrival_date,
          plannedDisposalDate: data.planned_disposal_date,
          initialHenCount: data.initial_hen_count,
          status: data.status,
        };

        setFlocks(prev => [...prev, newFlock]);
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao adicionar flock:', err);
      }
    })();
  };

  const updateFlock = (flockId: string, data: Omit<Flock, 'id' | 'status'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('flocks')
          .update({
            shed_id: data.shedId,
            name: data.name,
            breed: data.breed,
            birth_date: data.birthDate,
            arrival_date: data.arrivalDate,
            planned_disposal_date: data.plannedDisposalDate,
            initial_hen_count: data.initialHenCount,
          })
          .eq('id', flockId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao atualizar flock no Supabase:', error);
          return;
        }

        setFlocks(prev => prev.map(flock => 
          flock.id === flockId ? { ...flock, ...data } : flock
        ));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao atualizar flock:', err);
      }
    })();
  };

  const disposeFlock = (flockId: string) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('flocks')
          .update({ status: 'Descartado' })
          .eq('id', flockId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao descartar flock no Supabase:', error);
          return;
        }

        setFlocks(prev => prev.map(flock => 
          flock.id === flockId ? { ...flock, status: 'Descartado' } : flock
        ));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao descartar flock:', err);
      }
    })();
  };

  const addRecord = (recordData: Omit<DailyRecord, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('daily_records')
          .insert({
            user_id: userId,
            flock_id: recordData.flockId,
            date: recordData.date,
            eggs_collected: recordData.eggsCollected,
            broken_eggs: recordData.brokenEggs ?? 0,
            feed_consumed_kg: recordData.feedConsumedKg,
            water_consumed_liters: recordData.waterConsumedLiters,
            mortality: recordData.mortality,
            notes: recordData.notes ?? null,
          })
          .select()
          .single();

        if (error || !data) {
          console.error('[FarmContext] Erro ao adicionar registro diário no Supabase:', error);
          return;
        }

        const newRecord: DailyRecord = {
          id: data.id,
          flockId: data.flock_id,
          date: data.date,
          eggsCollected: data.eggs_collected,
          brokenEggs: data.broken_eggs,
          feedConsumedKg: parseFloat(data.feed_consumed_kg),
          waterConsumedLiters: parseFloat(data.water_consumed_liters),
          mortality: data.mortality,
          notes: data.notes ?? undefined,
        };

        setRecords(prev => [...prev, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

        // Lógica de estoque e custo médio usando Supabase
        (async () => {
          try {
            // Buscar ração e ovos atuais no estoque
            const { data: inventoryData, error: inventoryError } = await supabase
              .from('inventory')
              .select('*')
              .eq('user_id', userId);

            if (inventoryError) {
              console.error('[FarmContext] Erro ao buscar estoque:', inventoryError);
              return;
            }

            const feedItem = inventoryData?.find(i => i.category === 'Ração');
            const eggItem = inventoryData?.find(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
            const feedPrice = feedItem ? parseFloat(feedItem.cost_per_unit) : 0;
            const totalRecordCost = recordData.feedConsumedKg * feedPrice;

            // 1. Deduzir ração
            if (feedItem && recordData.feedConsumedKg > 0) {
              const newFeedQuantity = Math.max(0, parseFloat(feedItem.quantity) - recordData.feedConsumedKg);
              await supabase
                .from('inventory')
                .update({ quantity: newFeedQuantity })
                .eq('id', feedItem.id);

              setInventory(prev => prev.map(i => 
                i.id === feedItem.id 
                ? { ...i, quantity: newFeedQuantity, lastUpdated: new Date().toISOString() }
                : i
              ));
            }

            // 2. Adicionar ovos com cálculo de custo médio
            const netEggs = recordData.eggsCollected - (recordData.brokenEggs || 0);
            if (netEggs > 0) {
              if (eggItem) {
                // Atualizar ovos existentes com custo médio
                const currentQuantity = parseFloat(eggItem.quantity);
                const currentTotalValue = currentQuantity * parseFloat(eggItem.cost_per_unit);
                const newTotalValue = currentTotalValue + totalRecordCost;
                const newTotalQty = currentQuantity + netEggs;
                const newCostPerUnit = newTotalQty > 0 ? newTotalValue / newTotalQty : parseFloat(eggItem.cost_per_unit);

                await supabase
                  .from('inventory')
                  .update({ 
                    quantity: newTotalQty,
                    cost_per_unit: newCostPerUnit
                  })
                  .eq('id', eggItem.id);

                setInventory(prev => prev.map(i => 
                  i.id === eggItem.id 
                  ? { 
                      ...i, 
                      quantity: newTotalQty, 
                      costPerUnit: parseFloat(newCostPerUnit.toFixed(4)),
                      lastUpdated: new Date().toISOString()
                    }
                  : i
                ));
              } else {
                // Criar novo item de ovos
                const unitCost = totalRecordCost / netEggs;
                const { data: newEggItem, error: insertError } = await supabase
                  .from('inventory')
                  .insert({
                    user_id: userId,
                    name: 'Ovos (Produção)',
                    category: 'Produto Final',
                    quantity: netEggs,
                    unit: 'unidade',
                    min_threshold: 100,
                    cost_per_unit: unitCost,
                  })
                  .select()
                  .single();

                if (!insertError && newEggItem) {
                  const mappedItem: InventoryItem = {
                    id: newEggItem.id,
                    name: newEggItem.name,
                    category: newEggItem.category,
                    quantity: parseFloat(newEggItem.quantity),
                    unit: newEggItem.unit,
                    minThreshold: parseFloat(newEggItem.min_threshold),
                    costPerUnit: parseFloat(newEggItem.cost_per_unit),
                    lastUpdated: newEggItem.last_updated,
                  };

                  setInventory(prev => [...prev, mappedItem]);
                }
              }
            }
          } catch (err) {
            console.error('[FarmContext] Erro ao atualizar estoque:', err);
          }
        })();
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao adicionar registro diário:', err);
      }
    })();
  };
  
  const updateRecord = (recordId: string, data: Omit<DailyRecord, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('daily_records')
          .update({
            flock_id: data.flockId,
            date: data.date,
            eggs_collected: data.eggsCollected,
            broken_eggs: data.brokenEggs ?? 0,
            feed_consumed_kg: data.feedConsumedKg,
            water_consumed_liters: data.waterConsumedLiters,
            mortality: data.mortality,
            notes: data.notes ?? null,
          })
          .eq('id', recordId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao atualizar registro diário no Supabase:', error);
          return;
        }

        // Atualizar estado local e estoque (mantido do código original)
        setRecords(prev => {
          const oldRecord = prev.find(r => r.id === recordId);
          
          if (oldRecord) {
            // Aplicar Atualização Diferencial no Estoque com Recálculo de Custo
            setInventory(invPrev => {
              let newInventory = [...invPrev];
              const feedItem = newInventory.find(i => i.category === 'Ração');
              const feedPrice = feedItem ? feedItem.costPerUnit : 0;
              
              // Valores Diferenciais
              const feedDiff = data.feedConsumedKg - oldRecord.feedConsumedKg;
              const oldNetEggs = oldRecord.eggsCollected - (oldRecord.brokenEggs || 0);
              const newNetEggs = data.eggsCollected - (data.brokenEggs || 0);
              const eggDiff = newNetEggs - oldNetEggs;
              
              // Diferença de Custo
              const costDiff = feedDiff * feedPrice;

              // 1. Atualizar Estoque de Ração
              if (feedItem && feedDiff !== 0) {
                newInventory = newInventory.map(item => 
                  item.id === feedItem.id 
                  ? { ...item, quantity: Math.max(0, item.quantity - feedDiff), lastUpdated: new Date().toISOString() }
                  : item
                );
              }

              // 2. Atualizar Estoque de Ovos e Preço
              if (eggDiff !== 0 || costDiff !== 0) {
                const eggItemIndex = newInventory.findIndex(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
                if (eggItemIndex >= 0) {
                  const currentItem = newInventory[eggItemIndex];
                  const currentTotalValue = currentItem.quantity * currentItem.costPerUnit;
                  
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
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao atualizar registro diário:', err);
      }
    })();
  };

  const deleteRecord = (recordId: string) => {
    if (!userId) return;

    (async () => {
      try {
        // Primeiro, restaurar estoque antes de deletar (mantido do código original)
        const recordToDelete = records.find(r => r.id === recordId);
        
        if (recordToDelete) {
          setInventory(invPrev => {
            let newInventory = [...invPrev];
            const feedItem = newInventory.find(i => i.category === 'Ração');
            const feedPrice = feedItem ? feedItem.costPerUnit : 0;
            
            const recordValue = recordToDelete.feedConsumedKg * feedPrice;

            // 1. Restaurar Ração
            if (feedItem && recordToDelete.feedConsumedKg > 0) {
              newInventory = newInventory.map(item => 
                item.id === feedItem.id 
                ? { ...item, quantity: item.quantity + recordToDelete.feedConsumedKg, lastUpdated: new Date().toISOString() }
                : item
              );
            }

            // 2. Remover Ovos e Ajustar Custo
            const netEggs = recordToDelete.eggsCollected - (recordToDelete.brokenEggs || 0);
            if (netEggs > 0) {
              const eggItemIndex = newInventory.findIndex(i => i.category === 'Produto Final' && i.name.toLowerCase().includes('ovos'));
              if (eggItemIndex >= 0) {
                const currentItem = newInventory[eggItemIndex];
                const currentTotalValue = currentItem.quantity * currentItem.costPerUnit;
                
                const newTotalValue = Math.max(0, currentTotalValue - recordValue);
                const newTotalQty = Math.max(0, currentItem.quantity - netEggs);
                
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

        // Deletar do Supabase
        const { error } = await supabase
          .from('daily_records')
          .delete()
          .eq('id', recordId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao deletar registro diário no Supabase:', error);
          return;
        }

        // Remover do estado local
        setRecords(prev => prev.filter(rec => rec.id !== recordId));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao deletar registro diário:', err);
      }
    })();
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .insert({
            user_id: userId,
            flock_id: expenseData.flockId,
            date: expenseData.date,
            description: expenseData.description,
            category: expenseData.category,
            amount: expenseData.amount,
          })
          .select()
          .single();

        if (error || !data) {
          console.error('[FarmContext] Erro ao adicionar despesa no Supabase:', error);
          return;
        }

        const newExpense: Expense = {
          id: data.id,
          flockId: data.flock_id,
          date: data.date,
          description: data.description,
          category: data.category,
          amount: parseFloat(data.amount),
        };

        setExpenses(prev => [...prev, newExpense].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao adicionar despesa:', err);
      }
    })();
  }

  const updateExpense = (expenseId: string, data: Omit<Expense, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('expenses')
          .update({
            flock_id: data.flockId,
            date: data.date,
            description: data.description,
            category: data.category,
            amount: data.amount,
          })
          .eq('id', expenseId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao atualizar despesa no Supabase:', error);
          return;
        }

        setExpenses(prev => prev.map(exp => exp.id === expenseId ? { id: expenseId, ...data } : exp));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao atualizar despesa:', err);
      }
    })();
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'totalAmount'>) => {
    if (!userId) return;

    (async () => {
      try {
        const totalAmount = saleData.quantity * saleData.pricePerUnit;
        
        const { data, error } = await supabase
          .from('sales')
          .insert({
            user_id: userId,
            flock_id: saleData.flockId,
            client_id: saleData.clientId ?? null,
            date: saleData.date,
            product_type: saleData.productType || 'Ovos',
            sale_type: saleData.saleType,
            payment_method: saleData.paymentMethod,
            payment_status: saleData.paymentStatus,
            quantity: saleData.quantity,
            price_per_unit: saleData.pricePerUnit,
            total_amount: totalAmount,
            delivery_date: saleData.deliveryDate ?? null,
            delivery_status: saleData.deliveryStatus ?? null,
            delivery_address: saleData.deliveryAddress ?? null,
            delivery_notes: saleData.deliveryNotes ?? null,
          })
          .select()
          .single();

        if (error || !data) {
          console.error('[FarmContext] Erro ao adicionar venda no Supabase:', error);
          return;
        }

        const newSale: Sale = {
          id: data.id,
          flockId: data.flock_id,
          clientId: data.client_id,
          date: data.date,
          productType: data.product_type,
          saleType: data.sale_type,
          paymentMethod: data.payment_method,
          paymentStatus: data.payment_status,
          quantity: parseFloat(data.quantity),
          pricePerUnit: parseFloat(data.price_per_unit),
          totalAmount: parseFloat(data.total_amount),
          deliveryDate: data.delivery_date,
          deliveryStatus: data.delivery_status,
          deliveryAddress: data.delivery_address,
          deliveryNotes: data.delivery_notes,
        };

        setSales(prev => [...prev, newSale].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        // Deduzir do estoque se for venda de ovos
        if (saleData.productType === 'Ovos' || !saleData.productType) {
          adjustEggStock(-saleData.quantity);
        }
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao adicionar venda:', err);
      }
    })();
  }

  const updateSale = (saleId: string, data: Omit<Sale, 'id' | 'totalAmount'>) => {
    if (!userId) return;

    (async () => {
      try {
        // Calcular diff para ajustar estoque
        const oldSale = sales.find(s => s.id === saleId);
        
        if (oldSale && (oldSale.productType === 'Ovos' || !oldSale.productType)) {
          // Reverter quantidade antiga (adicionar de volta)
          adjustEggStock(oldSale.quantity);
        }
        
        if (data.productType === 'Ovos' || !data.productType) {
          // Aplicar nova quantidade (deduzir)
          adjustEggStock(-data.quantity);
        }

        const totalAmount = data.quantity * data.pricePerUnit;
        
        const { error } = await supabase
          .from('sales')
          .update({
            flock_id: data.flockId,
            client_id: data.clientId ?? null,
            date: data.date,
            product_type: data.productType || 'Ovos',
            sale_type: data.saleType,
            payment_method: data.paymentMethod,
            payment_status: data.paymentStatus,
            quantity: data.quantity,
            price_per_unit: data.pricePerUnit,
            total_amount: totalAmount,
            delivery_date: data.deliveryDate ?? null,
            delivery_status: data.deliveryStatus ?? null,
            delivery_address: data.deliveryAddress ?? null,
            delivery_notes: data.deliveryNotes ?? null,
          })
          .eq('id', saleId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao atualizar venda no Supabase:', error);
          return;
        }

        setSales(prev => prev.map(sale => sale.id === saleId ? { id: saleId, ...data, totalAmount } : sale));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao atualizar venda:', err);
      }
    })();
  };
  
  const addTask = (taskData: Omit<FlockTask, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            flock_id: taskData.flockId,
            task_type: taskData.taskType,
            due_date: taskData.dueDate,
            notes: taskData.notes,
            is_completed: taskData.isCompleted ?? false,
          })
          .select()
          .single();

        if (error || !data) {
          console.error('[FarmContext] Erro ao adicionar tarefa no Supabase:', error);
          return;
        }

        const newTask: FlockTask = {
          id: data.id,
          flockId: data.flock_id,
          taskType: data.task_type,
          dueDate: data.due_date,
          notes: data.notes,
          isCompleted: data.is_completed,
        };

        setTasks(prev => [...prev, newTask].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao adicionar tarefa:', err);
      }
    })();
  };
  
  const toggleTaskCompletion = (taskId: string) => {
    if (!userId) return;

    (async () => {
      try {
        // Buscar estado atual da tarefa
        const currentTask = tasks.find(t => t.id === taskId);
        if (!currentTask) return;

        const newCompletedStatus = !currentTask.isCompleted;

        const { error } = await supabase
          .from('tasks')
          .update({ is_completed: newCompletedStatus })
          .eq('id', taskId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao atualizar tarefa no Supabase:', error);
          return;
        }

        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, isCompleted: newCompletedStatus } : task
        ));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao atualizar tarefa:', err);
      }
    })();
  };
  
  const deleteTask = (taskId: string) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao deletar tarefa no Supabase:', error);
          return;
        }

        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao deletar tarefa:', err);
      }
    })();
  };

  const addClient = (clientData: Omit<Client, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            user_id: userId,
            name: clientData.name,
            phone: clientData.phone,
            email: clientData.email,
            address: clientData.address,
            type: clientData.type,
            notes: clientData.notes,
          })
          .select()
          .single();

        if (error || !data) {
          console.error('[FarmContext] Erro ao adicionar cliente no Supabase:', error);
          return;
        }

        const newClient: Client = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          type: data.type,
          notes: data.notes,
        };

        setClients(prev => [...prev, newClient]);
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao adicionar cliente:', err);
      }
    })();
  }

  const updateClient = (clientId: string, data: Omit<Client, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('clients')
          .update({
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            type: data.type,
            notes: data.notes,
          })
          .eq('id', clientId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao atualizar cliente no Supabase:', error);
          return;
        }

        setClients(prev => prev.map(client => client.id === clientId ? { id: clientId, ...data } : client));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao atualizar cliente:', err);
      }
    })();
  }

  const deleteClient = (clientId: string) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao deletar cliente no Supabase:', error);
          return;
        }

        setClients(prev => prev.filter(client => client.id !== clientId));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao deletar cliente:', err);
      }
    })();
  }

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    if (!userId) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .insert({
            user_id: userId,
            name: itemData.name,
            category: itemData.category,
            quantity: itemData.quantity,
            unit: itemData.unit,
            min_threshold: itemData.minThreshold,
            cost_per_unit: itemData.costPerUnit,
          })
          .select()
          .single();

        if (error || !data) {
          console.error('[FarmContext] Erro ao adicionar item no estoque no Supabase:', error);
          return;
        }

        const newItem: InventoryItem = {
          id: data.id,
          name: data.name,
          category: data.category,
          quantity: parseFloat(data.quantity),
          unit: data.unit,
          minThreshold: parseFloat(data.min_threshold),
          costPerUnit: parseFloat(data.cost_per_unit),
          lastUpdated: data.last_updated,
        };

        setInventory(prev => [...prev, newItem]);
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao adicionar item no estoque:', err);
      }
    })();
  };

  const updateInventoryItem = (id: string, data: Partial<Omit<InventoryItem, 'id'>>) => {
    if (!userId) return;

    (async () => {
      try {
        const updateData: any = {
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          min_threshold: data.minThreshold,
          cost_per_unit: data.costPerUnit,
        };

        // Remover valores undefined
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) delete updateData[key];
        });

        const { error } = await supabase
          .from('inventory')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao atualizar item no estoque no Supabase:', error);
          return;
        }

        setInventory(prev => prev.map(item => 
          item.id === id 
          ? { ...item, ...data, lastUpdated: new Date().toISOString() } 
          : item
        ));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao atualizar item no estoque:', err);
      }
    })();
  };

  const deleteInventoryItem = (id: string) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao deletar item no estoque no Supabase:', error);
          return;
        }

        setInventory(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao deletar item no estoque:', err);
      }
    })();
  };

  const addFeedFormulation = (formulation: Omit<FeedFormulation, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        // Armazenar dados da formulação no campo 'data' como JSON
        const formData = {
          phase: formulation.phase,
          ingredients: formulation.ingredients,
          totalWeight: formulation.totalWeight,
          totalCost: formulation.totalCost,
          costPerKg: formulation.costPerKg,
        };

        const { data, error } = await supabase
          .from('feed_formulations')
          .insert({
            user_id: userId,
            name: formulation.name,
            description: formulation.notes,
            data: formData,
          })
          .select()
          .single();

        if (error || !data) {
          console.error('[FarmContext] Erro ao adicionar formulação no Supabase:', error);
          return;
        }

        const newFormulation: FeedFormulation = {
          id: data.id,
          name: data.name,
          phase: data.data.phase || 'Outra',
          ingredients: data.data.ingredients || [],
          totalWeight: data.data.totalWeight || 0,
          totalCost: data.data.totalCost || 0,
          costPerKg: data.data.costPerKg || 0,
          notes: data.description,
        };

        setFeedFormulations(prev => [...prev, newFormulation]);
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao adicionar formulação:', err);
      }
    })();
  };

  const updateFeedFormulation = (id: string, data: Omit<FeedFormulation, 'id'>) => {
    if (!userId) return;

    (async () => {
      try {
        // Armazenar dados da formulação no campo 'data' como JSON
        const formData = {
          phase: data.phase,
          ingredients: data.ingredients,
          totalWeight: data.totalWeight,
          totalCost: data.totalCost,
          costPerKg: data.costPerKg,
        };

        const { error } = await supabase
          .from('feed_formulations')
          .update({
            name: data.name,
            description: data.notes,
            data: formData,
          })
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao atualizar formulação no Supabase:', error);
          return;
        }

        setFeedFormulations(prev => prev.map(f => f.id === id ? { id, ...data } : f));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao atualizar formulação:', err);
      }
    })();
  };

  const deleteFeedFormulation = (id: string) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('feed_formulations')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao deletar formulação no Supabase:', error);
          return;
        }

        setFeedFormulations(prev => prev.filter(f => f.id !== id));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao deletar formulação:', err);
      }
    })();
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
