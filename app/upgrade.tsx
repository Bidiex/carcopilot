import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Car,
  Bell,
  Mic,
  Tag,
  Check,
  ChevronLeft,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Typography';
import { Button } from '@/components/Button';
import { Colors, Spacing, Radius, Shadows, Layout } from '@/constants/theme';
import { useAlert } from '@/context/AlertContext';

const BENEFITS = [
  {
    icon: Car,
    title: 'Vehículos ilimitados',
    description: 'Registra y gestiona toda tu flota sin restricciones.',
  },
  {
    icon: Tag,
    title: 'Todas las categorías de gasto',
    description: 'Combustible, eléctrico, talleres, impuestos y más.',
  },
  {
    icon: Bell,
    title: 'Alertas de vencimiento',
    description: 'SOAT, tecnomecánica, impuestos — nunca más te olvides.',
  },
  {
    icon: Mic,
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
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          {/* Back button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={Colors.white} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text
              variant="smallLabel"
              color="white"
              weight="600"
              style={styles.proLabel}
            >
              COPILOTO PRO
            </Text>
            <Text variant="heading1" color="white" weight="700" align="center">
              La mejor herramienta para{'\n'}gestionar tu vehículo
            </Text>
            <Text
              variant="body"
              color="white"
              align="center"
              style={styles.headerSubtitle}
            >
              Todo lo que necesitas para llevar el control total de tus gastos de transporte.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Beneficios */}
        <View style={styles.section}>
          <Text variant="heading2" color="gray900" weight="700" style={styles.sectionTitle}>
            Todo incluido en Pro
          </Text>

          <View style={styles.benefitsList}>
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <View key={title} style={styles.benefitRow}>
                <View style={styles.checkCircle}>
                  <Check size={14} color={Colors.white} strokeWidth={2.5} />
                </View>
                <View style={styles.benefitTexts}>
                  <Text variant="body" color="gray900" weight="600">
                    {title}
                  </Text>
                  <Text variant="caption" color="gray500" style={styles.benefitDesc}>
                    {description}
                  </Text>
                </View>
                <Icon size={20} color={Colors.primary500} strokeWidth={1.5} />
              </View>
            ))}
          </View>
        </View>

        {/* Selector de planes */}
        <View style={styles.section}>
          <Text variant="heading2" color="gray900" weight="700" style={styles.sectionTitle}>
            Elige tu plan
          </Text>

          <View style={styles.plansContainer}>
            {/* Plan Anual (primero, preseleccionado) */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.planCardActive,
              ]}
              onPress={() => setSelectedPlan('annual')}
            >
              <View style={styles.planCardInner}>
                <View style={styles.planInfo}>
                  <View style={styles.planTitleRow}>
                    <Text variant="body" color="gray900" weight="700">
                      Anual
                    </Text>
                    <View style={styles.saveBadge}>
                      <Text variant="smallLabel" color="white" weight="700">
                        Ahorra 33%
                      </Text>
                    </View>
                  </View>
                  <Text variant="caption" color="gray500">
                    ~$9.992/mes · Sin compromisos
                  </Text>
                </View>
                <View style={styles.planPriceBlock}>
                  <Text variant="heading2" color="gray900" weight="700">
                    $119.900
                  </Text>
                  <Text variant="caption" color="gray500">
                    /año
                  </Text>
                </View>
              </View>
              {selectedPlan === 'annual' && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>

            {/* Plan Mensual */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardActive,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planCardInner}>
                <View style={styles.planInfo}>
                  <Text variant="body" color="gray900" weight="700">
                    Mensual
                  </Text>
                  <Text variant="caption" color="gray500">
                    Flexibilidad total
                  </Text>
                </View>
                <View style={styles.planPriceBlock}>
                  <Text variant="heading2" color="gray900" weight="700">
                    $14.900
                  </Text>
                  <Text variant="caption" color="gray500">
                    /mes
                  </Text>
                </View>
              </View>
              {selectedPlan === 'monthly' && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA */}
        <Button
          title={`Suscribirme al plan ${selectedPlan === 'annual' ? 'Anual' : 'Mensual'}`}
          onPress={handleSubscribe}
          style={styles.ctaButton}
        />

        {/* Nota legal */}
        <Text
          variant="caption"
          color="gray500"
          align="center"
          style={styles.legalNote}
        >
          Cancela cuando quieras. El pago en línea estará disponible muy pronto.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  headerGradient: {
    paddingBottom: Spacing.xl,
  },
  backButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  proLabel: {
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  headerSubtitle: {
    opacity: 0.9,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  benefitsList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    overflow: 'hidden',
    ...Shadows.card,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary500,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  benefitTexts: {
    flex: 1,
  },
  benefitDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
  plansContainer: {
    gap: Spacing.sm,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.gray200,
    padding: Spacing.md,
    position: 'relative',
    ...Shadows.card,
  },
  planCardActive: {
    borderColor: Colors.primary500,
    backgroundColor: Colors.primary50,
  },
  planCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    gap: 2,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  saveBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  planPriceBlock: {
    alignItems: 'flex-end',
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  legalNote: {
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
});
