import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'
import Constants from 'expo-constants'

export async function registerPushToken(userId: string): Promise<void> {
  try {
    if (!Device.isDevice) {
      return
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushToken] Permission not granted')
      return
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
      
    if (!projectId) {
      console.error('[PushToken] Missing EAS Project ID in Constants')
      return
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    })

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
      console.error('[PushToken] Supabase insert error:', error.message || error.code)
    }
  } catch (error: any) {
    console.error('[PushToken] Registration failed:', error.message || error)
  }
}
