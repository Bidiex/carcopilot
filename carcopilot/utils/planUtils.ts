import type { Profile } from '@/types/app';

export type PlanStatus = 'trial' | 'pro' | 'expired';

const TRIAL_DAYS = 15;

/**
 * Calcula el estado actual del plan basado en los datos del perfil.
 * Esta es la fuente de verdad — ningún componente debe calcular esto inline.
 */
export function getPlanStatus(profile: Profile): PlanStatus {
  // Suscripción Pro vigente
  if (profile.plan === 'pro' && profile.plan_expires_at) {
    const expiresAt = new Date(profile.plan_expires_at);
    if (expiresAt > new Date()) return 'pro';
    // Pro expirado
    return 'expired';
  }

  // Trial activo
  if (profile.plan === 'trial' && profile.trial_started_at) {
    const trialStart = new Date(profile.trial_started_at);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff < TRIAL_DAYS) return 'trial';
    return 'expired';
  }

  // Fallback para valor legacy 'free' (registros pre-migración)
  if (profile.plan === 'free') return 'trial';

  return 'expired';
}

/**
 * Días restantes del trial. Retorna 0 si no aplica.
 */
export function getTrialDaysRemaining(profile: Profile): number {
  if (
    (profile.plan !== 'trial' && profile.plan !== 'free') ||
    !profile.trial_started_at
  )
    return 0;
  const trialStart = new Date(profile.trial_started_at);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, TRIAL_DAYS - daysDiff);
}

/**
 * Verifica si el usuario puede realizar acciones CUD (crear, editar, eliminar).
 */
export function canPerformActionsForProfile(profile: Profile): boolean {
  const status = getPlanStatus(profile);
  return status === 'trial' || status === 'pro';
}

/**
 * Texto descriptivo del estado del plan para la UI.
 */
export function getPlanLabel(profile: Profile): string {
  const status = getPlanStatus(profile);
  switch (status) {
    case 'trial':
      return `Trial — ${getTrialDaysRemaining(profile)} días restantes`;
    case 'pro':
      return 'Pro';
    case 'expired':
      return 'Trial vencido';
  }
}
