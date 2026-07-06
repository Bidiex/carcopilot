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
import { Plus, Trash2, Wrench } from "lucide-react-native";
import { ChronologyWarningModal } from "@/components/ChronologyWarningModal";
import { checkChronologyBreak } from "@/lib/chronology";
import { MAINTENANCE_CATEGORIES, MOTO_MAINTENANCE_CATEGORIES } from "@/constants/maintenance";
import { useActionGuard } from "@/hooks/useActionGuard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { MaintenanceItem } from "@/types/app";

export default function MaintenanceNewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { guardAction, showUpgradeModal, closeUpgradeModal } = useActionGuard();

  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;
  const [loading, setLoading] = useState(false);
  const [fetchingVehicle, setFetchingVehicle] = useState(true);

  const { data: lastOdo } = useLastOdometer(activeVehicle?.id);

  // Section 1 State
  const [date, setDate] = useState(getColombiaDateString());
  const [odometer, setOdometer] = useState("");
  const [taller, setTaller] = useState("");
  const [notes, setNotes] = useState("");

  const [dateError, setDateError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [itemsError, setItemsError] = useState("");
  const [showChronologyModal, setShowChronologyModal] = useState(false);

  // Section 2 State
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([
    { category: "", item: "", cost: 0, notes: null }
  ]);

  const totalAmount = maintenanceItems.reduce((sum, i) => sum + (Number(i.cost) || 0), 0);

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

  function addItem() {
    setMaintenanceItems(prev => [...prev, { category: "", item: "", cost: 0, notes: null }]);
  }

  function removeItem(index: number) {
    if (maintenanceItems.length <= 1) return;
    setMaintenanceItems(prev => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof MaintenanceItem, value: any) {
    setMaintenanceItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }

  const validate = () => {
    let isValid = true;
    setDateError("");
    setOdometerError("");
    setItemsError("");

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setDateError("Fecha inválida (AAAA-MM-DD)");
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

    let hasItemError = false;
    for (let i = 0; i < maintenanceItems.length; i++) {
      const item = maintenanceItems[i];
      const costNum = Number(item.cost);
      if (!item.category || !item.item || isNaN(costNum) || costNum <= 0) {
        hasItemError = true;
        break;
      }
    }

    if (hasItemError) {
      setItemsError("Verifica que todos los trabajos tengan categoría, componente y valor (mayor a 0).");
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
        odometer: parseFloat(odometer),
        total_amount_cop: totalAmount,
        description: notes.trim() || null,
        taller: taller.trim() || null,
        items: maintenanceItems,
        type: maintenanceItems[0]?.item || null,
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
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
        <SafeAreaView edges={["left", "right", "bottom"]} style={styles.loadingArea}>
          <ActivityIndicator size="large" color={Colors.primary500} />
        </SafeAreaView>
      </View>
    );
  }

  const getCategoriesList = () => {
    return activeVehicle?.type === 'moto' ? MOTO_MAINTENANCE_CATEGORIES : MAINTENANCE_CATEGORIES;
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const canSave = maintenanceItems.some(i => i.category && i.item && i.cost > 0) && odometer && date;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={{ flex: 0, backgroundColor: Colors.primary500 }} />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
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

            <Input
              label="Kilometraje Actual *"
              placeholder="Ej: 24500"
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

            <View style={styles.tallerInputContainer}>
              <View style={styles.tallerIconBox}>
                <Wrench color={Colors.gray500} size={20} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Taller (Opcional)"
                  placeholder="Nombre del taller o mecánico"
                  value={taller}
                  onChangeText={setTaller}
                />
              </View>
            </View>

            <Input
              label="Notas Generales (Opcional)"
              placeholder="Ej: Revisión de 30.000 km..."
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.divider} />

            <Text variant="heading3" color="gray900" weight="700" style={styles.sectionTitle}>
              Trabajos Realizados
            </Text>

            {itemsError ? (
              <Text variant="caption" color="danger" style={styles.globalError}>
                {itemsError}
              </Text>
            ) : null}

            {maintenanceItems.map((item, index) => {
              const currentCategory = getCategoriesList().find(c => c.name === item.category || c.id === item.category);
              return (
                <View key={`item-${index}`} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text variant="smallLabel" color="gray600" weight="600">
                      Trabajo {index + 1}
                    </Text>
                    {maintenanceItems.length > 1 && (
                      <TouchableOpacity onPress={() => removeItem(index)} hitSlop={10}>
                        <Trash2 color={Colors.danger} size={18} strokeWidth={1.5} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Select
                    label="Categoría *"
                    placeholder="Seleccionar categoría..."
                    value={item.category}
                    options={getCategoriesList().map(c => ({ label: c.name, value: c.id }))}
                    onSelect={(val) => {
                      updateItem(index, "category", val);
                      updateItem(index, "item", "");
                    }}
                  />

                  <Select
                    label="Componente o Servicio *"
                    placeholder="Seleccionar ítem..."
                    value={item.item}
                    options={currentCategory ? currentCategory.items.map(i => ({ label: i, value: i })) : []}
                    onSelect={(val) => updateItem(index, "item", val)}
                  />

                  <Input
                    label="Valor (COP) *"
                    placeholder="Ej: 180000"
                    value={item.cost === 0 ? "" : item.cost.toString()}
                    onChangeText={(val) => {
                      // Fix unformatting for state
                      const unformatted = val ? parseFloat(val.replace(/[^\d]/g, '')) || 0 : 0;
                      updateItem(index, "cost", unformatted);
                    }}
                    keyboardType="numeric"
                    format="currency"
                  />

                  <Input
                    label="Notas específicas (Opcional)"
                    placeholder="Ej: Marca Bosch"
                    value={item.notes || ""}
                    onChangeText={(val) => updateItem(index, "notes", val)}
                  />
                </View>
              );
            })}

            <TouchableOpacity style={styles.addButton} onPress={addItem} activeOpacity={0.7}>
              <Plus color={Colors.primary600} size={20} strokeWidth={1.5} />
              <Text variant="body" color="primary600" weight="600" style={styles.addButtonText}>
                Agregar trabajo
              </Text>
            </TouchableOpacity>

            <View style={styles.totalContainer}>
              <Text variant="body" color="gray600" weight="600">Total a Pagar:</Text>
              <Text variant="heading2" color="primary600" weight="700">
                {formatCOP(totalAmount)}
              </Text>
            </View>

            <Button
              title="Guardar Mantenimiento"
              onPress={() => guardAction(handleCreate)}
              loading={loading}
              disabled={!canSave}
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
  tallerInputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tallerIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  globalError: {
    marginBottom: Spacing.sm,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary50,
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary100,
    borderStyle: "dashed",
  },
  addButtonText: {
    marginLeft: 6,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginBottom: Spacing.xl,
  },
});
