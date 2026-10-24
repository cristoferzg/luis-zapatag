export type ViewType = 'dashboard' | 'projects' | 'clients' | 'portafolio' | 'materials' | 'personal' | 'finances' | 'contracts' | 'settings' | 'gastos' | 'familia' | 'inversion' | 'deuda' | 'precios' | 'asistencia' | 'epp' | 'calculator' | 'designer' | 'carpinteria' | 'herreria' | 'techos' | 'usuarios' | 'tickets' | 'asesorias' | 'biblioteca' | 'soporte' | 'usabilidad' | 'admin_purchases' | 'concreto' | 'drywall';

export interface Cobro { 
  id: string; 
  amount: number; 
  date: string; 
  method?: string; 
  reference?: string; 
}

export interface AsistenciaRecord { 
  id: string; 
  date: string; 
  hours: number; 
  status: 'Presente' | 'Tarde' | 'Falta' | 'Medio Día'; 
  notes?: string; 
}

export interface Material { 
  id: string; 
  name: string; 
  quantity: number; 
  unit?: string; 
  price?: number; 
  category?: string; 
  unitPrice?: number; 
}

export interface Worker { 
  id: string; 
  name: string; 
  role: string; 
  dailyRate?: number; 
  dni?: string; 
  phone?: string; 
  address?: string; 
  paymentType?: string; 
  days?: number; 
  globalAmount?: number; 
  adelantos?: any[]; 
  amount?: number; 
  asistencia?: AsistenciaRecord[]; 
}

export interface Project {
  id: string; 
  name: string; 
  client: string; 
  status: 'Pendiente' | 'En Progreso' | 'Completado';
  presupuesto: number; 
  date: string; 
  plazoEstimado?: string; 
  cobros?: Cobro[]; 
  gastos?: number;
  materiales?: Material[]; 
  personal?: Worker[]; 
  detallesContrato?: string;
  userId?: string;
  creatorName?: string;
}

export interface ClientFile {
  id: string;
  name: string;
  type: 'photo' | 'contract' | 'document' | 'other';
  dataUrl: string;
  uploadedAt: string;
  size?: string;
}

export interface Client { 
  id: string; 
  name: string; 
  company?: string; 
  phone?: string; 
  email?: string; 
  dni?: string; 
  address?: string; 
  files?: ClientFile[];
  userId?: string;
  creatorName?: string;
  createdAt?: string;
}

export interface FinanceRecord { 
  id: string; 
  type: 'ingreso' | 'gasto' | 'gastos' | 'familia' | 'inversion' | 'deuda'; 
  amount: number; 
  date: string; 
  description: string; 
  category?: string; 
  sourceProject?: string; 
  isPaid?: boolean; 
  isMonthly?: boolean; 
  payments?: {amount: number; date: string}[]; 
  frequency?: 'Unico' | 'Semanal' | 'Quincenal' | 'Mensual'; 
  userId?: string;
  creatorName?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  role: string;
  pin: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  lastLogin?: string;
  lastLoginTimestamp?: number;
  isActive?: boolean;
  // Workspace owner this user belongs to; preserved across backup/restore so a
  // restored user keeps access to their own projects/clients/finances.
  userId?: string;
  materiales?: Material[];
  personal?: Worker[];
  cobros?: Cobro[];
}

export interface GlobalNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  createdAtTimestamp: number;
  priority: 'info' | 'important' | 'alert';
  author: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAtTimestamp?: number;
  durationHours?: number;
}

export interface SystemConfig { 
  id: string; 
  appName: string; 
  logoBase64: string; 
  currency?: string; 
  theme?: string; 
  contratistaDni?: string; 
  contratistaDir?: string; 
  contratistaPhone?: string; 
  contratistaEmail?: string;
  bancoNombre?: string;
  cuentaTitular?: string;
  pagoDetracciones?: string; 
  pagoCtaCorriente?: string; 
  pagoCciDetracciones?: string; 
  pagoCtaBcp?: string; 
  pagoCciBcp?: string; 
  pagoYape?: string; 
  userId?: string;
  softwareVersion?: string;
  googleDriveFolderUrl?: string;
  officialLetterheadBase64?: string;
  notifications?: GlobalNotification[];
}
