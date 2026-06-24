import React, { useState, useEffect } from "react";
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

import { MAINTENANCE_CATEGORIES } from "@/constants/maintenance";

export default function MaintenanceNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;
  const [loading, setLoading] = useState(false);
  const [fetchingVehicle, setFetchingVehicle] = useState(true);

  const { data: lastOdo } = useLastOdometer(activeVehicle?.id);

  const [date, setDate] = useState(getColombiaDateString());
  const [category, setCategory] = useState("");
  const [item, setItem] = useState("");
  const [observations, setObservations] = useState("");
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");

  const [dateError, setDateError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [itemError, setItemError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [showChronologyModal, setShowChronologyModal] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchVehicles = async () => {
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("user_id", user.id);

        if (!error && data && data.length > 0) {
          setVehicles(data);
          const initialId = vehicleId || data.find((v: any) => v.is_active)?.id || data[0].id;
          setSelectedVehicleId(initialId);
        } else {
          showAlert(
            "Vehículo requerido",
            "Debes tener un vehículo activo para registrar mantenimientos.",
            [{ text: "Entendido", onPress: () => router.back() }],
            "warning"
          );
        }
      };

      fetchVehicles().finally(() => setFetchingVehicle(false));
    } else {
      setFetchingVehicle(false);
    }
  }, [user, vehicleId]);

  const validate = () => {
    let isValid = true;
    setDateError("");
    setCategoryError("");
    setItemError("");
    setAmountError("");
    setOdometerError("");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setDateError("Fecha inválida (AAAA-MM-DD)");
      isValid = false;
    }

    if (!category) {
      setCategoryError("Selecciona una categoría");
      isValid = false;
    }

    if (!item) {
      setItemError("Selecciona el componente o servicio");
      isValid = false;
    }

    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      setAmountError("Ingresa un valor válido");
      isValid = false;
    }

    const odoNum = parseFloat(odometer);
    if (!odometer || isNaN(odoNum) || odoNum < 0) {
      setOdometerError("Ingresa un kilometraje válido");
      isValid = false;
    } else if (activeVehicle && odoNum < activeVehicle.initial_odometer) {
      setOdometerError(`No puede ser menor al inicial (${activeVehicle.initial_odometer} km)`);
      isValid = false;
    }

    return isValid;
  };

  const executeCreate = async () => {
    if (!user || !activeVehicle) return;

    setLoading(true);
    setShowChronologyModal(false);

    try {
      const { error } = await supabase.from("maintenance_logs").insert({
        user_id: user.id,
        vehicle_id: activeVehicle.id,
        date,
        type: item,
        description: observations.trim(),
        amount_cop: parseFloat(amount),
        odometer: parseFloat(odometer),
      });

      if (error) {
        showAlert("Error", error.message, [], "error");
      } else {
        showAlert(
          "Registro Exitoso",
          "Mantenimiento guardado correctamente.",
          [{ text: "Excelente", onPress: () => router.back() }],
          "success"
        );
      }
    } catch {
      showAlert("Error", "Ocurrió un error inesperado al guardar", [], "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !activeVehicle) return;
    if (!validate()) return;

    setLoading(true);
    const currentOdo = parseFloat(odometer);
    const check = await checkChronologyBreak(activeVehicle.id, date, currentOdo);
    
    if (check.breaksChronology) {
      setLoading(false);
      setShowChronologyModal(true);
      return;
    }
    
    await executeCreate();
  };

  if (fetchingVehicle) {
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
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <Text variant="heading2" color="gray900" weight="700">
            Registrar Mantenimiento
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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

          <Input
            label="Fecha (AAAA-MM-DD) *"
            value={date}
            onChangeText={setDate}
            keyboardType="number-pad"
            error={dateError}
          />

          <Select
            label="Categoría *"
            placeholder="Seleccionar categoría..."
            value={category}
            options={MAINTENANCE_CATEGORIES.map(c => ({ label: c.name, value: c.id }))}
            onSelect={(val) => {
              setCategory(val);
              setItem("");
            }}
            error={categoryError}
          />

          <Select
            label="Componente o Servicio *"
            placeholder="Seleccionar ítem..."
            value={item}
            options={
              category
                ? MAINTENANCE_CATEGORIES.find(c => c.id === category)?.items.map(i => ({ label: i, value: i })) || []
                : []
            }
            onSelect={setItem}
            error={itemError}
          />

          <Input
            label="Observaciones (Opcional)"
            placeholder="Ej: Compradas en taller XYZ..."
            value={observations}
            onChangeText={setObservations}
          />

          <Input
            label="Valor Pagado (COP) *"
            placeholder="Ej: 180000"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            error={amountError}
          />

          <Input
            label="Kilometraje Actual *"
            placeholder="Ej: 24500"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
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

          <Button
            title="Guardar Registro"
            onPress={handleCreate}
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
  scrollContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.verticalRhythm,
    gap: Spacing.sm,
  },
  submitButton: { marginTop: Spacing.md, marginBottom: Spacing.xl },
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
