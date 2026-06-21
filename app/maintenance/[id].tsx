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
import { useLastOdometer } from "@/hooks/useLastOdometer";
import { Text } from "@/components/Typography";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { Colors, Spacing, Layout, Radius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ChronologyWarningModal } from "@/components/ChronologyWarningModal";
import { checkChronologyBreak } from "@/lib/chronology";

import { MAINTENANCE_CATEGORIES, getCategoryByItem } from "@/constants/maintenance";

export default function MaintenanceEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<any>(null);

  const { data: lastOdo } = useLastOdometer(activeVehicle?.id, { id: id as string, type: "maintenance" });

  const [date, setDate] = useState("");
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
    if (user && id) {
      loadData();
    }
  }, [user, id]);

  const loadData = async () => {
    try {
      // Fetch vehicle limits for validation
      const { data: vData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .single();
      
      if (vData) setActiveVehicle(vData);

      // Fetch existing maintenance record
      const { data: record, error } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("id", id)
        .eq("user_id", user?.id)
        .single();

      if (error || !record) throw error;

      setDate(record.date);
      const cat = getCategoryByItem(record.type);
      setCategory(cat || "otros");
      setItem(record.type);
      setObservations(record.description || "");
      setAmount(record.amount_cop.toString());
      setOdometer(record.odometer.toString());

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

  const executeUpdate = async () => {
    if (!user || !id) return;

    setLoading(true);
    setShowChronologyModal(false);

    try {
      const { error } = await supabase
        .from("maintenance_logs")
        .update({
          date,
          type: item,
          description: observations.trim(),
          amount_cop: parseFloat(amount),
          odometer: parseFloat(odometer),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        showAlert("Error", error.message, [], "error");
      } else {
        showAlert(
          "Actualización Exitosa",
          "Mantenimiento actualizado correctamente.",
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

  const handleUpdate = async () => {
    if (!user || !id) return;
    if (!validate()) return;

    setLoading(true);
    const currentOdo = parseFloat(odometer);
    const check = await checkChronologyBreak(activeVehicle?.id, date, currentOdo, id as string);
    
    if (check.breaksChronology) {
      setLoading(false);
      setShowChronologyModal(true);
      return;
    }
    
    await executeUpdate();
  };

  const handleDelete = () => {
    showAlert(
      "Eliminar Registro",
      "¿Estás seguro de que deseas eliminar este mantenimiento permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from("maintenance_logs")
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
          <Text variant="heading2" color="gray900" weight="700">
            Editar Mantenimiento
          </Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
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
            title="Actualizar Registro"
            onPress={handleUpdate}
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ChronologyWarningModal
        visible={showChronologyModal}
        onCancel={() => setShowChronologyModal(false)}
        onConfirm={executeUpdate}
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
  deleteButton: { width: 44, height: 44, justifyContent: "center", alignItems: "flex-end" },
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
