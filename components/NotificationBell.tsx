
import { useState, useMemo, useRef, useEffect, FC } from 'react';
import { useFarm } from '../context/FarmContext';
import { BellIcon, ChickenIcon, SalesIcon } from './icons';

const NotificationBell: FC = () => {
    const { tasks, sales, getFlockById, getClientById, navigate } = useFarm();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const notifications = useMemo(() => {
        // Função auxiliar para calcular diferença em dias usando Date.UTC
        // Isso evita problemas de fuso horário onde T00:00:00Z vira o dia anterior
        const getDaysDiff = (targetDateStr: string) => {
            const target = new Date(targetDateStr);
            const now = new Date();

            // Normaliza ambas as datas para UTC meia-noite baseada no calendário
            // Para o alvo (que vem do DB como ISO), usamos getUTC* para pegar o dia exato que foi salvo
            const targetUTC = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
            
            // Para "hoje", usamos get* (local) para pegar o dia atual do usuário
            const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

            const diffTime = targetUTC - todayUTC;
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        };

        const notifs: any[] = [];

        // 1. Tarefas (Mantém 3 dias de antecedência para tarefas operacionais)
        tasks.forEach(task => {
            if (task.isCompleted) return;

            const diffDays = getDaysDiff(task.dueDate);
            
            // Lógica: Mostrar se atrasado (diff < 0) ou se está dentro dos próximos 3 dias (0 <= diff <= 3)
            if (diffDays <= 3) {
                const flock = getFlockById(task.flockId);
                let dateLabel = '';
                let isUrgent = false;

                if (diffDays < 0) {
                    dateLabel = 'Atrasada';
                    isUrgent = true;
                } else if (diffDays === 0) {
                    dateLabel = 'Hoje';
                    isUrgent = true;
                } else if (diffDays === 1) {
                    dateLabel = 'Amanhã';
                    isUrgent = false;
                } else {
                    dateLabel = `Em ${diffDays} dias`;
                    isUrgent = false;
                }

                notifs.push({
                    id: `task-${task.id}`,
                    type: 'task',
                    title: task.taskType,
                    subtitle: `Lote: ${flock?.name || 'N/A'}`,
                    dateLabel: dateLabel,
                    isUrgent: isUrgent,
                    sortOrder: diffDays, // Usado para ordenação
                    icon: <ChickenIcon className="h-4 w-4 text-amber-600" />
                });
            }
        });

        // 2. Entregas / Vendas Pendentes (Agora com 7 dias de antecedência)
        sales.forEach(sale => {
            const isPending = !sale.deliveryStatus || sale.deliveryStatus === 'Pendente' || sale.deliveryStatus === 'Em Rota';
            if (!isPending) return;

            // Usa data de entrega se houver, senão data da venda
            const targetDateStr = sale.deliveryDate ? sale.deliveryDate : sale.date;
            const diffDays = getDaysDiff(targetDateStr);

            // Aumentado para 7 dias conforme solicitado
            if (diffDays <= 7) {
                const client = sale.clientId ? getClientById(sale.clientId) : null;
                const flock = getFlockById(sale.flockId);
                
                let dateLabel = '';
                let isUrgent = false;

                if (diffDays < 0) {
                    dateLabel = 'Atrasada';
                    isUrgent = true;
                } else if (diffDays === 0) {
                    dateLabel = 'Hoje';
                    isUrgent = true;
                } else if (diffDays === 1) {
                    dateLabel = 'Amanhã';
                    isUrgent = false;
                } else {
                    dateLabel = `Em ${diffDays} dias`;
                    isUrgent = false;
                }

                notifs.push({
                    id: `sale-${sale.id}`,
                    type: 'delivery',
                    title: 'Entrega Agendada',
                    subtitle: `${client ? client.name : 'Venda Avulsa'} - ${sale.quantity} ${sale.productType || 'Ovos'}`,
                    detail: `${sale.deliveryAddress ? 'End: ' + sale.deliveryAddress : 'Lote: ' + (flock?.name || 'N/A')}`,
                    dateLabel: dateLabel,
                    isUrgent: isUrgent,
                    sortOrder: diffDays,
                    icon: <SalesIcon className="h-4 w-4 text-green-600" />
                });
            }
        });

        // Ordenação: 
        // 1. Atrasados e Hoje primeiro (isUrgent)
        // 2. Depois pela proximidade da data (sortOrder crescente)
        return notifs.sort((a, b) => {
            if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
            return a.sortOrder - b.sortOrder;
        });
    }, [tasks, sales, getFlockById, getClientById]);

    const handleNotificationClick = (notif: any) => {
        setIsOpen(false);
        if (notif.type === 'delivery') {
            // Redireciona para o módulo de clientes com a aba de entregas ativa
            navigate('clients', { tab: 'deliveries' });
        }
        // Para tarefas, se necessário, poderia redirecionar para flocks ou dashboard
    };

    const hasNotifications = notifications.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 transition-colors rounded-full hover:bg-slate-100 ${isOpen ? 'bg-slate-100 text-orange-500' : 'text-slate-400 hover:text-orange-500'}`}
            >
                <BellIcon />
                {hasNotifications && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700 text-sm">Notificações</h3>
                        <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{notifications.length} pendentes</span>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length > 0 ? (
                            <ul className="divide-y divide-slate-50">
                                {notifications.map(notif => (
                                    <li 
                                        key={notif.id} 
                                        onClick={() => handleNotificationClick(notif)}
                                        className="p-4 hover:bg-slate-50 transition-colors flex items-start space-x-3 cursor-pointer group"
                                    >
                                        <div className={`p-2 rounded-full flex-shrink-0 ${notif.type === 'task' ? 'bg-amber-100' : 'bg-green-100'}`}>
                                            {notif.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-amber-600 transition-colors">{notif.title}</p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ml-2 ${notif.isUrgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {notif.dateLabel}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 mt-0.5">{notif.subtitle}</p>
                                            {notif.detail && <p className="text-xs text-slate-400 mt-0.5 truncate">{notif.detail}</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Nenhuma notificação para os próximos dias.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
