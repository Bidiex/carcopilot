import { supabase } from '@/lib/supabase'
import type { PromoSplash } from '@/types/app'

export async function getActiveSplash(userId: string | null): Promise<PromoSplash | null> {
  try {
    const { data: splash, error } = await supabase
      .from('promo_splashes')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !splash) return null

    if (splash.frequency === 'always') return splash as PromoSplash

    // frequency === 'once_per_user' — verificar si el usuario ya lo vio
    if (userId) {
      const { data: alreadyViewed } = await supabase
        .from('promo_splash_views')
        .select('id')
        .eq('splash_id', splash.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (alreadyViewed) return null
    }

    return splash as PromoSplash
  } catch {
    // Cualquier error: no mostrar splash — nunca bloquear la app por esto
    return null
  }
}

export async function markSplashAsViewed(splashId: string, userId: string): Promise<void> {
  try {
    await supabase
      .from('promo_splash_views')
      .insert({ splash_id: splashId, user_id: userId })
  } catch {
    // Silencioso — si falla el tracking no es crítico
  }
}
