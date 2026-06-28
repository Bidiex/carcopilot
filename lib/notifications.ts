import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar el manejador para cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Solicita permisos de notificación al usuario
 */
export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Copiloto Vehicular',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4D4DFF',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Programa recordatorios locales de vencimiento a los 60, 30 y 15 días previos
 */
export async function scheduleDocumentReminder(
  recordId: string,
  type: 'soat' | 'tech_inspection' | 'tax',
  vehicleName: string,
  plate: string,
  expiryDateStr: string
) {
  if (Platform.OS === 'web') return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Cancelar recordatorios previos para este registro por seguridad
  await cancelDocumentReminders(recordId);

  // Parsear fecha de vencimiento (establecer a las 9:00 AM hora local)
  const expiryDate = new Date(`${expiryDateStr}T09:00:00`);
  if (isNaN(expiryDate.getTime())) return;

  const now = new Date();

  const intervals = [60, 30, 15];
  const typeLabel =
    type === 'soat'
      ? 'SOAT'
      : type === 'tech_inspection'
      ? 'Tecnomecánica'
      : 'Impuesto Vehicular';

  for (const daysBefore of intervals) {
    const triggerDate = new Date(expiryDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
    
    // Solo programar si la fecha del recordatorio está en el futuro
    if (triggerDate > now) {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `${recordId}_${daysBefore}`,
          content: {
            title: `⚠️ Vencimiento de ${typeLabel}`,
            body: `El ${typeLabel} de tu ${vehicleName} (${plate}) vencerá en ${daysBefore} días. ¡Regístralo a tiempo!`,
            data: { recordId, type },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
      } catch (error) {
        // console.error(`Error scheduling notification for ${daysBefore} days:`, error);
      }
    }
  }
}

/**
 * Cancela todas las notificaciones programadas asociadas a un registro específico
 */
export async function cancelDocumentReminders(recordId: string) {
  if (Platform.OS === 'web') return;

  const intervals = [60, 30, 15];
  for (const daysBefore of intervals) {
    try {
      await Notifications.cancelScheduledNotificationAsync(`${recordId}_${daysBefore}`);
    } catch {
      // Ignorar errores al intentar cancelar notificaciones no existentes
    }
  }
}

/**
 * Programa una notificación local para mostrarse en N segundos.
 */
export async function scheduleLocalNotification(title: string, body: string, seconds: number = 5) {
  if (Platform.OS === 'web') return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

/**
 * Programa la notificación de bienvenida para el "Copiloto".
 */
export async function scheduleWelcomeNotification() {
  await scheduleLocalNotification(
    "¡Bienvenido a CarCopilot! 🚗",
    "Tu garaje digital está listo. Comienza a registrar tus gastos para tomar el control de tus finanzas.",
    5 // Aparece 5 segundos después
  );
}
