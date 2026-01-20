
export interface UserRecord {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  lastLogin?: any;
}

export interface UserData {
  id: string;
  uid: string;
  nombre: string;
  email: string;
  password?: string;
  duracion: number;
  fechaInicio: string;
  fechaVencimiento: string;
  role: string;
  createdAt: any;
  createdBy: string;
}

export interface WidgetUsage {
  id: string;
  duration: number;
  email: string;
  endedAt: any;
  startedAt: any;
  uid: string;
  widgetId: string;
  widgetTitle: string;
}

export interface AdminRecord {
  uid: string;
  email: string;
  role: 'admin' | 'superadmin';
}

export interface DashboardStats {
  totalUsers: number;
  totalSessions: number;
  avgDuration: number;
  activeWidgets: number;
}
