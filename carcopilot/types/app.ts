// Tipos centrales de la app — fuente de verdad para entidades de dominio

export type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  /**
   * plan_type enum. Valores posibles:
   * - 'trial'   → período de prueba activo
   * - 'pro'     → suscripción activa y vigente
   * - 'expired' → trial o pro vencido
   * - 'free'    → legacy (pre-migración), tratado como 'trial'
   */
  plan: 'free' | 'trial' | 'pro' | 'expired';
  plan_expires_at: string | null;
  trial_started_at: string | null;
  created_at: string;
};

export type PushToken = {
  id: string
  user_id: string
  expo_push_token: string
  device_platform: string | null
  updated_at: string
}

export type AiInsight = {
  id: string
  user_id: string
  vehicle_id: string | null
  content: string
  type: 'alert' | 'tip' | 'achievement' | 'prediction'
  priority: number
  is_saved: boolean
  generated_at: string
  expires_at: string
  read_at: string | null
}

export type MaintenanceItem = {
  category: string;
  item: string;
  cost: number;
  notes: string | null;
};

export type MaintenanceLog = {
  id: string;
  vehicle_id: string;
  user_id: string;
  date: string;
  odometer: number;
  total_amount_cop: number;
  description: string | null;
  taller: string | null;
  type: string | null;
  items: MaintenanceItem[];
  created_at: string | null;
};

export type NewMaintenanceLog = Omit<MaintenanceLog, 'id' | 'created_at'>;
