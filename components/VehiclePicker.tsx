import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/Typography";
import { Colors, Spacing, Radius, Shadows } from "@/constants/theme";

interface Vehicle {
  id: string;
  custom_brand?: string;
  custom_model?: string;
  plate?: string;
  propulsion?: string;
}

interface VehiclePickerProps {
  visible: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  selectedId: string | null; // null = "Todos"
  onSelect: (id: string | null) => void;
  showAll?: boolean; // whether to show the "All vehicles" option
}

export const VehiclePicker: React.FC<VehiclePickerProps> = ({
  visible,
  onClose,
  vehicles,
  selectedId,
  onSelect,
  showAll = true,
}) => {
  const handleSelect = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.sheetHeader}>
                <Text variant="sectionTitle" color="gray900" weight="600">
                  Seleccionar vehículo
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={22} color={Colors.gray600} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* "Todos" option */}
              {showAll && (
                <>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => handleSelect(null)}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons
                        name="albums-outline"
                        size={20}
                        color={Colors.primary500}
                      />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text variant="body" color="gray900" weight="600">
                        Todos los vehículos
                      </Text>
                    </View>
                    {selectedId === null && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.primary500}
                      />
                    )}
                  </TouchableOpacity>
                  <View style={styles.divider} />
                </>
              )}

              {/* Vehicle list */}
              <FlatList
                data={vehicles}
                keyExtractor={(item) => item.id}
                scrollEnabled={vehicles.length > 4}
                renderItem={({ item }) => {
                  const isSelected = selectedId === item.id;
                  const icon =
                    item.propulsion === "electric"
                      ? "flash-outline"
                      : "car-outline";
                  const label = [item.custom_brand, item.custom_model]
                    .filter(Boolean)
                    .join(" ");
                  const sublabel = item.plate || "Sin placa";

                  return (
                    <TouchableOpacity
                      style={[styles.option, isSelected && styles.optionActive]}
                      onPress={() => handleSelect(item.id)}
                    >
                      <View
                        style={[
                          styles.optionIcon,
                          isSelected && styles.optionIconActive,
                        ]}
                      >
                        <Ionicons
                          name={icon as any}
                          size={20}
                          color={
                            isSelected ? Colors.white : Colors.primary500
                          }
                        />
                      </View>
                      <View style={styles.optionInfo}>
                        <Text
                          variant="body"
                          color={isSelected ? "primary500" : "gray900"}
                          weight="600"
                        >
                          {label}
                        </Text>
                        <Text variant="caption" color="gray500">
                          {sublabel}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={Colors.primary500}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

/**
 * Pill button that opens the VehiclePicker modal.
 * Shows the selected vehicle name or "Todos" when selectedId is null.
 */
interface VehiclePickerPillProps {
  vehicles: Vehicle[];
  selectedId: string | null;
  onPress: () => void;
  showAll?: boolean;
}

export const VehiclePickerPill: React.FC<VehiclePickerPillProps> = ({
  vehicles,
  selectedId,
  onPress,
  showAll = true,
}) => {
  const selected = vehicles.find((v) => v.id === selectedId);
  const label =
    selectedId === null
      ? showAll
        ? "Todos"
        : vehicles[0]
        ? `${vehicles[0].custom_brand} ${vehicles[0].custom_model}`
        : "Vehículo"
      : selected?.plate || selected?.custom_model || "Vehículo";

  return (
    <TouchableOpacity style={styles.pill} onPress={onPress}>
      <Ionicons name="car-outline" size={15} color={Colors.primary500} />
      <Text
        variant="smallLabel"
        color="primary500"
        weight="600"
        style={styles.pillText}
      >
        {label}
      </Text>
      <Ionicons name="chevron-down" size={14} color={Colors.primary500} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: "hidden",
    ...Shadows.floating,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray100,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  optionActive: {
    backgroundColor: Colors.gray50,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  optionIconActive: {
    backgroundColor: Colors.primary500,
  },
  optionInfo: {
    flex: 1,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  pillText: {
    marginHorizontal: 2,
  },
});
