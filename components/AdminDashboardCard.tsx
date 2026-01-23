import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useFarm } from '../context/FarmContext';

interface UserStats {
  total: number;
  active: number;
  trial: number;
  expired: number;
  blocked: number;
}

interface RecentUser {
  email: string;
  status: string;
  created_at: string;
}

const AdminDashboardCard = () => {
  const { navigate } = useFarm();
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    trial: 0,
    expired: 0,
    blocked: 0
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Buscar todas as assinaturas
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id, status, created_at');

      if (subError) {
        console.error('Erro ao buscar assinaturas:', subError);
        throw subError;
      }

      // Buscar dados dos usuários da tabela company_settings (que tem email/nome)
      const { data: companies, error: compError } = await supabase
        .from('company_settings')
        .select('user_id, owner_email, farm_name, created_at')
        .order('created_at', { ascending: false });

      if (compError) {
        console.error('Erro ao buscar empresas:', compError);
      }

      // Calcular estatísticas
      const total = subscriptions?.length || 0;
      const active = subscriptions?.filter(s => s.status === 'active').length || 0;
      const trial = subscriptions?.filter(s => s.status === 'trial').length || 0;
      const expired = subscriptions?.filter(s => s.status === 'expired').length || 0;
      const blocked = subscriptions?.filter(s => s.status === 'blocked').length || 0;

      setStats({ total, active, trial, expired, blocked });

      // Pegar últimos 5 usuários cadastrados
      const recent = companies
        ?.slice(0, 5)
        .map((company: any) => {
          const sub = subscriptions?.find(s => s.user_id === company.user_id);
          return {
            email: company.owner_email || company.farm_name || 'Sem email',
            status: sub?.status || 'sem assinatura',
            created_at: company.created_at
          };
        }) || [];

      setRecentUsers(recent);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-600',
      trial: 'text-blue-600',
      expired: 'text-red-600',
      blocked: 'text-gray-600',
      'sem assinatura': 'text-gray-400'
    };
    return colors[status as keyof typeof colors] || 'text-gray-400';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Ativa',
      trial: 'Trial',
      expired: 'Expirada',
      blocked: 'Bloqueada',
      'sem assinatura': 'Sem assinatura'
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 shadow-xl text-white">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/20 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 shadow-xl text-white">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold mb-1">👑 Painel Administrativo</h3>
          <p className="text-purple-100 text-sm">Visão geral dos clientes</p>
        </div>
        <button
          onClick={() => navigate('admin')}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition backdrop-blur-sm"
        >
          Ver Detalhes →
        </button>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
          <div className="text-purple-100 text-xs mt-1">Total Cadastros</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-2xl sm:text-3xl font-bold text-green-300">{stats.active}</div>
          <div className="text-purple-100 text-xs mt-1">Assinaturas Ativas</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-2xl sm:text-3xl font-bold text-blue-300">{stats.trial}</div>
          <div className="text-purple-100 text-xs mt-1">Em Trial</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-2xl sm:text-3xl font-bold text-red-300">{stats.expired}</div>
          <div className="text-purple-100 text-xs mt-1">Expiradas</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-2xl sm:text-3xl font-bold text-gray-300">{stats.blocked}</div>
          <div className="text-purple-100 text-xs mt-1">Bloqueadas</div>
        </div>
      </div>

      {/* Últimos Cadastros */}
      <div className="bg-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
        <h4 className="font-semibold mb-3 text-sm">📋 Últimos Cadastros</h4>
        <div className="space-y-2">
          {recentUsers.length > 0 ? (
            recentUsers.map((user, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-sm py-2 border-b border-white/10 last:border-0 gap-1">
                <div className="flex-1 truncate">
                  <span className="font-medium text-xs sm:text-sm">{user.email}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-2">
                  <span className={`text-xs font-medium ${getStatusColor(user.status)}`}>
                    {getStatusLabel(user.status)}
                  </span>
                  <span className="text-xs text-purple-200">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-purple-200 text-sm py-4">
              Nenhum usuário cadastrado ainda
            </div>
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => navigate('admin')}
          className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition backdrop-blur-sm"
        >
          🔍 Ver Todos os Clientes
        </button>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition backdrop-blur-sm"
        >
          🔄
        </button>
      </div>
    </div>
  );
};

export default AdminDashboardCard;
