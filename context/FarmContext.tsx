
import { createContext, useState, useEffect, useContext, ReactNode, useCallback, FC, useRef } from 'react';
import { Flock, DailyRecord, Expense, Sale, FlockTask, Shed, Client, InventoryItem, FeedFormulation, View, EggMovement, EggMovementType, EggMovementReason, CompanySettings } from '../types';
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
  eggMovements: EggMovement[];
  
  // Navigation State
  currentView: View;
  viewParams: Record<string, any>;
  navigate: (view: View, params?: Record<string, any>) => void;

  addShed: (shed: Omit<Shed, 'id'>) => void;
  updateShed: (shedId: string, data: Omit<Shed, 'id'>) => void;
  deleteShed: (shedId: string) => void;
  addFlock: (flock: Omit<Flock, 'id' | 'status'>) => void;
  updateFlock: (flockId: string, data: Omit<Flock, 'id' | 'status'>) => void;
  disposeFlock: (flockId: string) => void;
  deleteFlock: (flockId: string) => void;
  addRecord: (record: Omit<DailyRecord, 'id'>) => void;
  updateRecord: (recordId: string, data: Omit<DailyRecord, 'id'>) => void;
  deleteRecord: (recordId: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expenseId: string, data: Omit<Expense, 'id'>) => void;
  addSale: (sale: Omit<Sale, 'id' | 'totalAmount' | 'saleNumber'>) => void;
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
  addEggMovement: (movement: Omit<EggMovement, 'id' | 'balance'>) => void;
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
  
  // Company Settings functions
  companySettings: CompanySettings | null;
  saveCompanySettings: (settings: CompanySettings) => Promise<void>;
  loadCompanySettings: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const FARM_CONTEXT_VERSION = "v1.0.24 - No getSession() Call Inside Loader";

