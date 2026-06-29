import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { supabase } from "@/lib/supabase";
import { getColombiaDateString } from "@/lib/date";
import { useLastOdometer } from "@/hooks/useLastOdometer";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ChronologyWarningModal } from "@/components/ChronologyWarningModal";
import { checkChronologyBreak } from "@/lib/chronology";
import { recalculateConsumption } from "@/lib/consumption";
import { useActionGuard } from "@/hooks/useActionGuard";
import { UpgradeModal } from "@/components/UpgradeModal";

const CHARGE_TYPES = [
  { label: "Carga Lenta (Slow)", value: "slow" },
  { label: "Carga Rápida (Fast)", value: "fast" },
  { label: "Carga Domiciliaria (Home)", value: "home" },
];

export default function ElectricChargeNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { guardAction, showUpgradeModal, closeUpgradeModal } = useActionGuard();

  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [fetchingVehicle, setFetchingVehicle] = useState(true);

  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;

  const { data: lastOdo } = useLastOdometer(activeVehicle?.id);

  const [dateStr, setDateStr] = useState(getColombiaDateString());
  const [odometer, setOdometer] = useState("");
  const [kwhCharged, setKwhCharged] = useState("");
  const [amount, setAmount] = useState("");
  const [batteryPctStart, setBatteryPctStart] = useState("");
  const [batteryPctEnd, setBatteryPctEnd] = useState("");
  const [chargeType, setChargeType] = useState("home");

  const [loading, setLoading] = useState(false);

  // Errors state
  const [dateError, setDateError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [kwhError, setKwhError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [batteryStartError, setBatteryStartError] = useState("");
  const [batteryEndError, setBatteryEndError] = useState("");
  const [showChronologyModal, setShowChronologyModal] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchVehicles = async () => {
        try {
          const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .eq("user_id", user.id);

          if (!error && data && data.length > 0) {
            setVehicles(data);
            const initialId = vehicleId || data.find((v: any) => v.is_active)?.id || data[0].id;
            setSelectedVehicleId(initialId);
          }
        } finally {
          setFetchingVehicle(false);
        }
      };

      fetchVehicles();
    }
  }, [user, vehicleId]);

  const validate = () => {
    let isValid = true;
    setDateError("");
    setOdometerError("");
    setKwhError("");
    setAmountError("");
    setBatteryStartError("");
    setBatteryEndError("");

    if (!dateStr.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setDateError("Formato de fecha inválido (AAAA-MM-DD)");
      isValid = false;
    }

    const odoNum = parseFloat(odometer);
    if (!odometer) {
      setOdometerError("El odómetro es requerido");
      isValid = false;
    } else if (isNaN(odoNum) || odoNum < 0) {
      setOdometerError("El odómetro no puede ser negativo");
      isValid = false;
    }

    const kwhNum = parseFloat(kwhCharged);
    if (!kwhCharged) {
      setKwhError("Los kWh cargados son requeridos");
      isValid = false;
    } else if (isNaN(kwhNum) || kwhNum <= 0) {
      setKwhError("Los kWh deben ser mayores a 0");
      isValid = false;
    }

    const amtNum = parseFloat(amount);
    if (!amount) {
      setAmountError("El monto es requerido");
      isValid = false;
    } else if (isNaN(amtNum) || amtNum <= 0) {
      setAmountError("El monto debe ser mayor a 0");
      isValid = false;
    }

    if (batteryPctStart) {
      const pStart = parseInt(batteryPctStart);
      if (isNaN(pStart) || pStart < 0 || pStart > 100) {
        setBatteryStartError("Debe ser un porcentaje entre 0 y 100");
        isValid = false;
      }
    }

    if (batteryPctEnd) {
      const pEnd = parseInt(batteryPctEnd);
      if (isNaN(pEnd) || pEnd < 0 || pEnd > 100) {
        setBatteryEndError("Debe ser un porcentaje entre 0 y 100");
        isValid = false;
      }

      if (batteryPctStart && batteryPctEnd) {
        const pStart = parseInt(batteryPctStart);
        if (pEnd < pStart) {
          setBatteryEndError("El porcentaje final debe ser mayor o igual al inicial");
          isValid = false;
        }
      }
    }

    return isValid;
  };

  const executeCreate = async () => {
    if (!user || !activeVehicle) return;

    const currentOdo = parseFloat(odometer);
    const currentKwh = parseFloat(kwhCharged);
    const currentAmount = parseFloat(amount);

    setLoading(true);
    setShowChronologyModal(false);

    try {

      const { error } = await supabase.from("electric_charge_logs").insert({
        vehicle_id: activeVehicle.id,
        user_id: user.id,
        date: dateStr,
        odometer: currentOdo,
        kwh_charged: currentKwh,
        amount_cop: currentAmount,
        battery_pct_start: batteryPctStart ? parseInt(batteryPctStart) : null,
        battery_pct_end: batteryPctEnd ? parseInt(batteryPctEnd) : null,
        charge_type: chargeType,
        consumption_km_kwh: null,
      });

      if (error) {
        showAlert("Error de Registro", error.message, [], "error");
      } else {
        recalculateConsumption(activeVehicle.id);
        showAlert(
          "Carga Registrada",
          `¡Carga guardada exitosamente! El rendimiento se actualizará automáticamente.`,
          [
            {
              text: "Entendido",
              onPress: () => {
                router.back();
              },
            },
          ],
          "success"
        );
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado al guardar el registro", [], "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !activeVehicle) return;
    if (!validate()) return;
    
    setLoading(true);
    const currentOdo = parseFloat(odometer);
    const check = await checkChronologyBreak(activeVehicle.id, dateStr, currentOdo);
    
    if (check.breaksChronology) {
      setLoading(false);
      setShowChronologyModal(true);
      return;
    }
    
    await executeCreate();
  };

  if (fetchingVehicle) {
    return (
      <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    </View>
    );
  }

  if (!activeVehicle) {
    return (
      <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.errorArea}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text variant="heading2" color="gray900" weight="700" align="center" style={styles.errorTitle}>
          No tienes vehículos activos
        </Text>
        <Text variant="body" color="gray600" align="center" style={styles.errorText}>
          Necesitas registrar un vehículo eléctrico antes de poder ingresar registros de carga.
        </Text>
        <Button
          title="Registrar Vehículo"
          onPress={() => router.replace("/vehicle-new")}
          style={styles.errorButton}
        />
      </SafeAreaView>
    </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text variant="heading2" color="gray900" weight="700">
              Registrar Carga
            </Text>
            <Text variant="smallLabel" color="gray500">
              {activeVehicle.custom_brand} {activeVehicle.custom_model} ({activeVehicle.plate || "Sin Placa"})
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {vehicles.length > 1 && (
            <Select
              label="Vehículo"
              value={selectedVehicleId || ""}
              options={vehicles.map((v: any) => ({
                label: `${v.custom_brand} ${v.custom_model} (${v.plate || "Sin Placa"})`,
                value: v.id
              }))}
              onSelect={setSelectedVehicleId}
            />
          )}

          <Select
            label="Tipo de Carga *"
            placeholder="Seleccionar..."
            value={chargeType}
            options={CHARGE_TYPES}
            onSelect={setChargeType}
          />

          <Input
            label="Fecha (AAAA-MM-DD) *"
            placeholder="Ej: 2026-06-15"
            value={dateStr}
            onChangeText={setDateStr}
            error={dateError}
          />

          <Input
            label="Odómetro Actual (Kilometraje) *"
            placeholder="Ej: 10550"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            format="number"
            error={odometerError}
          />

          {lastOdo !== null && (
            <View style={styles.odoBadge}>
              <Ionicons name="speedometer-outline" size={14} color={Colors.primary600} />
              <Text variant="caption" color="primary600" weight="600">
                Último registrado: {lastOdo.toLocaleString("es-CO")} km
              </Text>
            </View>
          )}

          <Input
            label="Cantidad de Energía (kWh) *"
            placeholder="Ej: 15.5"
            value={kwhCharged}
            onChangeText={setKwhCharged}
            keyboardType="numeric"
            error={kwhError}
          />

          <Input
            label="Costo Total (COP) *"
            placeholder="Ej: 45000"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            format="currency"
            error={amountError}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Batería Inicial (%)"
                placeholder="Ej: 20"
                value={batteryPctStart}
                onChangeText={setBatteryPctStart}
                keyboardType="numeric"
                error={batteryStartError}
              />
            </View>
            <View style={{ width: Spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input
                label="Batería Final (%)"
                placeholder="Ej: 80"
                value={batteryPctEnd}
                onChangeText={setBatteryPctEnd}
                keyboardType="numeric"
                error={batteryEndError}
              />
            </View>
          </View>

          <Button
            title="Guardar Registro"
            onPress={() => guardAction(handleCreate)}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ChronologyWarningModal
        visible={showChronologyModal}
        onCancel={() => setShowChronologyModal(false)}
        onConfirm={executeCreate}
      />
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={closeUpgradeModal}
        onUpgrade={() => { closeUpgradeModal(); router.push('/upgrade' as any); }}
      />
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary500 },
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
  errorArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    backgroundColor: Colors.gray50,
  },
  errorTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  errorText: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  errorButton: {
    width: "60%",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Layout.screenPadding,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  odoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
    gap: 4,
  },
});
