import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  raw_user_meta_data?: {
    email?: string;
    name?: string;
    farmName?: string;
    phone?: string;
  };
}

interface CompanySettings {
  user_id: string;
  owner_name: string;
  email: string;
  phone: string;
  farm_name: string;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_name: string;
  trial_start: string;
  trial_end: string;
  payment_due_date: string | null;
  last_payment_at: string | null;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UserData {
  user_id: string;
  email: string;
  phone: string;
  farm_name: string;
  created_at: string;
  updated_at: string;
  subscription: Subscription | null;
  daysInactive: number;
}

type FilterType = 'all' | 'active' | 'inactive' | 'paying';

const AdminPanel = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, paying: 0 });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filterType]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar TODOS os usuários da auth.users via função RPC
      const { data: userMetadata, error: metaError } = await supabase
        .rpc('get_all_users_metadata');

      if (metaError) throw metaError;

      // Buscar TODAS as assinaturas (trial e ativas)
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subError) throw subError;

      // Buscar configurações de empresas
      const { data: companies, error: compError } = await supabase
        .from('company_settings')
        .select('user_id, owner_name, email, farm_name, phone, created_at, updated_at');

      if (compError) throw compError;

      // Combinar dados: TODOS os usuários (com ou sem assinatura)
      const usersData: UserData[] = (userMetadata || []).map((user: any) => {
        const subscription = subscriptions?.find((s: any) => s.user_id === user.id);
        const company = companies?.find((c: any) => c.user_id === user.id);
        const meta = user.metadata || {};
        
        // Calcular dias sem usar (baseado no último login ou última atualização)
        const lastActivity = user.last_sign_in_at || company?.updated_at || user.created_at;
        const lastUpdate = new Date(lastActivity);
        const now = new Date();
        const daysInactive = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

        // Priorizar dados: company_settings > user_metadata > email da auth.users
        const hasCompanySettings = !!company?.email || !!company?.farm_name;
        const hasMetadata = !!meta.email || !!meta.farmName;

        let email = company?.email || company?.owner_name;
        let farmName = company?.farm_name;
        let phone = company?.phone;

        // Se não tem company_settings, usar user_metadata
        if (!email && hasMetadata) {
          email = meta.email || meta.name || 'Sem email';
        }
        if (!farmName && hasMetadata) {
          farmName = meta.farmName || 'Sem nome';
        }
        if (!phone && hasMetadata) {
          phone = meta.phone || 'Não informado';
        }

        // Se ainda não tem dados, usar email da auth.users
        if (!email) {
          email = user.email || 'Email não disponível';
        }
        if (!farmName) {
          farmName = hasMetadata ? 'Sem nome' : '📋 Usuário antigo';
        }
        if (!phone) {
          phone = user.phone || '—';
        }

        return {
          user_id: user.id,
          email: email || 'Email não informado',
          phone: phone || '—',
          farm_name: farmName || 'Sem nome',
          created_at: user.created_at,
          updated_at: company?.updated_at || user.updated_at,
          subscription: subscription || null,
          daysInactive
        };
      });

      // Calcular estatísticas
      const total = usersData.length;
      const active = usersData.filter(u => u.subscription?.status === 'active').length;
      const inactive = usersData.filter(u => !u.subscription || u.subscription.status === 'expired').length;
      const paying = usersData.filter(u => u.subscription?.status === 'active' && u.subscription.last_payment_at).length;

      setStats({ total, active, inactive, paying });
      setUsers(usersData);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.farm_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    switch (filterType) {
      case 'active':
        filtered = filtered.filter(u => u.subscription?.status === 'active');
        break;
      case 'inactive':
        filtered = filtered.filter(u => !u.subscription || u.subscription.status === 'expired');
        break;
      case 'paying':
        filtered = filtered.filter(u => u.subscription?.status === 'active' && u.subscription.last_payment_at);
        break;
    }

    setFilteredUsers(filtered);
  };

  const activateSubscription = async (userId: string, days: number = 30) => {
    try {
      setActionLoading(userId);
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          last_payment_at: new Date().toISOString(),
          payment_due_date: dueDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      await loadUsers();
      alert(`Assinatura ativada com sucesso! Válida por ${days} dias.`);
    } catch (err: any) {
      console.error('Erro ao ativar assinatura:', err);
      alert('Erro ao ativar assinatura: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deactivateSubscription = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar esta assinatura?')) return;

    try {
      setActionLoading(userId);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      await loadUsers();
      alert('Assinatura desativada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao desativar assinatura:', err);
      alert('Erro ao desativar assinatura: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const extendSubscription = async (userId: string, additionalDays: number) => {
    try {
      setActionLoading(userId);

      const user = users.find(u => u.user_id === userId);
      const currentDueDate = user?.subscription?.payment_due_date 
        ? new Date(user.subscription.payment_due_date)
        : new Date();

      currentDueDate.setDate(currentDueDate.getDate() + additionalDays);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          payment_due_date: currentDueDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      await loadUsers();
      alert(`Assinatura estendida por ${additionalDays} dias!`);
    } catch (err: any) {
      console.error('Erro ao estender assinatura:', err);
      alert('Erro ao estender assinatura: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const extendTrialPeriod = async (userId: string, additionalDays: number = 15) => {
    try {
      setActionLoading(userId);

      const user = users.find(u => u.user_id === userId);
      
      // Calcular nova data de trial
      let trialEndDate: Date;
      if (user?.subscription?.trial_end) {
        trialEndDate = new Date(user.subscription.trial_end);
      } else if (user?.subscription?.created_at) {
        trialEndDate = new Date(user.subscription.created_at);
        trialEndDate.setDate(trialEndDate.getDate() + 15); // Trial padrão de 15 dias
      } else {
        trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 15);
      }

      // Adicionar dias extras
      trialEndDate.setDate(trialEndDate.getDate() + additionalDays);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'trial',
          trial_end: trialEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      await loadUsers();
      alert(`Período de teste estendido por ${additionalDays} dias! Novo vencimento: ${trialEndDate.toLocaleDateString('pt-BR')}`);
    } catch (err: any) {
      console.error('Erro ao estender período de teste:', err);
      alert('Erro ao estender período de teste: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      trial: 'bg-blue-100 text-blue-800 border-blue-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      blocked: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      active: 'Ativa',
      trial: 'Trial',
      expired: 'Expirada',
      blocked: 'Bloqueada'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || styles.blocked}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-1">Gerenciamento de usuários e assinaturas</p>
        </div>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
        >
          🔄 Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total de Usuários</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-600">Assinaturas Ativas</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.active}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-600">Inativos/Expirados</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-900">{stats.inactive}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-sm text-blue-600">Pagantes</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.paying}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        {/* Filtros */}
        <div className="mb-4 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Buscar por email ou nome da fazenda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-2 rounded-lg font-medium transition text-sm ${
                filterType === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-3 py-2 rounded-lg font-medium transition text-sm ${
                filterType === 'active' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ativos ({stats.active})
            </button>
            <button
              onClick={() => setFilterType('inactive')}
              className={`px-3 py-2 rounded-lg font-medium transition text-sm ${
                filterType === 'inactive' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inativos ({stats.inactive})
            </button>
            <button
              onClick={() => setFilterType('paying')}
              className={`px-3 py-2 rounded-lg font-medium transition text-sm ${
                filterType === 'paying' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pagantes ({stats.paying})
            </button>
          </div>
        </div>

        {/* Tabela Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email / Fazenda</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dias Restantes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo sem Usar</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                // Calcular vencimento e dias restantes
                let dueDate: string | null = null;
                let daysRemaining: number | null = null;

                if (user.subscription) {
                  if (user.subscription.payment_due_date) {
                    // Assinatura ativa com data de vencimento
                    dueDate = user.subscription.payment_due_date;
                    daysRemaining = getDaysRemaining(dueDate);
                  } else if (user.subscription.status === 'trial') {
                    // Trial: calcular 15 dias a partir da criação
                    const trialDate = new Date(user.subscription.created_at);
                    trialDate.setDate(trialDate.getDate() + 15);
                    dueDate = trialDate.toISOString();
                    daysRemaining = getDaysRemaining(dueDate);
                  }
                }

                return (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 font-medium">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.farm_name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.phone}
                    </td>
                    <td className="px-4 py-3">
                      {user.subscription ? getStatusBadge(user.subscription.status) : (
                        <span className="text-xs text-gray-400">Sem assinatura</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.subscription?.plan_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {dueDate
                        ? new Date(dueDate).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {daysRemaining !== null ? (
                        <span className={`font-medium ${
                          daysRemaining < 0 ? 'text-red-600' : 
                          daysRemaining < 3 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {daysRemaining < 0 ? 'Expirado' : `${daysRemaining} dias`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-medium ${
                        user.daysInactive > 30 ? 'text-red-600' : 
                        user.daysInactive > 7 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {user.daysInactive === 0 ? 'Hoje' : `${user.daysInactive} dias`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        {user.subscription?.status === 'trial' && (
                          <button
                            onClick={() => extendTrialPeriod(user.user_id, 15)}
                            disabled={actionLoading === user.user_id}
                            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                            title="Estender período de teste em 15 dias"
                          >
                            +15d Trial
                          </button>
                        )}
                        {user.subscription?.status !== 'active' && (
                          <button
                            onClick={() => activateSubscription(user.user_id, 30)}
                            disabled={actionLoading === user.user_id}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Ativar 30d
                          </button>
                        )}
                        {user.subscription?.status === 'active' && (
                          <>
                            <button
                              onClick={() => extendSubscription(user.user_id, 30)}
                              disabled={actionLoading === user.user_id}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              +30 dias
                            </button>
                            <button
                              onClick={() => deactivateSubscription(user.user_id)}
                              disabled={actionLoading === user.user_id}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              Desativar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cards Mobile */}
        <div className="lg:hidden space-y-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              // Calcular vencimento e dias restantes
              let dueDate: string | null = null;
              let daysRemaining: number | null = null;

              if (user.subscription) {
                if (user.subscription.payment_due_date) {
                  dueDate = user.subscription.payment_due_date;
                  daysRemaining = getDaysRemaining(dueDate);
                } else if (user.subscription.status === 'trial') {
                  const trialDate = new Date(user.subscription.created_at);
                  trialDate.setDate(trialDate.getDate() + 15);
                  dueDate = trialDate.toISOString();
                  daysRemaining = getDaysRemaining(dueDate);
                }
              }

              return (
                <div key={user.user_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{user.email}</h3>
                      <p className="text-xs text-gray-500 truncate">{user.farm_name}</p>
                    </div>
                    {user.subscription ? getStatusBadge(user.subscription.status) : (
                      <span className="text-xs text-gray-400">Sem assinatura</span>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                    <div>
                      <span className="text-gray-500">Telefone:</span>
                      <p className="font-medium text-gray-900">{user.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Plano:</span>
                      <p className="font-medium text-gray-900">{user.subscription?.plan_name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Vencimento:</span>
                      <p className="font-medium text-gray-900">
                        {dueDate ? new Date(dueDate).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Dias Restantes:</span>
                      <p className={`font-medium ${
                        daysRemaining !== null ? (
                          daysRemaining < 0 ? 'text-red-600' : 
                          daysRemaining < 3 ? 'text-yellow-600' : 
                          'text-green-600'
                        ) : 'text-gray-900'
                      }`}>
                        {daysRemaining !== null ? (
                          daysRemaining < 0 ? 'Expirado' : `${daysRemaining} dias`
                        ) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Inatividade */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Tempo sem usar: </span>
                    <span className={`text-xs font-medium ${
                      user.daysInactive > 30 ? 'text-red-600' : 
                      user.daysInactive > 7 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {user.daysInactive === 0 ? 'Hoje' : `${user.daysInactive} dias`}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    {user.subscription?.status === 'trial' && (
                      <button
                        onClick={() => extendTrialPeriod(user.user_id, 15)}
                        disabled={actionLoading === user.user_id}
                        className="flex-1 px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-medium"
                      >
                        +15d Trial
                      </button>
                    )}
                    {user.subscription?.status !== 'active' && (
                      <button
                        onClick={() => activateSubscription(user.user_id, 30)}
                        disabled={actionLoading === user.user_id}
                        className="flex-1 px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                      >
                        Ativar 30d
                      </button>
                    )}
                    {user.subscription?.status === 'active' && (
                      <>
                        <button
                          onClick={() => extendSubscription(user.user_id, 30)}
                          disabled={actionLoading === user.user_id}
                          className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                        >
                          +30 dias
                        </button>
                        <button
                          onClick={() => deactivateSubscription(user.user_id)}
                          disabled={actionLoading === user.user_id}
                          className="flex-1 px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium"
                        >
                          Desativar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminPanel;
