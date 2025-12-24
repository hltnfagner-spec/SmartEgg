export interface Alert {
  id: string;
  type: 'production_up' | 'production_down' | 'inventory_low';
  title: string;
  message: string;
  percentage?: number;
  flockName?: string;
  itemName?: string;
  daysRemaining?: number;
  createdAt: Date;
  batchDate: string; // YYYY-MM-DD para agrupar
}

export interface AlertBatch {
  date: string;
  alerts: Alert[];
}
