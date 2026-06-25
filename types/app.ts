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
