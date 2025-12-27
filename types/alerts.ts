console.log('🚨 types/alerts.ts CARREGADO!');

export interface Alert {
  id: string;
  fingerprint: string; // ID único baseado em contexto
  type: 'production_up' | 'production_down' | 'inventory_low';
  title: string;
  message: string;
  percentage?: number;
  flockName?: string;
  itemName?: string;
  daysRemaining?: number;
  createdAt: Date;
  batchDate: string; // YYYY-MM-DD para agrupar
  metadata?: {
    threshold?: number;
    value?: number;
    flockId?: string;
    itemId?: string;
  };
}

export interface AlertBatch {
  date: string;
  alerts: Alert[];
}

export interface DismissedAlert {
  fingerprint: string;
  dismissedAt: Date;
  expiresAt: Date;
  ttl: '1h' | '24h' | 'forever';
}
