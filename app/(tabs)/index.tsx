import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getColombia30DaysAgoString } from "@/lib/date";
import { Text } from "@/components/Typography";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius, Shadows } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { VehiclePicker, VehiclePickerPill } from "@/components/VehiclePicker";

const VEHICLE_IMAGES: { [key: string]: any } = {
  "car_model1.webp": require("@/assets/cars/car_model1.webp"),
  "car_model2.webp": require("@/assets/cars/car_model2.webp"),
  "car_model3.webp": require("@/assets/cars/car_model3.webp"),
  "car_model4.webp": require("@/assets/cars/car_model4.webp"),
  "car_model5.webp": require("@/assets/cars/car_model5.webp"),
};

let dashboardCache: {
  vehicles: any[];
  recentLogs: any[];
  monthlySpent: number;
  currentOdometer: number;
  averageConsumption: number | null;
  profileName: string;
} | null = null;

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Clear cache if user switched
  const lastUserIdRef = React.useRef<string | null>(null);
  if (user && lastUserIdRef.current !== user.id) {
    lastUserIdRef.current = user.id;
    dashboardCache = null;
  }

  const [profileName, setProfileName] = useState(dashboardCache?.profileName || user?.user_metadata?.name || "Conductor");
  const [vehicles, setVehicles] = useState<any[]>(dashboardCache?.vehicles || []);
  
  // Si hay caché y hay solo 1 vehículo, forzar que inicie seleccionado
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(() => {
    if (dashboardCache?.vehicles && dashboardCache.vehicles.length === 1) {
      return dashboardCache.vehicles[0].id;
    }
    return null;
  });
  
  const [pickerVisible, setPickerVisible] = useState(false);

  const [recentLogs, setRecentLogs] = useState<any[]>(dashboardCache?.recentLogs || []);
  const [monthlySpent, setMonthlySpent] = useState(dashboardCache?.monthlySpent || 0);
  const [currentOdometer, setCurrentOdometer] = useState(dashboardCache?.currentOdometer || 0);
  const [averageConsumption, setAverageConsumption] = useState<number | null>(dashboardCache?.averageConsumption ?? null);
  const [loading, setLoading] = useState(vehicles.length === 0);

  // Vehículo actualmente seleccionado (o el activo como fallback para acciones rápidas)
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) ?? null;
  const activeVehicle = vehicles.find(v => v.is_active) ?? vehicles[0] ?? null;
  // Para acciones rápidas, si hay uno seleccionado úsalo, si no el activo
  const actionVehicle = selectedVehicle ?? activeVehicle;
  
  // Modo "todos" (si hay 1 solo vehículo, desactivar modo todos y forzar el único activo)
  const isAllMode = vehicles.length > 1 ? selectedVehicleId === null : false;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!user) return;

      const loadDashboardData = async () => {
        try {
          // Si no hay vehículos cargados en estado, mostrar loading, de lo contrario cargar silenciosamente
          if (vehicles.length === 0) {
            setLoading(true);
          }

          // 1. Nombre del perfil
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.id)
            .single();
          if (isMounted && profile?.name) setProfileName(profile.name);

          // 2. Todos los vehículos del usuario
          const { data: vhs } = await supabase
            .from("vehicles")
            .select("*")
            .eq("user_id", user.id);

          if (!vhs || vhs.length === 0) {
            if (isMounted) {
              setVehicles([]);
              setRecentLogs([]);
              setMonthlySpent(0);
              setLoading(false);
            }
            return;
          }

          if (isMounted) {
            setVehicles(vhs);
            // Si hay exactamente 1 vehículo y selectedVehicleId es null, autoseleccionarlo
            if (vhs.length === 1 && selectedVehicleId === null) {
              setSelectedVehicleId(vhs[0].id);
            }
          }

          // 3. Determinar qué vehículos filtrar
          const activeId = selectedVehicleId || (vhs.length === 1 ? vhs[0].id : null);
          const vehicleIds = activeId ? [activeId] : vhs.map((v: any) => v.id);

          // 4. Últimos registros recientes
          const [fuelRes, maintRes, taxRes, chargeRes, otherRes] = await Promise.all([
            supabase.from("fuel_logs")
              .select("id, date, amount_cop, gallons, full_tank, consumption_km_gal, odometer, vehicle_id")
              .in("vehicle_id", vehicleIds).order("date", { ascending: false }).limit(5),
            supabase.from("maintenance_logs")
              .select("id, date, amount_cop, type, odometer, vehicle_id")
              .in("vehicle_id", vehicleIds).order("date", { ascending: false }).limit(5),
            supabase.from("annual_records")
              .select("id, issue_date, amount_cop, type, vehicle_id")
              .in("vehicle_id", vehicleIds).order("issue_date", { ascending: false }).limit(5),
            supabase.from("electric_charge_logs")
              .select("id, date, amount_cop, kwh_charged, odometer, consumption_km_kwh, vehicle_id")
              .in("vehicle_id", vehicleIds).order("date", { ascending: false }).limit(5),
            supabase.from("other_expenses")
              .select("id, date, amount_cop, description, vehicle_id")
              .in("vehicle_id", vehicleIds).order("date", { ascending: false }).limit(5),
          ]);

          const allLogs: any[] = [];
          if (fuelRes.data) allLogs.push(...fuelRes.data.map(l => ({ ...l, record_type: 'fuel' })));
          if (maintRes.data) allLogs.push(...maintRes.data.map(l => ({ ...l, record_type: 'maintenance' })));
          if (taxRes.data) allLogs.push(...taxRes.data.map(l => ({ ...l, record_type: 'tax', date: l.issue_date })));
          if (chargeRes.data) allLogs.push(...chargeRes.data.map(l => ({ ...l, record_type: 'electric-charge' })));
          if (otherRes.data) allLogs.push(...otherRes.data.map(l => ({ ...l, record_type: 'other-expense' })));

          allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const sliceLogs = allLogs.slice(0, 3);
          if (isMounted) setRecentLogs(sliceLogs);

          // 5. Gastos últimos 30 días
          const dateLimit = getColombia30DaysAgoString();

          const [mFuel, mMaint, mTax, mCharge, mOther] = await Promise.all([
            supabase.from("fuel_logs").select("amount_cop").in("vehicle_id", vehicleIds).gte("date", dateLimit),
            supabase.from("maintenance_logs").select("amount_cop").in("vehicle_id", vehicleIds).gte("date", dateLimit),
            supabase.from("annual_records").select("amount_cop").in("vehicle_id", vehicleIds).gte("issue_date", dateLimit),
            supabase.from("electric_charge_logs").select("amount_cop").in("vehicle_id", vehicleIds).gte("date", dateLimit),
            supabase.from("other_expenses").select("amount_cop").in("vehicle_id", vehicleIds).gte("date", dateLimit),
          ]);

          const total =
            (mFuel.data?.reduce((a, l) => a + parseFloat(l.amount_cop), 0) ?? 0) +
            (mMaint.data?.reduce((a, l) => a + parseFloat(l.amount_cop), 0) ?? 0) +
            (mTax.data?.reduce((a, l) => a + parseFloat(l.amount_cop), 0) ?? 0) +
            (mCharge.data?.reduce((a, l) => a + parseFloat(l.amount_cop), 0) ?? 0) +
            (mOther.data?.reduce((a, l) => a + parseFloat(l.amount_cop), 0) ?? 0);

          if (isMounted) setMonthlySpent(total);

          // 6. Odómetro y consumo
          const activeVehicleIdOrSingle = activeId;
          let odo = 0;
          let avg: number | null = null;

          if (activeVehicleIdOrSingle) {
            const targetVehicle = vhs.find((v: any) => v.id === activeVehicleIdOrSingle);

            const [hFuel, hMaint, hCharge] = await Promise.all([
              supabase.from("fuel_logs").select("odometer").eq("vehicle_id", activeVehicleIdOrSingle).order("odometer", { ascending: false }).limit(1),
              supabase.from("maintenance_logs").select("odometer").eq("vehicle_id", activeVehicleIdOrSingle).order("odometer", { ascending: false }).limit(1),
              supabase.from("electric_charge_logs").select("odometer").eq("vehicle_id", activeVehicleIdOrSingle).order("odometer", { ascending: false }).limit(1),
            ]);

            odo = targetVehicle?.initial_odometer ?? 0;
            if (hFuel.data?.[0]) odo = Math.max(odo, parseFloat(hFuel.data[0].odometer));
            if (hMaint.data?.[0]) odo = Math.max(odo, parseFloat(hMaint.data[0].odometer));
            if (hCharge.data?.[0]) odo = Math.max(odo, parseFloat(hCharge.data[0].odometer));
            if (isMounted) setCurrentOdometer(odo);

            // Consumo promedio
            if (targetVehicle?.propulsion === "electric") {
              const { data: cLogs } = await supabase.from("electric_charge_logs")
                .select("consumption_km_kwh").eq("vehicle_id", activeVehicleIdOrSingle)
                .not("consumption_km_kwh", "is", null);
              if (cLogs && cLogs.length > 0) {
                avg = cLogs.reduce((a, l) => a + parseFloat(l.consumption_km_kwh), 0) / cLogs.length;
                if (isMounted) setAverageConsumption(avg);
              } else {
                if (isMounted) setAverageConsumption(null);
              }
            } else {
              const { data: cLogs } = await supabase.from("fuel_logs")
                .select("consumption_km_gal").eq("vehicle_id", activeVehicleIdOrSingle)
                .not("consumption_km_gal", "is", null);
              if (cLogs && cLogs.length > 0) {
                avg = cLogs.reduce((a, l) => a + parseFloat(l.consumption_km_gal), 0) / cLogs.length;
                if (isMounted) setAverageConsumption(avg);
              } else {
                if (isMounted) setAverageConsumption(null);
              }
            }
          } else {
            if (isMounted) {
              setCurrentOdometer(0);
              setAverageConsumption(null);
            }
          }

          // Guardar caché en memoria
          dashboardCache = {
            vehicles: vhs,
            recentLogs: sliceLogs,
            monthlySpent: total,
            currentOdometer: odo,
            averageConsumption: avg,
            profileName: profile?.name || "Conductor",
          };

        } catch (e) {
          // silencioso
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      loadDashboardData();
      return () => { isMounted = false; };
    }, [user, selectedVehicleId])
  );

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  const hasVehicles = vehicles.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Vehicle Picker Modal */}
      <VehiclePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        vehicles={vehicles}
        selectedId={selectedVehicleId}
        showAll={vehicles.length > 1}
        onSelect={(id) => {
          setLoading(true);
          setSelectedVehicleId(id);
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="caption" color="gray500">Bienvenido de vuelta,</Text>
            <Text variant="heading2" color="gray900" weight="700">{profileName}</Text>
          </View>
          <View style={styles.headerRight}>
            {hasVehicles && vehicles.length > 1 && (
              <VehiclePickerPill
                vehicles={vehicles}
                selectedId={selectedVehicleId}
                showAll={true}
                onPress={() => setPickerVisible(true)}
              />
            )}
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.gray800} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Card */}
        {hasVehicles ? (
          <TouchableOpacity
            onPress={() => router.push("/reports" as any)}
            activeOpacity={0.9}
            style={styles.summaryCardContainer}
          >
            <Card variant="primary" style={styles.summaryCard}>
              <View style={[styles.cardHeader, !isAllMode && { maxWidth: "60%" }]}>
                <Text variant="caption" color="white" style={styles.cardSubtitle}>
                  Gastos Últimos 30 Días
                </Text>
                <Text variant="display" color="white" weight="700" style={styles.cardTitle}>
                  {formatCOP(monthlySpent)}
                </Text>
              </View>

              <View style={styles.cardDivider} />

              <View style={[styles.cardVehicleInfo, !isAllMode && { maxWidth: "60%" }]}>
                {/* Modo: todos los vehículos */}
                {isAllMode ? (
                  <View style={styles.vehicleRow}>
                    <Ionicons name="albums-outline" size={16} color={Colors.white} style={styles.cardIcon} />
                    <Text variant="caption" color="white" weight="600">
                      {vehicles.length} vehículos
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.vehicleRow}>
                      <Ionicons
                        name={selectedVehicle?.propulsion === "electric" ? "flash-outline" : "water-outline"}
                        size={16}
                        color={Colors.white}
                        style={styles.cardIcon}
                      />
                      <Text variant="caption" color="white" weight="600" numberOfLines={1}>
                        {selectedVehicle?.custom_brand} {selectedVehicle?.custom_model} • {selectedVehicle?.plate || "Sin Placa"}
                      </Text>
                    </View>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text variant="smallLabel" color="white" style={styles.opacityLabel}>Kilometraje</Text>
                        <Text variant="caption" color="white" weight="700">
                          {currentOdometer.toLocaleString("es-CO")} km
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text variant="smallLabel" color="white" style={styles.opacityLabel}>Consumo Promedio</Text>
                        <Text variant="caption" color="white" weight="700">
                          {averageConsumption
                            ? `${averageConsumption.toFixed(1)} ${selectedVehicle?.propulsion === "electric" ? "km/kWh" : "km/gal"}`
                            : `-- ${selectedVehicle?.propulsion === "electric" ? "km/kWh" : "km/gal"}`}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>

              {/* Absolute Vehicle Image overlay for premium look */}
              {!isAllMode && (selectedVehicle?.model_image || activeVehicle?.model_image) && (
                <Image
                  source={VEHICLE_IMAGES[selectedVehicle?.model_image || activeVehicle?.model_image]}
                  style={styles.cardCarOverlay}
                />
              )}
            </Card>
          </TouchableOpacity>
        ) : (
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
            <Button title="Registrar mi primer vehículo" onPress={() => router.push("/vehicle-new")} style={styles.emptyCardButton} />
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="sectionTitle" color="gray900" style={styles.sectionTitle}>
            Acciones Rápidas
          </Text>
          <View style={[styles.quickActionsGrid, !hasVehicles && { opacity: 0.5 }]}>
            <TouchableOpacity
              disabled={!hasVehicles}
              onPress={() => router.push(actionVehicle?.propulsion === "electric" ? "/electric-charge-new" : "/fuel-log-new")}
              style={styles.quickActionItem}
            >
              <View style={styles.quickActionIconContainer}>
                <Ionicons name={actionVehicle?.propulsion === "electric" ? "flash-outline" : "water-outline"} size={24} color={Colors.primary500} />
              </View>
              <Text variant="smallLabel" color="gray700" align="center" style={styles.quickActionLabel}>
                {actionVehicle?.propulsion === "electric" ? "Carga" : "Tanqueo"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity disabled={!hasVehicles} onPress={() => router.push("/maintenance-new")} style={styles.quickActionItem}>
              <View style={styles.quickActionIconContainer}>
                <Ionicons name="build-outline" size={24} color={Colors.primary500} />
              </View>
              <Text variant="smallLabel" color="gray700" align="center" style={styles.quickActionLabel}>Talleres</Text>
            </TouchableOpacity>

            <TouchableOpacity disabled={!hasVehicles} onPress={() => router.push("/tax-new")} style={styles.quickActionItem}>
              <View style={styles.quickActionIconContainer}>
                <Ionicons name="document-text-outline" size={24} color={Colors.primary500} />
              </View>
              <Text variant="smallLabel" color="gray700" align="center" style={styles.quickActionLabel}>Impuestos</Text>
            </TouchableOpacity>

            <TouchableOpacity disabled={!hasVehicles} onPress={() => router.push("/other-expense-new")} style={styles.quickActionItem}>
              <View style={styles.quickActionIconContainer}>
                <Ionicons name="cube-outline" size={24} color={Colors.primary500} />
              </View>
              <Text variant="smallLabel" color="gray700" align="center" style={styles.quickActionLabel}>Otros</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        {hasVehicles && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text variant="sectionTitle" color="gray900" style={styles.sectionTitle}>
                Historial Reciente
              </Text>
              <TouchableOpacity onPress={() => router.push("/history")}>
                <Text variant="body" color="primary500" weight="600">Ver todo</Text>
              </TouchableOpacity>
            </View>

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
                            : log.record_type === 'electric-charge' ? "Carga Eléctrica"
                            : log.record_type === 'maintenance' ? log.type
                            : log.record_type === 'tax' ? (log.type === "soat" ? "SOAT" : log.type === "tax" ? "Impuesto" : "Documento")
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
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray50 },
  scrollContainer: { paddingHorizontal: Layout.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Layout.verticalRhythm },
  headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  notificationButton: {
    width: 44, height: 44, borderRadius: Radius.sm, backgroundColor: Colors.white,
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.gray200,
  },
  summaryCardContainer: { marginBottom: Layout.verticalRhythm },
  summaryCard: { marginBottom: 0, position: "relative" },
  cardCarOverlay: {
    position: "absolute",
    right: -10,
    bottom: -15,
    width: 155,
    height: 105,
    resizeMode: "contain",
  },
  cardHeader: { width: "100%" },
  cardSubtitle: { opacity: 0.8, marginBottom: Spacing.xs },
  cardTitle: { fontSize: 28 },
  cardDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: Spacing.md },
  cardVehicleInfo: { gap: Spacing.sm },
  vehicleRow: { flexDirection: "row", alignItems: "center" },
  cardIcon: { marginRight: Spacing.sm }, // Updated gap: Spacing.sm (8) for a clean premium spacing
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.sm }, // Updated margin
  statItem: { flex: 1 },
  opacityLabel: { opacity: 0.7, marginBottom: 2 },
  emptyVehicleCard: { padding: 24, alignItems: "center", marginBottom: Layout.verticalRhythm },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.gray100, justifyContent: "center", alignItems: "center", marginBottom: Spacing.md },
  emptyTitle: { marginBottom: Spacing.xs },
  emptySubtitle: { marginBottom: Spacing.lg, lineHeight: 20, color: Colors.gray600 },
  emptyCardButton: { width: "100%" },
  section: { marginBottom: Layout.verticalRhythm },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Layout.sectionGap },
  sectionTitle: { marginBottom: 0, fontWeight: "700" },
  quickActionsGrid: { flexDirection: "row", justifyContent: "space-between" },
  quickActionItem: { width: 72, alignItems: "center" },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: Colors.gray200, // Replaced elevation/shadows with premium border to prevent Android rendering bugs
    marginBottom: Spacing.sm,
  },
  quickActionLabel: { fontWeight: "600" },
  transactionsCard: { paddingVertical: Spacing.xs },
  transactionRow: { flexDirection: "row", alignItems: "center", height: 64, paddingHorizontal: Spacing.sm },
  transIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.gray100, justifyContent: "center", alignItems: "center", marginRight: Spacing.md },
  transInfo: { flex: 1 },
  transAmount: { alignItems: "flex-end" },
  rowDivider: { height: 1, backgroundColor: Colors.gray100, marginLeft: 56 },
  emptyLogsCard: { padding: 24, alignItems: "center" },
  emptyLogsIcon: { marginBottom: Spacing.sm },
});
