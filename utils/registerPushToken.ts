import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'

export async function registerPushToken(userId: string): Promise<void> {
// console.log('[PushToken] Iniciando registro para userId:', userId)

  if (!Device.isDevice) {
    // console.log('[PushToken] No es dispositivo físico, saliendo')
    return
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  // console.log('[PushToken] Permiso actual:', existingStatus)
  
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  // console.log('[PushToken] Permiso final:', finalStatus)
  if (finalStatus !== 'granted') {
    // console.log('[PushToken] Permiso denegado, saliendo')
    return
  }

  // console.log('[PushToken] Obteniendo token...')
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  })
  // console.log('[PushToken] Token obtenido:', tokenData.data)

  const token = tokenData.data
  const platform = Platform.OS

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token: token,
        device_platform: platform,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id, expo_push_token',
      }
    )

  if (error) {
    // console.log('[PushToken] Error al guardar en Supabase:', error)
  } else {
    // console.log('[PushToken] Token guardado exitosamente en Supabase')
  }
}
