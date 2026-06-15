import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [profileName, setProfileName] = useState(user?.user_metadata?.name || "Conductor");
  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [currentOdometer, setCurrentOdometer] = useState(0);
  const [averageConsumption, setAverageConsumption] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  // Carga de datos dinámica usando useFocusEffect para refrescar al volver a la pestaña
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      if (!user) return;

      const loadDashboardData = async () => {
        try {
          // 1. Obtener nombre del perfil
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.id)
            .single();

          if (isMounted && profile?.name) {
            setProfileName(profile.name);
          }

          // 2. Obtener vehículo activo
          const { data: vehicle, error: vehicleErr } = await supabase
            .from("vehicles")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .limit(1);

          if (vehicleErr || !vehicle || vehicle.length === 0) {
            if (isMounted) {
              setActiveVehicle(null);
              setRecentLogs([]);
              setMonthlySpent(0);
              setCurrentOdometer(0);
              setAverageConsumption(null);
              setLoading(false);
            }
            return;
          }

          const activeVeh = vehicle[0];
          if (isMounted) {
            setActiveVehicle(activeVeh);
          }

          // 3. Obtener últimos 3 registros de cada tabla
          const { data: fuelLogs } = await supabase
            .from("fuel_logs")
            .select("id, date, amount_cop, gallons, full_tank, consumption_km_gal, odometer")
            .eq("vehicle_id", activeVeh.id)
            .order("date", { ascending: false })
            .limit(3);

          const { data: maintLogs } = await supabase
            .from("maintenance_logs")
            .select("id, date, amount_cop, type, odometer")
            .eq("vehicle_id", activeVeh.id)
            .order("date", { ascending: false })
            .limit(3);

          const { data: taxLogs } = await supabase
            .from("annual_records")
            .select("id, issue_date, amount_cop, type")
            .eq("vehicle_id", activeVeh.id)
            .order("issue_date", { ascending: false })
            .limit(3);

          const { data: chargeLogs } = await supabase
            .from("electric_charge_logs")
            .select("id, date, amount_cop, kwh_charged, odometer, consumption_km_kwh")
            .eq("vehicle_id", activeVeh.id)
            .order("date", { ascending: false })
            .limit(3);

          const { data: otherLogs } = await supabase
            .from("other_expenses")
            .select("id, date, amount_cop, description")
            .eq("vehicle_id", activeVeh.id)
            .order("date", { ascending: false })
            .limit(3);

          const allLogs: any[] = [];
          if (fuelLogs) allLogs.push(...fuelLogs.map(l => ({ ...l, record_type: 'fuel' })));
          if (maintLogs) allLogs.push(...maintLogs.map(l => ({ ...l, record_type: 'maintenance' })));
          if (taxLogs) allLogs.push(...taxLogs.map(l => ({ ...l, record_type: 'tax', date: l.issue_date })));
          if (chargeLogs) allLogs.push(...chargeLogs.map(l => ({ ...l, record_type: 'electric-charge' })));
          if (otherLogs) allLogs.push(...otherLogs.map(l => ({ ...l, record_type: 'other-expense' })));

          allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          if (isMounted) {
            setRecentLogs(allLogs.slice(0, 3));
          }

          // 4. Calcular gastos mensuales (últimos 30 días)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const dateLimit = thirtyDaysAgo.toISOString().split("T")[0];

          const { data: monthlyFuel } = await supabase
            .from("fuel_logs")
            .select("amount_cop")
            .eq("vehicle_id", activeVeh.id)
            .gte("date", dateLimit);

          const { data: monthlyMaint } = await supabase
            .from("maintenance_logs")
            .select("amount_cop")
            .eq("vehicle_id", activeVeh.id)
            .gte("date", dateLimit);

          const { data: monthlyTax } = await supabase
            .from("annual_records")
            .select("amount_cop")
            .eq("vehicle_id", activeVeh.id)
            .gte("issue_date", dateLimit);

          const { data: monthlyCharges } = await supabase
            .from("electric_charge_logs")
            .select("amount_cop")
            .eq("vehicle_id", activeVeh.id)
            .gte("date", dateLimit);

          const { data: monthlyOthers } = await supabase
            .from("other_expenses")
            .select("amount_cop")
            .eq("vehicle_id", activeVeh.id)
            .gte("date", dateLimit);

          const totalSpent =
            (monthlyFuel?.reduce((acc, log) => acc + parseFloat(log.amount_cop), 0) || 0) +
            (monthlyMaint?.reduce((acc, log) => acc + parseFloat(log.amount_cop), 0) || 0) +
            (monthlyTax?.reduce((acc, log) => acc + parseFloat(log.amount_cop), 0) || 0) +
            (monthlyCharges?.reduce((acc, log) => acc + parseFloat(log.amount_cop), 0) || 0) +
            (monthlyOthers?.reduce((acc, log) => acc + parseFloat(log.amount_cop), 0) || 0);

          if (isMounted) {
            setMonthlySpent(totalSpent);
          }

          // 5. Calcular odómetro actual (último registro o el inicial del vehículo)
          const { data: highestFuelOdo } = await supabase
            .from("fuel_logs")
            .select("odometer")
            .eq("vehicle_id", activeVeh.id)
            .order("odometer", { ascending: false })
            .limit(1);

          const { data: highestMaintOdo } = await supabase
            .from("maintenance_logs")
            .select("odometer")
            .eq("vehicle_id", activeVeh.id)
            .order("odometer", { ascending: false })
            .limit(1);

          const { data: highestChargeOdo } = await supabase
            .from("electric_charge_logs")
            .select("odometer")
            .eq("vehicle_id", activeVeh.id)
            .order("odometer", { ascending: false })
            .limit(1);

          let currentOdo = activeVeh.initial_odometer;
          if (highestFuelOdo && highestFuelOdo.length > 0) {
            currentOdo = Math.max(currentOdo, parseFloat(highestFuelOdo[0].odometer));
          }
          if (highestMaintOdo && highestMaintOdo.length > 0) {
            currentOdo = Math.max(currentOdo, parseFloat(highestMaintOdo[0].odometer));
          }
          if (highestChargeOdo && highestChargeOdo.length > 0) {
            currentOdo = Math.max(currentOdo, parseFloat(highestChargeOdo[0].odometer));
          }

          if (isMounted) {
            setCurrentOdometer(currentOdo);
          }

          // 6. Calcular promedio de consumo
          if (activeVeh.propulsion === "electric") {
            const { data: consumptionLogs } = await supabase
              .from("electric_charge_logs")
              .select("consumption_km_kwh")
              .eq("vehicle_id", activeVeh.id)
              .not("consumption_km_kwh", "is", null);

            if (consumptionLogs && consumptionLogs.length > 0) {
              const sumCons = consumptionLogs.reduce(
                (acc, log) => acc + parseFloat(log.consumption_km_kwh),
                0
              );
              if (isMounted) {
                setAverageConsumption(sumCons / consumptionLogs.length);
              }
            } else {
              if (isMounted) {
                setAverageConsumption(null);
              }
            }
          } else {
            const { data: consumptionLogs } = await supabase
              .from("fuel_logs")
              .select("consumption_km_gal")
              .eq("vehicle_id", activeVeh.id)
              .not("consumption_km_gal", "is", null);

            if (consumptionLogs && consumptionLogs.length > 0) {
              const sumCons = consumptionLogs.reduce(
                (acc, log) => acc + parseFloat(log.consumption_km_gal),
                0
              );
              if (isMounted) {
                setAverageConsumption(sumCons / consumptionLogs.length);
              }
            } else {
              if (isMounted) {
                setAverageConsumption(null);
              }
            }
          }
        } catch {
          // Errores silenciados
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      loadDashboardData();

      return () => {
        isMounted = false;
      };
    }, [user])
  );

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="caption" color="gray500">
              Bienvenido de vuelta,
            </Text>
            <Text variant="heading2" color="gray900" weight="700">
              {profileName}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.gray800} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Summary Card (Gradient) */}
        {activeVehicle ? (
        <TouchableOpacity
          onPress={() => router.push("/reports" as any)}
          activeOpacity={0.9}
          style={styles.summaryCardContainer}
        >
          <Card variant="primary" style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <Text variant="caption" color="white" style={styles.cardSubtitle}>
                Gastos Últimos 30 Días
              </Text>
              <Text variant="display" color="white" weight="700" style={styles.cardTitle}>
                {formatCOP(monthlySpent)}
              </Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardVehicleInfo}>
              <View style={styles.vehicleRow}>
                <Ionicons
                  name={activeVehicle.propulsion === "electric" ? "flash-outline" : "water-outline"}
                  size={16}
                  color={Colors.white}
                  style={styles.cardIcon}
                />
                <Text variant="caption" color="white" weight="600">
                  {activeVehicle.custom_brand} {activeVehicle.custom_model} • {activeVehicle.plate || "Sin Placa"}
                </Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text variant="smallLabel" color="white" style={styles.opacityLabel}>
                    Kilometraje
                  </Text>
                  <Text variant="caption" color="white" weight="700">
                    {currentOdometer.toLocaleString("es-CO")} km
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="smallLabel" color="white" style={styles.opacityLabel}>
                    Consumo Promedio
                  </Text>
                  <Text variant="caption" color="white" weight="700">
                    {averageConsumption
                      ? `${averageConsumption.toFixed(1)} ${activeVehicle.propulsion === "electric" ? "km/kWh" : "km/gal"}`
                      : `-- ${activeVehicle.propulsion === "electric" ? "km/kWh" : "km/gal"}`}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
        ) : (
          /* Empty State: No active vehicle */
          <Card variant="secondary" style={styles.emptyVehicleCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="car-outline" size={32} color={Colors.primary500} />
            </View>
            <Text variant="heading2" color="gray900" weight="700" align="center" style={styles.emptyTitle}>
              No tienes vehículos registrados
            </Text>
            <Text variant="body" color="gray600" align="center" style={styles.emptySubtitle}>
              Registra tu primer carro o moto para comenzar a monitorear tus consumos y gastos financieros.
            </Text>
            <Button
              title="Registrar mi primer vehículo"
              onPress={() => router.push("/vehicle-new")}
              style={styles.emptyCardButton}
            />
          </Card>
        )}

        {/* Quick Actions Section (only active if vehicle is registered) */}
        <View style={styles.section}>
          <Text variant="sectionTitle" color="gray900" style={styles.sectionTitle}>
            Acciones Rápidas
          </Text>
          <View style={[styles.quickActionsGrid, !activeVehicle && { opacity: 0.5 }]}>
            <TouchableOpacity
              disabled={!activeVehicle}
              onPress={() => router.push(activeVehicle?.propulsion === "electric" ? "/electric-charge-new" : "/fuel-log-new")}
              style={styles.quickActionItem}
            >
              <View style={styles.quickActionIconContainer}>
                <Ionicons name={activeVehicle?.propulsion === "electric" ? "flash-outline" : "water-outline"} size={24} color={Colors.primary500} />
              </View>
              <Text variant="smallLabel" color="gray700" align="center" style={styles.quickActionLabel}>
                {activeVehicle?.propulsion === "electric" ? "Carga" : "Tanqueo"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!activeVehicle}
              onPress={() => router.push("/maintenance-new")}
              style={styles.quickActionItem}
            >
              <View style={styles.quickActionIconContainer}>
                <Ionicons name="build-outline" size={24} color={Colors.primary500} />
              </View>
              <Text variant="smallLabel" color="gray700" align="center" style={styles.quickActionLabel}>
                Talleres
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!activeVehicle}
              onPress={() => router.push("/tax-new")}
              style={styles.quickActionItem}
            >
              <View style={styles.quickActionIconContainer}>
                <Ionicons name="document-text-outline" size={24} color={Colors.primary500} />
              </View>
              <Text variant="smallLabel" color="gray700" align="center" style={styles.quickActionLabel}>
                Impuestos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!activeVehicle}
              onPress={() => router.push("/other-expense-new")}
              style={styles.quickActionItem}
            >
              <View style={styles.quickActionIconContainer}>
                <Ionicons name="cube-outline" size={24} color={Colors.primary500} />
              </View>
              <Text variant="smallLabel" color="gray700" align="center" style={styles.quickActionLabel}>
                Otros
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity Section */}
        {activeVehicle && (
          <View style={styles.section}>
            <Text variant="sectionTitle" color="gray900" style={styles.sectionTitle}>
              Historial Reciente
            </Text>

            {recentLogs.length > 0 ? (
              <Card variant="secondary" style={styles.transactionsCard}>
                {recentLogs.map((log, index) => (
                  <React.Fragment key={`${log.record_type}-${log.id}`}>
                    <TouchableOpacity
                      style={styles.transactionRow}
                      onPress={() => router.push(`/${log.record_type === 'fuel' ? 'fuel-log' : log.record_type === 'electric-charge' ? 'electric-charge' : log.record_type === 'maintenance' ? 'maintenance' : log.record_type === 'tax' ? 'tax' : 'other-expense'}/${log.id}` as any)}
                    >
                      <View style={styles.transIconContainer}>
                        {log.record_type === 'fuel' && <Ionicons name="water-outline" size={20} color={Colors.primary500} />}
                        {log.record_type === 'electric-charge' && <Ionicons name="flash-outline" size={20} color={Colors.primary500} />}
                        {log.record_type === 'maintenance' && <Ionicons name="build-outline" size={20} color={Colors.primary500} />}
                        {log.record_type === 'tax' && <Ionicons name="document-text-outline" size={20} color={Colors.primary500} />}
                        {log.record_type === 'other-expense' && <Ionicons name="cube-outline" size={20} color={Colors.primary500} />}
                      </View>
                      <View style={styles.transInfo}>
                        <Text variant="body" color="gray900" weight="600">
                          {log.record_type === 'fuel'
                            ? (log.full_tank ? "Tanqueo Lleno" : "Carga Parcial")
                            : log.record_type === 'electric-charge'
                            ? "Carga Eléctrica"
                            : log.record_type === 'maintenance'
                            ? log.type
                            : log.record_type === 'tax'
                            ? (log.type === "soat" ? "SOAT" : log.type === "tax" ? "Impuesto" : "Documento")
                            : log.description}
                        </Text>
                        <Text variant="caption" color="gray500">
                          {log.date}
                          {log.record_type === 'fuel' && ` • ${parseFloat(log.gallons).toFixed(2)} gal`}
                          {log.record_type === 'electric-charge' && ` • ${parseFloat(log.kwh_charged).toFixed(1)} kWh`}
                          {log.record_type === 'maintenance' && ` • ${log.odometer} km`}
                        </Text>
                      </View>
                      <View style={styles.transAmount}>
                        <Text variant="body" color="danger" weight="600">
                          -{formatCOP(parseFloat(log.amount_cop))}
                        </Text>
                        {log.record_type === 'fuel' && log.consumption_km_gal && (
                          <Text variant="smallLabel" color="success" weight="600">
                            {parseFloat(log.consumption_km_gal).toFixed(1)} km/gal
                          </Text>
                        )}
                        {log.record_type === 'electric-charge' && log.consumption_km_kwh && (
                          <Text variant="smallLabel" color="success" weight="600">
                            {parseFloat(log.consumption_km_kwh).toFixed(1)} km/kWh
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    {index < recentLogs.length - 1 && <View style={styles.rowDivider} />}
                  </React.Fragment>
                ))}
              </Card>
            ) : (
              /* Empty state logs */
              <Card variant="secondary" style={styles.emptyLogsCard}>
                <Ionicons name="receipt-outline" size={32} color={Colors.gray400} style={styles.emptyLogsIcon} />
                <Text variant="body" color="gray600" align="center">
                  Aún no has registrado ningún gasto para este vehículo.
                </Text>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  loadingArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.gray50,
  },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Layout.verticalRhythm,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  summaryCardContainer: {
    marginBottom: Layout.verticalRhythm,
  },
  summaryCard: {
    marginBottom: 0,
  },
  cardHeader: {
    width: "100%",
  },
  cardSubtitle: {
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: 28,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: Spacing.md,
  },
  cardVehicleInfo: {
    gap: Spacing.sm,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    marginRight: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  statItem: {
    flex: 1,
  },
  opacityLabel: {
    opacity: 0.7,
    marginBottom: 2,
  },
  emptyVehicleCard: {
    padding: 24,
    alignItems: "center",
    marginBottom: Layout.verticalRhythm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    marginBottom: Spacing.lg,
    lineHeight: 20,
    color: Colors.gray600,
  },
  emptyCardButton: {
    width: "100%",
  },
  section: {
    marginBottom: Layout.verticalRhythm,
  },
  sectionTitle: {
    marginBottom: Layout.sectionGap,
    fontWeight: "700",
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: 72,
    alignItems: "center",
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.card,
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontWeight: "600",
  },
  proFeature: {
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    elevation: 0,
    shadowOpacity: 0,
  },
  transactionsCard: {
    paddingVertical: Spacing.xs,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: Spacing.sm,
  },
  transIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  transInfo: {
    flex: 1,
  },
  transAmount: {
    alignItems: "flex-end",
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginLeft: 56,
  },
  emptyLogsCard: {
    padding: 24,
    alignItems: "center",
  },
  emptyLogsIcon: {
    marginBottom: Spacing.sm,
  },
  emptyLogsButton: {
    marginTop: Spacing.md,
    height: 40,
    borderColor: Colors.primary500,
  },
});
