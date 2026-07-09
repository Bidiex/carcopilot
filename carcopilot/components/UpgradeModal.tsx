import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';

type UpgradeModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
};

const BENEFITS = [
  {
    icon: 'car-outline' as const,
    color: Colors.primary500,
    text: 'Vehículos ilimitados',
  },
  {
    icon: 'pricetag-outline' as const,
    color: Colors.primary500,
    text: 'Todas las categorías de gasto',
  },
  {
    icon: 'notifications-outline' as const,
    color: Colors.warning,
    text: 'Alertas de vencimiento (SOAT, tecnomecánica, impuestos)',
  },
  {
    icon: 'mic-outline' as const,
    color: Colors.primary500,
    text: 'Asistente de IA con voz',
  },
];

export function UpgradeModal({ visible, onClose, onUpgrade }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
              style={styles.headerLabel}
            >
              COPILOTO PRO
            </Text>
            <Text variant="heading1" color="white" weight="700" align="center">
              Tu período de prueba ha terminado
            </Text>
            <Text
              variant="body"
              color="white"
              align="center"
              style={styles.headerSubtitle}
            >
              Suscríbete a Copiloto Pro para seguir registrando y
              gestionando tus gastos.
            </Text>
          </LinearGradient>

          {/* Contenido */}
          <View style={styles.body}>
            {/* Beneficios */}
            <View style={styles.benefitsList}>
              {BENEFITS.map(({ icon, color, text }) => (
                <View key={text} style={styles.benefitRow}>
                  <View style={[styles.benefitIcon, { backgroundColor: `${color}14` }]}>
                    <Ionicons name={icon} size={18} color={color} />
                  </View>
                  <Text
                    variant="body"
                    color="gray800"
                    weight="500"
                    style={styles.benefitText}
                  >
                    {text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Selector de planes */}
            <View style={styles.plansRow}>
              {/* Mensual */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardActive,
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text variant="caption" color="gray500" weight="600">
                  MENSUAL
                </Text>
                <Text variant="heading2" color="gray900" weight="700">
                  $14.900
                </Text>
                <Text variant="caption" color="gray500">
                  /mes
                </Text>
              </TouchableOpacity>

              {/* Anual (resaltado) */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.planCard,
                  styles.planCardAnnual,
                  selectedPlan === 'annual' && styles.planCardActive,
                ]}
                onPress={() => setSelectedPlan('annual')}
              >
                {/* Badge de descuento */}
                <View style={styles.saveBadge}>
                  <Text variant="smallLabel" color="white" weight="700">
                    Ahorra 33%
                  </Text>
                </View>
                <Text variant="caption" color="gray500" weight="600">
                  ANUAL
                </Text>
                <Text variant="heading2" color="gray900" weight="700">
                  $119.900
                </Text>
                <Text variant="caption" color="gray500">
                  /año
                </Text>
                <Text variant="smallLabel" color="success" weight="600" style={styles.perMonth}>
                  ~$9.992/mes
                </Text>
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <Button
              title="Suscribirme"
              onPress={onUpgrade}
              style={styles.ctaButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.floating,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLabel: {
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  headerSubtitle: {
    opacity: 0.9,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  body: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  benefitsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    lineHeight: 20,
  },
  plansRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  planCard: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 2,
    position: 'relative',
  },
  planCardAnnual: {
    backgroundColor: Colors.gray50,
  },
  planCardActive: {
    borderColor: Colors.primary500,
    backgroundColor: Colors.primary50,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: -6,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  perMonth: {
    marginTop: 2,
  },
  ctaButton: {
    width: '100%',
  },
});
