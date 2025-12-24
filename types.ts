export interface Shed {
  id: string;
  name: string;
  capacity: number;
  notes?: string;
}

export interface Flock {
  id: string;
  shedId: string; // Adiciona a referência obrigatória ao galpão
  name: string;
  breed: string;
  birthDate: string; // ISO string format
  arrivalDate: string; // ISO string format
  plannedDisposalDate: string; // ISO string format
  initialHenCount: number;
  status: 'Ativo' | 'Descartado';
}

export interface DailyRecord {
  id: string;
  date: string; // ISO string format
  flockId: string;
  eggsCollected: number;
  brokenEggs?: number; // Novos campos de qualidade
  feedConsumedKg: number;
  mortality: number;
  notes?: string;
  createdAt?: string; // Timestamp de criação para ordenação
}

export type ExpenseCategory = 'Ração' | 'Medicamentos' | 'Mão de Obra' | 'Manutenção' | 'Outros';

export interface Expense {
  id: string;
  date: string; // ISO string format
  flockId: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
}

export type SaleType = 'Atacado' | 'Cliente Final';
export type ProductType = 'Ovos' | 'Aves' | 'Cama';
export type PaymentMethod = 'Dinheiro' | 'Pix' | 'Cartão Crédito' | 'Cartão Débito' | 'Transferência' | 'Boleto';
export type PaymentStatus = 'Pago' | 'Pendente';
export type DeliveryStatus = 'Pendente' | 'Em Rota' | 'Entregue' | 'Cancelada';

export interface Sale {
  id: string;
  saleNumber: number; // Número sequencial da venda
  date: string; // ISO string format (Data da Venda)
  flockId: string;
  clientId?: string; // Optional for legacy or anonymous sales
  productType: ProductType; 
  saleType: SaleType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  quantity: number; // Number of eggs/sacs/birds
  pricePerUnit: number;
  totalAmount: number;
  // Campos Logísticos
  deliveryDate?: string; // ISO string format (Data prevista da entrega)
  deliveryStatus?: DeliveryStatus;
  deliveryAddress?: string;
  deliveryNotes?: string;
}

export interface Client {
    id: string;
    name: string;
    phone: string;
    email: string;
    document?: string; // CPF/CNPJ
    address: string;
    city?: string;
    neighborhood?: string; // Bairro
    state?: string; // UF
    type: 'Atacado' | 'Varejo';
    notes?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export type TaskType = 'Vacinação' | 'Debicagem' | 'Higienização' | 'Outro';

export interface FlockTask {
  id: string;
  flockId: string;
  taskType: TaskType;
  dueDate: string; // ISO string format
  notes?: string;
  isCompleted: boolean;
}

export type InventoryCategory = 'Ração' | 'Medicamento' | 'Embalagem' | 'Produto Final' | 'Outro';
export type UnitType = 'kg' | 'g' | 'L' | 'ml' | 'unidade' | 'saco';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: UnitType;
  minThreshold: number; // Quantidade mínima para alerta
  costPerUnit: number;
  lastUpdated: string;
}

// Nova interface para ingredientes dentro de uma formulação
export interface FeedIngredient {
  id: string;
  name: string;
  pricePerKg: number;
  quantityKg: number;
}

// Nova interface para Formulação de Ração
export interface FeedFormulation {
  id: string;
  name: string;
  phase: 'Pré-inicial' | 'Inicial' | 'Crescimento' | 'Postura' | 'Engorda' | 'Outra';
  ingredients: FeedIngredient[];
  totalWeight: number;
  totalCost: number;
  costPerKg: number;
  notes?: string;
}

// Tipos para movimentação de estoque de ovos
export type EggMovementType = 'entrada' | 'saida';
export type EggMovementReason = 'coleta' | 'venda' | 'consumo' | 'doacao' | 'marketing' | 'perda' | 'ajuste';

export interface EggMovement {
  id: string;
  date: string; // ISO string format
  type: EggMovementType;
  reason: EggMovementReason;
  quantity: number;
  balance: number; // Saldo após a movimentação
  notes?: string;
  referenceId?: string; // ID do registro relacionado (coleta, venda, etc)
}

export type View = 'dashboard' | 'data-entry' | 'flocks' | 'sheds' | 'expenses' | 'sales' | 'reports' | 'ai-assistant' | 'calculator' | 'clients' | 'contacts' | 'inventory' | 'mortality' | 'alerts' | 'settings' | 'admin';

// Configurações da Empresa/Granja
export interface CompanySettings {
  id: string;
  farmName: string;
  ownerName: string;
  document: string; // CPF ou CNPJ
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  logo?: string; // URL ou base64 da logo
}

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'blocked';

export interface Subscription {
  id: string;
  userId: string;
  planName: string;
  status: SubscriptionStatus;
  trialStart: string;
  trialEnd: string;
  paymentDueDate?: string | null;
  lastPaymentAt?: string | null;
  mpPreferenceId?: string | null;
  mpPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}