export const FarmProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Log de versão para debug
  useEffect(() => {
    console.log(`[FarmContext] 🆕 Versão carregada: ${FARM_CONTEXT_VERSION}`);
  }, []);

  // Navigation State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewParams, setViewParams] = useState<Record<string, any>>({});

  // Usuário atual (para filtrar dados no Supabase)
  const [userId, setUserId] = useState<string | null>(null);
  
  // Ref para controlar race conditions de carregamento de usuário
  const activeUserIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const accessTokenRef = useRef<string | null>(null); // Token para fetch direto

  const [sheds, setSheds] = useState<Shed[]>([]);

  const [flocks, setFlocks] = useState<Flock[]>([]);

  const [clients, setClients] = useState<Client[]>([]);

  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  const [records, setRecords] = useState<DailyRecord[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [sales, setSales] = useState<Sale[]>([]);

  const [tasks, setTasks] = useState<FlockTask[]>([]);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [feedFormulations, setFeedFormulations] = useState<FeedFormulation[]>([]);

  const [eggMovements, setEggMovements] = useState<EggMovement[]>([]);

  // Rastrear mudanças no estado de sheds
  useEffect(() => {
    console.log('[FarmContext] 📊 Estado de sheds mudou:', sheds.length, 'registros');
    if (sheds.length === 0) {
      console.trace('[FarmContext] Stack trace: sheds foi zerado');
    }
  }, [sheds]);

  // Função auxiliar para carregar sheds, flocks, registros diários, estoque e despesas para um usuário específico
  const loadDataForUser = useCallback(async (currentUserId: string, accessToken?: string) => {
    // Se já estiver carregando o MESMO usuário, não faça nada
    if (isLoadingRef.current) {
       console.log('[FarmContext] Já existe um carregamento em andamento.');
       return; 
    }

    // Se o usuário mudou enquanto esperávamos para chamar esta função, abortar
    if (activeUserIdRef.current && activeUserIdRef.current !== currentUserId) {
      console.log(`[FarmContext] 🛑 Abortando loadDataForUser para ${currentUserId} (Atual: ${activeUserIdRef.current})`);
      return;
    }

    try {
      isLoadingRef.current = true;
      activeUserIdRef.current = currentUserId; // Definir imediatamente
      console.log('[FarmContext] 🚀 INICIANDO loadDataForUser para:', currentUserId);
      const startTime = Date.now();
      
      // CRÍTICO: Usar token passado via argumento ou do ref, EVITANDO chamar getSession() que trava
      if (accessToken) {
        accessTokenRef.current = accessToken;
        console.log('[FarmContext] 🔑 Token recebido via argumento');
      } else if (!accessTokenRef.current) {
         console.warn('[FarmContext] ⚠️ Nenhum token disponível (nem argumento, nem ref). Fetch direto falhará.');
      }
      
      // Carregar tudo em PARALELO
      console.log('[FarmContext] 🚀 Carregando tabelas (SDK + Fallback Fetch)...');
      
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      // Função híbrida: Tenta SDK -> Se demorar > 2s -> Tenta Fetch direto
      interface QueryResult {
        data: any;
        error: any;
      }

      const smartQuery = async (table: string, orderBy: string, ascending: boolean, mapper?: (data: any) => any): Promise<QueryResult> => {
        return new Promise((resolve) => {
          let resolved = false;
          
          // 1. Via SDK (Standard)
          const sdkPromise = supabase
            .from(table)
            .select('*')
            .eq('user_id', currentUserId)
            .order(orderBy, { ascending });
            
          // 2. Via Fetch Direto (Bypass)
          const fetchPromise = async (): Promise<QueryResult | null> => {
            if (!accessTokenRef.current) return null;
            try {
              const url = `${supabaseUrl}/rest/v1/${table}?user_id=eq.${currentUserId}&select=*&order=${orderBy}.${ascending ? 'asc' : 'desc'}`;
              const response = await fetch(url, {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${accessTokenRef.current}`,
                  'Content-Type': 'application/json'
                }
              });
              if (!response.ok) throw new Error(response.statusText);
              const data = await response.json();
              return { data, error: null };
            } catch (err) {
              return { data: null, error: err };
            }
          };

          // Iniciar SDK
          sdkPromise.then(result => {
            if (!resolved) {
              resolved = true;
              console.log(`[FarmContext] ✅ SDK venceu: ${table}`);
              resolve(result as any);
            }
          });

          // Se SDK não responder em 2s, tentar fetch
          setTimeout(async () => {
            if (!resolved) {
              console.log(`[FarmContext] ⚠️ SDK lento para ${table}, tentando Fetch direto...`);
              const fetchResult = await fetchPromise();
              if (fetchResult && !resolved) {
                resolved = true;
                console.log(`[FarmContext] 🚀 Fetch direto salvou: ${table}`);
                resolve(fetchResult);
              }
            }
          }, 2000); // 2s timeout para SDK
        });
      };
      
      console.log('[FarmContext] ⏳ Aguardando Promise.allSettled...');
      
      const results = await Promise.allSettled([
        smartQuery('sheds', 'created_at', true),
        smartQuery('flocks', 'created_at', true),
        smartQuery('daily_records', 'date', true),
        smartQuery('inventory', 'last_updated', false),
        smartQuery('expenses', 'date', false),
        smartQuery('sales', 'date', false),
        smartQuery('clients', 'created_at', true),
        smartQuery('tasks', 'due_date', true),
        smartQuery('feed_formulations', 'created_at', true)
      ]);
      
      console.log('[FarmContext] 🚨 CHECKPOINT: Promise.allSettled RETORNOU');
      console.log('[FarmContext] ✅ Promise.allSettled completou!');
      
      const [
        shedsResult,
        flocksResult,
        recordsResult,
        inventoryResult,
        expensesResult,
        salesResult,
        clientsResult,
        tasksResult,
        formulationsResult
      ] = results;

      // Verificação CRÍTICA: O usuário mudou durante a requisição? (Principal causa do problema)
      if (activeUserIdRef.current !== currentUserId) {
         console.log('[FarmContext] 🛑 Usuário mudou durante carregamento. Abortando para evitar sobrescrever dados.');
         return;
      }

      // Processar resultados e atualizar estado IMEDIATAMENTE
      console.log('[FarmContext] 📊 Processando resultados paralelos...');

      // Helper para extrair dados tipados
      const getData = (result: PromiseSettledResult<QueryResult>) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return { data: null, error: result.reason };
      };

      // Sheds
      const shedsData = getData(shedsResult);
      if (!shedsData.error && shedsData.data && activeUserIdRef.current === currentUserId) {
        console.log('[FarmContext] ✓ Sheds carregados:', shedsData.data.length, 'registros');
        const mappedSheds: Shed[] = shedsData.data.map((s: any) => ({
          id: s.id, name: s.name, capacity: s.capacity, notes: s.notes ?? undefined,
        }));
        setSheds(mappedSheds);
      } else if (shedsData.error) {
        console.error('[FarmContext] ✗ Erro ao carregar sheds:', shedsData.error);
      }

      // Flocks
      const flocksData = getData(flocksResult);
      if (!flocksData.error && flocksData.data && activeUserIdRef.current === currentUserId) {
        console.log('[FarmContext] ✓ Flocks carregados:', flocksData.data.length, 'registros');
        const mappedFlocks: Flock[] = flocksData.data.map((f: any) => ({
          id: f.id, shedId: f.shed_id, name: f.name, breed: f.breed, birthDate: f.birth_date,
          arrivalDate: f.arrival_date, plannedDisposalDate: f.planned_disposal_date,
          initialHenCount: f.initial_hen_count, status: f.status,
        }));
        setFlocks(mappedFlocks);
      }

      // Records
      const recordsData = getData(recordsResult);
      if (!recordsData.error && recordsData.data && activeUserIdRef.current === currentUserId) {
        console.log('[FarmContext] ✓ Registros diários carregados:', recordsData.data.length, 'registros');
        const mappedRecords: DailyRecord[] = recordsData.data.map((r: any) => ({
          id: r.id, flockId: r.flock_id, date: r.date, eggsCollected: r.eggs_collected,
          brokenEggs: r.broken_eggs, feedConsumedKg: parseFloat(r.feed_consumed_kg),
          mortality: r.mortality, notes: r.notes ?? undefined, createdAt: r.created_at ?? undefined,
        }));
        setRecords(mappedRecords);
      }

      // Inventory
      const inventoryData = getData(inventoryResult);
      if (!inventoryData.error && inventoryData.data && activeUserIdRef.current === currentUserId) {
        console.log('[FarmContext] ✓ Estoque carregado:', inventoryData.data.length, 'registros');
        const mappedInventory: InventoryItem[] = inventoryData.data.map((i: any) => ({
          id: i.id, name: i.name, category: i.category, quantity: parseFloat(i.quantity),
          unit: i.unit, minThreshold: parseFloat(i.min_threshold), costPerUnit: parseFloat(i.cost_per_unit),
          lastUpdated: i.last_updated,
        }));
        setInventory(mappedInventory);
      }

      // Expenses
      const expensesData = getData(expensesResult);
      if (!expensesData.error && expensesData.data && activeUserIdRef.current === currentUserId) {
        console.log('[FarmContext] ✓ Despesas carregadas:', expensesData.data.length, 'registros');
        const mappedExpenses: Expense[] = expensesData.data.map((e: any) => ({
          id: e.id, flockId: e.flock_id, date: e.date, description: e.description,
          category: e.category, amount: parseFloat(e.amount),
        }));
        setExpenses(mappedExpenses);
      }

      // Sales
      const salesData = getData(salesResult);
      if (!salesData.error && salesData.data && activeUserIdRef.current === currentUserId) {
        console.log('[FarmContext] ✓ Vendas carregadas:', salesData.data.length, 'registros');
        const mappedSales: Sale[] = salesData.data.map((s: any, index: number) => ({
          id: s.id, saleNumber: s.sale_number || index + 1, flockId: s.flock_id, clientId: s.client_id,
          date: s.date, productType: s.product_type, saleType: s.sale_type,
          paymentMethod: s.payment_method, paymentStatus: s.payment_status,
          quantity: parseFloat(s.quantity), pricePerUnit: parseFloat(s.price_per_unit),
          totalAmount: parseFloat(s.total_amount), deliveryDate: s.delivery_date,
          deliveryStatus: s.delivery_status, deliveryAddress: s.delivery_address,
          deliveryNotes: s.delivery_notes,
        }));
        setSales(mappedSales);
      }

      // Clients
      const clientsData = getData(clientsResult);
      if (!clientsData.error && clientsData.data && activeUserIdRef.current === currentUserId) {
        console.log('[FarmContext] ✓ Clientes carregados:', clientsData.data.length, 'registros');
        const mappedClients: Client[] = clientsData.data.map((c: any) => ({
          id: c.id, name: c.name, phone: c.phone, email: c.email,
          address: c.address, type: c.type, notes: c.notes,
        }));
        setClients(mappedClients);
      }

      // Tasks
      const tasksData = getData(tasksResult);
      if (!tasksData.error && tasksData.data && activeUserIdRef.current === currentUserId) {
        console.log('[FarmContext] ✓ Tarefas carregadas:', tasksData.data.length, 'registros');
        const mappedTasks: FlockTask[] = tasksData.data.map((t: any) => ({
          id: t.id, flockId: t.flock_id, taskType: t.task_type, dueDate: t.due_date,
          notes: t.notes, isCompleted: t.is_completed,
        }));
        setTasks(mappedTasks);
      }

      // Formulations
      const formulationsData = getData(formulationsResult);
      if (!formulationsData.error && formulationsData.data && activeUserIdRef.current === currentUserId) {
        console.log('[FarmContext] ✓ Formulações carregadas:', formulationsData.data.length, 'registros');
        const mappedFormulations: FeedFormulation[] = formulationsData.data.map((f: any) => {
          const formData = f.data || {};
          return {
            id: f.id, name: f.name, phase: formData.phase || 'Outra',
            ingredients: formData.ingredients || [], totalWeight: formData.totalWeight || 0,
            totalCost: formData.totalCost || 0, costPerKg: formData.costPerKg || 0,
            notes: f.description,
          };
        });
        setFeedFormulations(mappedFormulations);
      }
      const endTime = Date.now();
      console.log('[FarmContext] ✅ CONCLUÍDO loadDataForUser em', endTime - startTime, 'ms');
    } catch (error) {
      console.error('[FarmContext] ❌ ERRO em loadDataForUser:', error);
    } finally {
      isLoadingRef.current = false;
      console.log('[FarmContext] ✅ Carregamento finalizado.');
    }
  }, []);

  // Garante que o usuário esteja na tabela user_contacts
  const ensureUserInContacts = useCallback(async (user: any) => {
    try {
      // Tentar diferentes abordagens para verificar se usuário existe
      let existingContact = null;
      
      // Abordagem 1: maybeSingle
      try {
        const { data: contact1, error: error1 } = await supabase
          .from('user_contacts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error1) {
          existingContact = contact1;
        }
      } catch (e) {
        console.error('Erro na verificação de contato:', e);
      }
      
      // Abordagem 2: limit(1) se maybeSingle falhar
      if (!existingContact) {
        try {
          const { data: contact2, error: error2 } = await supabase
            .from('user_contacts')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
          
          if (!error2 && contact2 && contact2.length > 0) {
            existingContact = contact2[0];
          }
        } catch (e) {
          console.error('Erro na verificação de contato (fallback):', e);
        }
      }

      if (!existingContact) {
        // Usuário não existe, vamos inserir usando os dados do session
        const metadata = user.user_metadata || {};
        
        const { error: insertError } = await supabase
          .from('user_contacts')
          .insert({
            user_id: user.id,
            email: user.email || '',
            name: metadata.name || '',
            phone: metadata.phone || '',
            farm_name: metadata.farmName || '',
            contact_type: 'user'
          });
          
        if (insertError) {
          console.error('Erro ao inserir usuário em user_contacts:', insertError);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/inserir usuário em user_contacts:', error);
    }
  }, []);

  // Carrega dados iniciais e reage a mudanças de autenticação do Supabase
  useEffect(() => {
    let isMounted = true;
    let hasLoadedData = false; // Flag para evitar carregamento duplicado
    
    console.log('[FarmContext] 🔧 useEffect de auth montado');
    
    // Removido init() - usar apenas onAuthStateChange para evitar race condition

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[FarmContext] 🔔 onAuthStateChange DISPARADO - event:', event, 'session:', !!session);
      
      if (!isMounted) return;
      
      console.log('[FarmContext] 🔔 Auth state changed:', event, 'Session:', !!session, 'User:', session?.user?.id);
      
      if (session) {
        const currentUserId = session.user.id;
        
        // Se o usuário mudou, atualizamos o ref imediatamente
        if (activeUserIdRef.current !== currentUserId) {
            console.log(`[FarmContext] 🔄 Mudança de usuário detectada: ${activeUserIdRef.current} -> ${currentUserId}`);
            activeUserIdRef.current = currentUserId;
            hasLoadedData = false; // Reset para novo usuário
        }

        console.log('[FarmContext] 👤 Definindo userId:', currentUserId);
        setUserId(currentUserId);
        
        // Garantir que usuário este salvo em user_contacts (apenas no primeiro cadastro)
        if (event === 'SIGNED_IN') {
          console.log('[FarmContext] ✅ Evento SIGNED_IN detectado');
          
          // Executar em background para não bloquear o carregamento de dados
          ensureUserInContacts(session.user).catch(err => {
            console.error('[FarmContext] ❌ Erro em background ao garantir contacts:', err);
          });

          // Garantir que a URL esteja limpa e no dashboard após login
          try {
            const url = new URL(window.location.href);
            // Só alterar para dashboard se estivermos na raiz ou login, para não perder navegação
            if (url.searchParams.get('view') === 'login' || !url.searchParams.get('view')) {
               url.searchParams.set('view', 'dashboard');
               window.history.replaceState(null, '', url.toString());
            }
          } catch (e) {
            console.error('[FarmContext] Erro ao manipular URL:', e);
          }
        }
        
        // Carregar dados apenas UMA VEZ por sessão de usuário
        if (!hasLoadedData && !isLoadingRef.current) {
          console.log('[FarmContext] 📥 Carregando dados para evento:', event);
          hasLoadedData = true;
          try {
            // Passar token explicitamente para evitar getSession()
            await loadDataForUser(currentUserId, session.access_token);
            console.log('[FarmContext] ✅ Dados carregados com sucesso');
          } catch (error) {
            console.error('[FarmContext] ❌ Erro ao chamar loadDataForUser:', error);
            hasLoadedData = false; // Permitir retry em caso de erro
          }
        } else {
          console.log('[FarmContext] ⏭️ Pulando carregamento duplicado (hasLoadedData:', hasLoadedData, 'isLoading:', isLoadingRef.current, ')');
        }
      } else {
        // Usuário fez logout - limpar todos os dados
        console.log('[FarmContext] 🚪 Limpando dados após logout');
        console.trace('[FarmContext] Stack trace do logout');
        activeUserIdRef.current = null;
        hasLoadedData = false;
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
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);


  // Sincronizar navegação com mudanças na URL
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view');
      const params: Record<string, any> = {};
      
      // Converter parâmetros URL para objeto (exceto 'view')
      urlParams.forEach((value, key) => {
        if (key !== 'view') {
          params[key] = value;
        }
      });
      
      // Lista de views válidas
      const validViews: View[] = ['dashboard', 'data-entry', 'flocks', 'sheds', 'expenses', 'sales', 'reports', 'ai-assistant', 'calculator', 'clients', 'contacts', 'inventory'];
      
      // Navegar para a view correspondente
      if (view && validViews.includes(view as View)) {
        setCurrentView(view as View);
        setViewParams(params);
      } else {
        // Se não houver view válida, voltar para dashboard
        setCurrentView('dashboard');
        setViewParams({});
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'dashboard');
        window.history.replaceState(null, '', url.toString());
      }
    };

    // Configurar estado inicial baseado na URL atual
    handlePopState();
    
    // Adicionar listener para navegação do browser
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  
    
  
  
  const navigate = (view: View, params: Record<string, any> = {}) => {
      setCurrentView(view);
      setViewParams(params);
      
      // Usar query parameters em vez de hash para melhor compatibilidade
      const url = new URL(window.location.href);
      
      // Limpar parâmetros anteriores
      url.searchParams.delete('view');
      
      // Adicionar view como parâmetro
      url.searchParams.set('view', view);
      
      // Adicionar outros parâmetros
      Object.keys(params).forEach(key => {
        if (params[key]) {
          url.searchParams.set(key, params[key]);
        }
      });
      
      // Remover hash se existir
      url.hash = '';
      
      window.history.pushState(null, '', url.toString());
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
  };

  // Helper function to manage egg stock automatically (Used for Sales)
  const adjustEggStock = (amount: number) => {
       if (!userId) return;
       
       console.log('🔍 adjustEggStock chamado:', { amount, userId });

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
           console.log('🥚 Item de ovos encontrado:', eggItem);
           
           if (eggItem) {
             // Atualizar item existente
             const currentQty = parseFloat(eggItem.quantity);
             const newQuantity = Math.max(0, currentQty + amount);
             console.log('📊 Atualizando estoque:', { currentQty, amount, newQuantity });
             
             const { error: updateError } = await supabase
               .from('inventory')
               .update({ 
                 quantity: newQuantity,
                 last_updated: new Date().toISOString()
               })
               .eq('id', eggItem.id);

             if (updateError) {
               console.error('[FarmContext] Erro ao atualizar ovos no estoque:', updateError);
               return;
             }

             console.log('✅ Estoque atualizado no Supabase');

             // Atualizar estado local
             setInventory(prev => {
               const updated = prev.map(i => 
                 i.id === eggItem.id 
                 ? { ...i, quantity: newQuantity, lastUpdated: new Date().toISOString() } 
                 : i
               );
               console.log('✅ Estado local atualizado');
               return updated;
             });
           } else if (amount > 0) {
             console.log('⚠️ Item de ovos não existe, criando novo');
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
             console.log('✅ Novo item de ovos criado');
           } else {
             console.log('⚠️ Item de ovos não existe e amount <= 0, nada a fazer');
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

  const deleteShed = (shedId: string) => {
    if (!userId) return;

    (async () => {
      try {
        const { error } = await supabase
          .from('sheds')
          .delete()
          .eq('id', shedId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao excluir shed no Supabase:', error);
          return;
        }

        setSheds(prev => prev.filter(shed => shed.id !== shedId));
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao excluir shed:', err);
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
        
        // Recarregar dados para garantir consistência
        await loadDataForUser(userId);
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao descartar flock:', err);
      }
    })();
  };

  const deleteFlock = async (flockId: string) => {
    // Deletar registros primeiro (dependências)
    const { error: recordsError } = await supabase
      .from('production_records')
      .delete()
      .eq('flock_id', flockId);

    if (recordsError) {
      console.error('Erro ao deletar registros do lote:', recordsError);
      return;
    }

    // Deletar despesas relacionadas
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .eq('flock_id', flockId)
      .eq('user_id', userId);

    if (expensesError) {
      console.error('Erro ao deletar despesas do lote:', expensesError);
      return;
    }

    // Deletar vendas relacionadas
    const { error: salesError } = await supabase
      .from('sales')
      .delete()
      .eq('flock_id', flockId)
      .eq('user_id', userId);

    if (salesError) {
      console.error('Erro ao deletar vendas do lote:', salesError);
      return;
    }

    // Deletar o lote
    const { error: flockError } = await supabase
      .from('flocks')
      .delete()
      .eq('id', flockId);

    if (flockError) {
      console.error('Erro ao deletar lote:', flockError);
      return;
    }

    // Recarregar dados
    if (userId) {
      await loadDataForUser(userId);
    }
  };

  // Funções de relatórios
  const generateWeeklyReport = () => {
    if (!userId) return;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('daily_records')
          .select('*')
          .eq('user_id', userId);

        if (error || !data) {
          console.error('[FarmContext] Erro ao buscar registros diários no Supabase:', error);
          return;
        }

        const records = data.map(record => ({
          id: record.id,
          flockId: record.flock_id,
          date: record.date,
          eggsCollected: record.eggs_collected,
          brokenEggs: record.broken_eggs,
          feedConsumedKg: record.feed_consumed_kg,
          mortality: record.mortality,
          notes: record.notes,
        }));

        // Lógica de geração de relatório semanal
        interface WeeklyReport {
          [key: string]: {
            totalEggs: number;
            totalFeed: number;
            totalMortality: number;
          };
        }

        const weeklyReport: WeeklyReport = records.reduce((acc: WeeklyReport, record) => {
          const weekNumber = Math.ceil((new Date(record.date).getTime() - new Date(record.date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (!acc[weekNumber]) {
            acc[weekNumber] = {
              totalEggs: 0,
              totalFeed: 0,
              totalMortality: 0,
            };
          }
          acc[weekNumber].totalEggs += record.eggsCollected;
          acc[weekNumber].totalFeed += record.feedConsumedKg;
          acc[weekNumber].totalMortality += record.mortality;
          return acc;
        }, {} as WeeklyReport);
      } catch (err) {
        console.error('[FarmContext] Erro inesperado ao gerar relatório semanal:', err);
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
            water_consumed_liters: 0,
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
          mortality: data.mortality,
          notes: data.notes ?? undefined,
          createdAt: data.created_at ?? undefined,
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
            // Busca mais flexível para encontrar item de ovos
            const eggItem = inventoryData?.find(i => 
              i.category === 'Produto Final' && 
              (i.name.toLowerCase().includes('ovos') || i.name.toLowerCase().includes('ovo'))
            );
            const feedPrice = feedItem ? parseFloat(feedItem.cost_per_unit) : 0;
            const totalRecordCost = recordData.feedConsumedKg * feedPrice;
            
            console.log('[addRecord] Estoque encontrado:', { 
              feedItem: feedItem?.name, 
              eggItem: eggItem?.name,
              feedPrice,
              totalRecordCost,
              netEggs: recordData.eggsCollected - (recordData.brokenEggs || 0)
            });

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
            console.log('[addRecord] Processando ovos:', { netEggs, eggItemExists: !!eggItem });
            
            if (netEggs > 0) {
              if (eggItem) {
                console.log('[addRecord] Atualizando item existente:', eggItem.name);
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
                console.log('[addRecord] Criando novo item de ovos no estoque');
                const unitCost = netEggs > 0 ? totalRecordCost / netEggs : 0;
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

                if (insertError) {
                  console.error('[addRecord] Erro ao criar item de ovos:', insertError);
                }
                
                if (!insertError && newEggItem) {
                  console.log('[addRecord] Item de ovos criado com sucesso:', newEggItem);
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
            water_consumed_liters: 0,
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
        // Primeiro, buscar o registro que será deletado
        const recordToDelete = records.find(r => r.id === recordId);
        
        if (recordToDelete) {
          // Buscar itens de estoque no Supabase
          const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select('*')
            .eq('user_id', userId);

          if (inventoryError) {
            console.error('[FarmContext] Erro ao buscar estoque:', inventoryError);
            return;
          }

          const feedItem = inventoryData?.find((i: any) => i.category === 'Ração');
          const eggItem = inventoryData?.find((i: any) => 
            i.category === 'Produto Final' && 
            (i.name.toLowerCase().includes('ovos') || i.name.toLowerCase().includes('ovo'))
          );
          
          const feedPrice = feedItem ? parseFloat(feedItem.cost_per_unit) : 0;
          const recordValue = recordToDelete.feedConsumedKg * feedPrice;
          const netEggs = recordToDelete.eggsCollected - (recordToDelete.brokenEggs || 0);
          
          console.log('[deleteRecord] Revertendo estoque:', {
            recordId,
            feedItem: feedItem?.name,
            eggItem: eggItem?.name,
            netEggs,
            recordValue,
            feedToRestore: recordToDelete.feedConsumedKg
          });

          // 1. Restaurar Ração no Supabase
          if (feedItem && recordToDelete.feedConsumedKg > 0) {
            const newFeedQty = parseFloat(feedItem.quantity) + recordToDelete.feedConsumedKg;
            
            await supabase
              .from('inventory')
              .update({ 
                quantity: newFeedQty,
                last_updated: new Date().toISOString()
              })
              .eq('id', feedItem.id);
          }

          // 2. Remover Ovos do Estoque no Supabase
          if (eggItem && netEggs > 0) {
            const currentQty = parseFloat(eggItem.quantity);
            const currentCost = parseFloat(eggItem.cost_per_unit);
            const currentTotalValue = currentQty * currentCost;
            
            const newTotalValue = Math.max(0, currentTotalValue - recordValue);
            const newTotalQty = Math.max(0, currentQty - netEggs);
            const newCostPerUnit = newTotalQty > 0 ? newTotalValue / newTotalQty : currentCost;

            await supabase
              .from('inventory')
              .update({ 
                quantity: newTotalQty,
                cost_per_unit: parseFloat(newCostPerUnit.toFixed(4)),
                last_updated: new Date().toISOString()
              })
              .eq('id', eggItem.id);
          }

          // 3. Atualizar estado local
          setInventory(invPrev => {
            let newInventory = [...invPrev];
            
            // Restaurar ração
            if (feedItem && recordToDelete.feedConsumedKg > 0) {
              newInventory = newInventory.map(item => 
                item.id === feedItem.id 
                ? { 
                    ...item, 
                    quantity: item.quantity + recordToDelete.feedConsumedKg, 
                    lastUpdated: new Date().toISOString() 
                  }
                : item
              );
            }

            // Remover ovos
            if (netEggs > 0) {
              const eggItemIndex = newInventory.findIndex(i => 
                i.category === 'Produto Final' && 
                (i.name.toLowerCase().includes('ovos') || i.name.toLowerCase().includes('ovo'))
              );
              
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

        // 4. Deletar registro do Supabase
        const { error } = await supabase
          .from('daily_records')
          .delete()
          .eq('id', recordId)
          .eq('user_id', userId);

        if (error) {
          console.error('[FarmContext] Erro ao deletar registro diário no Supabase:', error);
          return;
        }

        // 5. Remover do estado local
        setRecords(prev => prev.filter(rec => rec.id !== recordId));
        console.log('[deleteRecord] Registro deletado e estoque revertido com sucesso!');
        
        console.log('✅ Registro deletado e estoque ajustado com sucesso');
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

  const addSale = (saleData: Omit<Sale, 'id' | 'totalAmount' | 'saleNumber'>) => {
    if (!userId) return;

    (async () => {
      try {
        const totalAmount = saleData.quantity * saleData.pricePerUnit;
        
        // Gerar número sequencial da venda
        const nextSaleNumber = sales.length > 0 
          ? Math.max(...sales.map(s => s.saleNumber || 0)) + 1 
          : 1;
        
        const { data, error } = await supabase
          .from('sales')
          .insert({
            user_id: userId,
            flock_id: saleData.flockId,
            client_id: saleData.clientId ?? null,
            date: saleData.date,
            sale_number: nextSaleNumber,
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
          saleNumber: data.sale_number || nextSaleNumber,
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

  // Função para adicionar movimentação de ovos
  const addEggMovement = (movementData: Omit<EggMovement, 'id' | 'balance'>) => {
    if (!userId) return;

    // Buscar saldo atual de ovos
    const eggItem = inventory.find(i => 
      i.category === 'Produto Final' && 
      (i.name.toLowerCase().includes('ovos') || i.name.toLowerCase().includes('ovo'))
    );
    
    const currentBalance = eggItem ? eggItem.quantity : 0;
    const quantityChange = movementData.type === 'entrada' ? movementData.quantity : -movementData.quantity;
    const newBalance = Math.max(0, currentBalance + quantityChange);

    // Criar nova movimentação
    const newMovement: EggMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...movementData,
      balance: newBalance
    };

    // Atualizar lista de movimentações
    setEggMovements(prev => {
      const updated = [...prev, newMovement];
      return updated;
    });

    // Atualizar estoque de ovos
    if (eggItem) {
      (async () => {
        try {
          await supabase
            .from('inventory')
            .update({
              quantity: newBalance,
              last_updated: new Date().toISOString()
            })
            .eq('id', eggItem.id);

          setInventory(prev => prev.map(item => 
            item.id === eggItem.id 
              ? { ...item, quantity: newBalance, lastUpdated: new Date().toISOString() }
              : item
          ));
        } catch (err) {
          console.error('[FarmContext] Erro ao atualizar estoque de ovos:', err);
        }
      })();
    }
  };

  // Company Settings functions
  const saveCompanySettings = useCallback(async (settings: CompanySettings) => {
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Save to Supabase only
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          user_id: userId,
          farm_name: settings.farmName,
          owner_name: settings.ownerName,
          document: settings.document,
          phone: settings.phone,
          email: settings.email,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          zip_code: settings.zipCode,
          logo: settings.logo,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving company settings to Supabase:', error);
        throw error;
      }

      setCompanySettings(settings);
    } catch (error) {
      console.error('Error saving company settings:', error);
      throw error;
    }
  }, [userId]);

  const loadCompanySettings = useCallback(async () => {
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Load from Supabase only
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading company settings from Supabase:', error);
      }

      if (data) {
        const settings: CompanySettings = {
          id: data.id,
          farmName: data.farm_name,
          ownerName: data.owner_name || '',
          document: data.document || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zip_code || '',
          logo: data.logo || ''
        };

        setCompanySettings(settings);
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  }, [userId]);

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
        sheds, flocks, records, expenses, sales, tasks, clients, inventory, feedFormulations, eggMovements,
        currentView, viewParams, navigate,
        addShed, updateShed, deleteShed, addFlock, updateFlock, disposeFlock, deleteFlock, 
        addRecord, updateRecord, deleteRecord, 
        addExpense, updateExpense, addSale, updateSale, 
        addTask, toggleTaskCompletion, deleteTask, 
        addClient, updateClient, deleteClient, 
        addInventoryItem, updateInventoryItem, deleteInventoryItem,
        addFeedFormulation, updateFeedFormulation, deleteFeedFormulation,
        addEggMovement,
        getShedById, getFlockById, getClientById, getAvailableSheds, 
        getRecordsByFlockId, getExpensesByFlockId, getSalesByFlockId, getTasksByFlockId, getHensCountOnDate,
        clearData,
        companySettings, saveCompanySettings, loadCompanySettings
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

