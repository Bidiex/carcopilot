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
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function OtherExpenseEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [dateStr, setDateStr] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // Errors state
  const [dateError, setDateError] = useState("");
  const [descError, setDescError] = useState("");
  const [amountError, setAmountError] = useState("");

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

      // 2. Fetch record
      const { data: record, error } = await supabase
        .from("other_expenses")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error || !record) throw error;

      setDateStr(record.date);
      setDescription(record.description || "");
      setAmount(record.amount_cop.toString());
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

  const handleUpdate = async () => {
    if (!user || !id) return;
    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("other_expenses")
        .update({
          date: dateStr,
          description: description.trim(),
          amount_cop: parseFloat(amount),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        showAlert("Error de Actualización", error.message, [], "error");
      } else {
        showAlert(
          "Actualización Exitosa",
          "El registro de gasto ha sido modificado.",
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
      "¿Estás seguro de que deseas eliminar este registro de gasto permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from("other_expenses")
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
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color={Colors.gray900} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text variant="heading2" color="gray900" weight="700">
              Editar Gasto
            </Text>
            {activeVehicle && (
              <Text variant="smallLabel" color="gray500">
                {activeVehicle.custom_brand} {activeVehicle.custom_model}
              </Text>
            )}
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Input
            label="Fecha (AAAA-MM-DD) *"
            value={dateStr}
            onChangeText={setDateStr}
            error={dateError}
          />

          <Input
            label="Descripción del Gasto *"
            value={description}
            onChangeText={setDescription}
            error={descError}
          />

          <Input
            label="Monto Pagado (COP) *"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            error={amountError}
          />

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
  submitButton: { marginTop: Spacing.md, marginBottom: Spacing.xl },
});
