import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Colors, Spacing, Radius, Shadows, Layout } from '@/constants/theme';
import { useAlert } from '@/context/AlertContext';

const BENEFITS = [
  {
    title: 'Vehículos ilimitados',
    description: 'Registra y gestiona toda tu flota sin restricciones.',
  },
  {
    title: 'Todas las categorías de gasto',
    description: 'Combustible, eléctrico, talleres, impuestos y más.',
  },
  {
    title: 'Alertas de vencimiento',
    description: 'SOAT, tecnomecánica, impuestos — nunca más te olvides.',
  },
  {
    title: 'Asistente de IA con voz',
    description: 'Registra gastos hablando, sin tocar el teléfono.',
  },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  const handleSubscribe = () => {
    showAlert(
      'Próximamente 🚀',
      'El pago en línea estará disponible muy pronto. Por ahora puedes contactarnos directamente para suscribirte.',
      [
        {
          text: 'Contactar por WhatsApp',
          onPress: () =>
            Linking.openURL(
              'https://wa.me/573000000000?text=Quiero%20suscribirme%20a%20Copiloto%20Pro'
            ),
        },
        {
          text: 'Cerrar',
          onPress: () => {},
        },
      ],
      'info'
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/upgrade_bg.webp')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      {/* Premium dark gradient overlay */}
      <LinearGradient
        colors={['rgba(15, 15, 26, 0.45)', 'rgba(15, 15, 26, 0.85)', 'rgba(15, 15, 26, 0.98)']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header Controls */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close-outline" size={28} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSubscribe}
            style={styles.restoreButton}
          >
            <Text variant="body" color="white" weight="600">
              Restaurar
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Title / Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoRow}>
              <Text variant="display" color="white" weight="700" style={styles.brandTitle}>
                CarCopilot
              </Text>
              <View style={styles.proBadge}>
                <Text variant="caption" color="white" weight="700" style={styles.proBadgeText}>
                  PRO
                </Text>
              </View>
            </View>
            <Text variant="heading2" color="white" weight="500" align="center" style={styles.brandSubtitle}>
              Lleva el control inteligente y mecánico de tu vehículo
            </Text>
          </View>

          {/* Feature List (Checkmark checklist style) */}
          <View style={styles.featuresContainer}>
            {BENEFITS.map(({ title, description }) => (
              <View key={title} style={styles.featureRow}>
                <View style={styles.checkIconWrapper}>
                  <Ionicons name="checkmark-circle-outline" size={22} color={Colors.primary500} />
                </View>
                <View style={styles.featureTexts}>
                  <Text variant="body" color="white" weight="600">
                    {title}
                  </Text>
                  <Text variant="caption" color="gray400" style={styles.featureDesc}>
                    {description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing options (2 parallel cards) */}
          <View style={styles.plansContainer}>
            {/* Box 1: Monthly */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardActive,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planCardHeader}>
                <Text variant="body" color="white" weight="600">
                  Mensual
                </Text>
              </View>
              <View style={styles.planCardBody}>
                <Text variant="heading1" color="white" weight="700" style={styles.priceText}>
                  $14.900
                </Text>
                <Text variant="caption" color="gray400" style={styles.planBillingText}>
                  Facturado mensual
                </Text>
              </View>
              {selectedPlan === 'monthly' && (
                <View style={styles.selectedCheckBadge}>
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>

            {/* Box 2: Annual */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.planCardActive,
              ]}
              onPress={() => setSelectedPlan('annual')}
            >
              <View style={styles.planCardHeader}>
                <Text variant="body" color="white" weight="600">
                  Anual
                </Text>
                <View style={styles.saveBadge}>
                  <Text variant="smallLabel" color="white" weight="700" style={styles.saveBadgeText}>
                    Ahorra 33%
                  </Text>
                </View>
              </View>
              <View style={styles.planCardBody}>
                <Text variant="heading1" color="white" weight="700" style={styles.priceText}>
                  $119.900
                </Text>
                <Text variant="caption" color="gray400" style={styles.planBillingText}>
                  ~$9.992 / mes
                </Text>
              </View>
              {selectedPlan === 'annual' && (
                <View style={styles.selectedCheckBadge}>
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* CTA Button & Legal text */}
          <View style={styles.ctaContainer}>
            <Button
              title="Suscribirme"
              onPress={handleSubscribe}
              icon="chevron-forward"
              style={styles.ctaButton}
            />
            <Text
              variant="caption"
              color="gray400"
              align="center"
              style={styles.legalNote}
            >
              Cancela cuando quieras. El pago en línea estará disponible muy pronto.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    height: 56,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  restoreButton: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  brandTitle: {
    fontStyle: 'italic',
  },
  proBadge: {
    backgroundColor: Colors.primary500,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: 10,
  },
  brandSubtitle: {
    marginTop: Spacing.xs,
    opacity: 0.85,
    paddingHorizontal: Spacing.md,
  },
  featuresContainer: {
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checkIconWrapper: {
    marginTop: 2,
  },
  featureTexts: {
    flex: 1,
  },
  featureDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 160,
    position: 'relative',
  },
  planCardActive: {
    borderColor: Colors.primary500,
    backgroundColor: 'rgba(77, 77, 255, 0.08)',
  },
  planCardHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  planCardBody: {
    gap: 2,
    marginTop: Spacing.sm,
  },
  priceText: {
    fontSize: 22,
  },
  planBillingText: {
    fontSize: 11,
    opacity: 0.8,
  },
  saveBadge: {
    backgroundColor: Colors.primary500,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  saveBadgeText: {
    fontSize: 8,
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary500,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Shadows.sm,
  },
  ctaContainer: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
  },
  legalNote: {
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
});
