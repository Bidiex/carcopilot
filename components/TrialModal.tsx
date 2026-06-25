import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';

type TrialModalProps = {
  visible: boolean;
  daysRemaining: number;
  onClose: () => void;
};

function getTrialMessage(days: number): { title: string; subtitle: string } {
  if (days >= 8) {
    return {
      title: 'Estás en tu período de prueba gratuita 🎉',
      subtitle: `Te quedan ${days} días para explorar todas las funciones.`,
    };
  }
  if (days >= 4) {
    return {
      title: 'Tu prueba gratuita está por terminar',
      subtitle: `Te quedan ${days} días. Suscríbete para no perder el acceso.`,
    };
  }
  return {
    title: `¡Solo te quedan ${days} días!`,
    subtitle: 'Suscríbete hoy y sigue sin interrupciones.',
  };
}

export function TrialModal({ visible, daysRemaining, onClose }: TrialModalProps) {
  const router = useRouter();
  const { title, subtitle } = getTrialMessage(daysRemaining);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header con gradiente */}
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text
              variant="smallLabel"
              color="white"
              weight="600"
              style={styles.planLabel}
            >
              COPILOTO PRO
            </Text>
            <Text
              variant="display"
              color="white"
              weight="700"
              style={styles.daysNumber}
            >
              {daysRemaining}
            </Text>
            <Text variant="body" color="white" style={styles.daysLabel}>
              días de prueba restantes
            </Text>
          </LinearGradient>

          {/* Contenido */}
          <View style={styles.body}>
            <Text
              variant="heading2"
              color="gray900"
              weight="700"
              align="center"
              style={styles.title}
            >
              {title}
            </Text>
            <Text
              variant="body"
              color="gray600"
              align="center"
              style={styles.subtitle}
            >
              {subtitle}
            </Text>

            {/* Beneficios rápidos */}
            <View style={styles.benefitsRow}>
              {['Gastos ilimitados', 'Alertas SOAT', 'Asistente IA'].map(
                (b) => (
                  <View key={b} style={styles.benefitChip}>
                    <Text variant="smallLabel" color="primary" weight="600">
                      {b}
                    </Text>
                  </View>
                )
              )}
            </View>

            {/* Botones */}
            <Button
              title="Suscribirme ahora"
              onPress={() => {
                onClose();
                router.push('/upgrade' as any);
              }}
              style={styles.primaryButton}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.secondaryButton}
            >
              <Text variant="body" color="gray500" weight="600" align="center">
                Continuar usando
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  header: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  planLabel: {
    letterSpacing: 1.5,
    opacity: 0.85,
    marginBottom: Spacing.sm,
  },
  daysNumber: {
    fontSize: 64,
    lineHeight: 72,
  },
  daysLabel: {
    opacity: 0.85,
    marginTop: Spacing.xs,
  },
  body: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  benefitChip: {
    backgroundColor: Colors.primary50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary500,
  },
  primaryButton: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  secondaryButton: {
    paddingVertical: Spacing.sm,
    width: '100%',
  },
});
