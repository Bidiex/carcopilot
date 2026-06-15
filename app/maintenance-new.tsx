import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

const MAINTENANCE_TYPES = [
  { label: "Cambio de Aceite", value: "Aceite" },
  { label: "Frenos", value: "Frenos" },
  { label: "Llantas", value: "Llantas" },
  { label: "Correa de Distribución", value: "Correa" },
  { label: "Batería", value: "Bateria" },
  { label: "Suspensión", value: "Suspension" },
  { label: "Mantenimiento General", value: "General" },
  { label: "Otro", value: "Otro" },
];

export default function MaintenanceNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<any>(null);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");

  const [dateError, setDateError] = useState("");
  const [typeError, setTypeError] = useState("");
  const [descError, setDescError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [odometerError, setOdometerError] = useState("");

  useEffect(() => {
    if (user) fetchActiveVehicle();
  }, [user]);

  const fetchActiveVehicle = async () => {
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true)
      .single();
      
    if (data) {
      setActiveVehicle(data);
    } else {
      showAlert(
        "Vehículo requerido",
        "Activa un vehículo para registrar mantenimientos.",
        [{ text: "Volver", onPress: () => router.back() }],
        "warning"
      );
    }
  };

  const validate = () => {
    let isValid = true;
    setDateError("");
    setTypeError("");
    setDescError("");
    setAmountError("");
    setOdometerError("");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setDateError("Fecha inválida (AAAA-MM-DD)");
      isValid = false;
    }

    if (!type) {
      setTypeError("Selecciona el tipo de mantenimiento");
      isValid = false;
    }

    if (!description.trim()) {
      setDescError("Agrega una descripción del servicio");
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

  const handleCreate = async () => {
    if (!user || !activeVehicle) return;
    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("maintenance_logs").insert({
        user_id: user.id,
        vehicle_id: activeVehicle.id,
        date,
        type,
        description: description.trim(),
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
          <Text variant="heading2" color="gray900" weight="700">
            Registrar Mantenimiento
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Input
            label="Fecha (AAAA-MM-DD) *"
            value={date}
            onChangeText={setDate}
            keyboardType="number-pad"
            error={dateError}
          />

          <Select
            label="Tipo de Servicio *"
            placeholder="Seleccionar..."
            value={type}
            options={MAINTENANCE_TYPES}
            onSelect={setType}
            error={typeError}
          />

          <Input
            label="Descripción del trabajo *"
            placeholder="Ej: Cambio de pastillas delanteras..."
            value={description}
            onChangeText={setDescription}
            error={descError}
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

          <Button
            title="Guardar Registro"
            onPress={handleCreate}
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
});
