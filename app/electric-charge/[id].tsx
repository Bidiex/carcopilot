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
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const CHARGE_TYPES = [
  { label: "Carga Lenta (Slow)", value: "slow" },
  { label: "Carga Rápida (Fast)", value: "fast" },
  { label: "Carga Domiciliaria (Home)", value: "home" },
];

export default function ElectricChargeEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [dateStr, setDateStr] = useState("");
  const [odometer, setOdometer] = useState("");
  const [kwhCharged, setKwhCharged] = useState("");
  const [amount, setAmount] = useState("");
  const [batteryPctStart, setBatteryPctStart] = useState("");
  const [batteryPctEnd, setBatteryPctEnd] = useState("");
  const [chargeType, setChargeType] = useState("home");

  // Errors state
  const [dateError, setDateError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [kwhError, setKwhError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [batteryStartError, setBatteryStartError] = useState("");
  const [batteryEndError, setBatteryEndError] = useState("");

  useEffect(() => {
    if (user && id) {
      loadData();
    }
  }, [user, id]);

  const loadData = async () => {
    try {
      // 1. Fetch active vehicle
      const { data: vData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .single();
      if (vData) setActiveVehicle(vData);

      // 2. Fetch charge log
      const { data: record, error } = await supabase
        .from("electric_charge_logs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error || !record) throw error;

      setDateStr(record.date);
      setOdometer(record.odometer.toString());
      setKwhCharged(record.kwh_charged.toString());
      setAmount(record.amount_cop.toString());
      setBatteryPctStart(record.battery_pct_start ? record.battery_pct_start.toString() : "");
      setBatteryPctEnd(record.battery_pct_end ? record.battery_pct_end.toString() : "");
      setChargeType(record.charge_type || "home");
    } catch {
      showAlert(
        "Error",
        "No se pudo cargar el registro.",
        [{ text: "Volver", onPress: () => router.back() }],
        "error"
      );
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handleUpdate = async () => {
    if (!user || !activeVehicle || !id) return;
    if (!validate()) return;

    const currentOdo = parseFloat(odometer);
    const currentKwh = parseFloat(kwhCharged);
    const currentAmount = parseFloat(amount);

    setLoading(true);

    try {
      if (currentOdo <= activeVehicle.initial_odometer) {
        setOdometerError(`Debe ser mayor al odómetro inicial (${activeVehicle.initial_odometer} km)`);
        setLoading(false);
        return;
      }

      // Validar con registros PREVIOS al que estamos editando
      const { data: previousLogs } = await supabase
        .from("electric_charge_logs")
        .select("odometer")
        .eq("vehicle_id", activeVehicle.id)
        .lt("odometer", currentOdo)
        .order("odometer", { ascending: false })
        .limit(1);

      let baselineOdo = activeVehicle.initial_odometer;
      if (previousLogs && previousLogs.length > 0) {
        const latestOdo = parseFloat(previousLogs[0].odometer);
        if (currentOdo <= latestOdo && latestOdo !== parseFloat(odometer)) {
          setOdometerError(`Debe ser mayor al odómetro anterior (${latestOdo} km)`);
          setLoading(false);
          return;
        }
        baselineOdo = latestOdo;
      }

      const totalKm = currentOdo - baselineOdo;
      const calculatedConsumption = totalKm / currentKwh;

      const { error } = await supabase
        .from("electric_charge_logs")
        .update({
          date: dateStr,
          odometer: currentOdo,
          kwh_charged: currentKwh,
          amount_cop: currentAmount,
          battery_pct_start: batteryPctStart ? parseInt(batteryPctStart) : null,
          battery_pct_end: batteryPctEnd ? parseInt(batteryPctEnd) : null,
          charge_type: chargeType,
          consumption_km_kwh: calculatedConsumption,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        showAlert("Error de Actualización", error.message, [], "error");
      } else {
        showAlert(
          "Actualización Exitosa",
          "El registro de carga ha sido modificado.",
          [{ text: "Excelente", onPress: () => router.back() }],
          "success"
        );
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado al actualizar", [], "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert(
      "Eliminar Registro",
      "¿Estás seguro de que deseas eliminar este registro de carga permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from("electric_charge_logs")
                .delete()
                .eq("id", id)
                .eq("user_id", user?.id);

              if (error) throw error;

              router.back();
            } catch {
              showAlert("Error", "No se pudo eliminar el registro", [], "error");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      "warning"
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text variant="heading2" color="gray900" weight="700">
              Editar Carga
            </Text>
            {activeVehicle && (
              <Text variant="smallLabel" color="gray500">
                {activeVehicle.custom_brand} {activeVehicle.custom_model}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Select
            label="Tipo de Carga *"
            placeholder="Seleccionar..."
            value={chargeType}
            options={CHARGE_TYPES}
            onSelect={setChargeType}
          />

          <Input
            label="Fecha (AAAA-MM-DD) *"
            value={dateStr}
            onChangeText={setDateStr}
            error={dateError}
          />

          <Input
            label="Odómetro Actual (Kilometraje) *"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            error={odometerError}
          />

          <Input
            label="Cantidad de Energía (kWh) *"
            value={kwhCharged}
            onChangeText={setKwhCharged}
            keyboardType="numeric"
            error={kwhError}
          />

          <Input
            label="Costo Total (COP) *"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
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
            title="Actualizar Registro"
            onPress={handleUpdate}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.gray50 },
  loadingArea: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.gray50 },
  keyboardView: { flex: 1 },
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
  backButton: { width: 44, height: 44, justifyContent: "center" },
  deleteButton: { width: 44, height: 44, justifyContent: "center", alignItems: "flex-end" },
  headerTitleContainer: { alignItems: "center" },
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  submitButton: { marginTop: Spacing.md, marginBottom: Spacing.xl },
});
