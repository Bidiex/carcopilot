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
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { supabase } from "@/lib/supabase";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function OtherExpenseNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [fetchingVehicle, setFetchingVehicle] = useState(true);

  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);

  // Errors state
  const [dateError, setDateError] = useState("");
  const [descError, setDescError] = useState("");
  const [amountError, setAmountError] = useState("");

  useEffect(() => {
    if (user) {
      const fetchActiveVehicle = async () => {
        try {
          const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .limit(1)
            .single();

          if (error || !data) {
            setActiveVehicle(null);
          } else {
            setActiveVehicle(data);
          }
        } catch {
          setActiveVehicle(null);
        } finally {
          setFetchingVehicle(false);
        }
      };

      fetchActiveVehicle();
    }
  }, [user]);

  const validate = () => {
    let isValid = true;
    setDateError("");
    setDescError("");
    setAmountError("");

    if (!dateStr.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      setDateError("Formato de fecha inválido (AAAA-MM-DD)");
      isValid = false;
    }

    if (!description.trim()) {
      setDescError("La descripción es requerida");
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

    return isValid;
  };

  const handleCreate = async () => {
    if (!user || !activeVehicle) return;
    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("other_expenses").insert({
        vehicle_id: activeVehicle.id,
        user_id: user.id,
        date: dateStr,
        description: description.trim(),
        amount_cop: parseFloat(amount),
      });

      if (error) {
        showAlert("Error de Registro", error.message, [], "error");
      } else {
        showAlert(
          "Gasto Registrado",
          "El gasto se ha guardado correctamente.",
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

  if (fetchingVehicle) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </SafeAreaView>
    );
  }

  if (!activeVehicle) {
    return (
      <SafeAreaView style={styles.errorArea}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text variant="heading2" color="gray900" weight="700" align="center" style={styles.errorTitle}>
          No tienes vehículos activos
        </Text>
        <Text variant="body" color="gray600" align="center" style={styles.errorText}>
          Necesitas registrar un vehículo antes de poder ingresar otros gastos.
        </Text>
        <Button
          title="Registrar Vehículo"
          onPress={() => router.replace("/vehicle-new")}
          style={styles.errorButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text variant="heading2" color="gray900" weight="700">
              Registrar Otro Gasto
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
          <Input
            label="Fecha (AAAA-MM-DD) *"
            placeholder="Ej: 2026-06-15"
            value={dateStr}
            onChangeText={setDateStr}
            error={dateError}
          />

          <Input
            label="Descripción del Gasto *"
            placeholder="Ej: Peajes, Parqueadero, Lavada, etc."
            value={description}
            onChangeText={setDescription}
            error={descError}
          />

          <Input
            label="Monto Pagado (COP) *"
            placeholder="Ej: 15000"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            error={amountError}
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
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
