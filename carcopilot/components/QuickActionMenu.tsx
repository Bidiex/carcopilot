import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadows, Spacing } from "@/constants/theme";
import { Text } from "@/components/Typography";

interface QuickActionMenuProps {
  onAction: (action: "fuel" | "charge" | "maintenance" | "tax" | "other") => void;
  disabled?: boolean;
  propulsionType?: "electric" | "combustion" | "hybrid";
  variant?: "default" | "light";
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({ 
  onAction, 
  disabled, 
  propulsionType = "combustion",
  variant = "default" 
}) => {
  const [visible, setVisible] = useState(false);

  const handleAction = (action: "fuel" | "charge" | "maintenance" | "tax" | "other") => {
    setVisible(false);
    onAction(action);
  };

  const isElectric = propulsionType === "electric";
  const isLight = variant === "light";

  return (
    <>
      <TouchableOpacity activeOpacity={0.7}
        style={[
          styles.fabButton, 
          isLight && { backgroundColor: Colors.white },
          disabled && { opacity: 0.5 }
        ]}
        disabled={disabled}
        onPress={() => setVisible(true)}
      >
        <Ionicons 
          name="add" 
          size={28} 
          color={isLight ? Colors.primary500 : Colors.white} 
        />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay}>
            <View style={styles.menuContainer}>
              <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={() => handleAction(isElectric ? "charge" : "fuel")}>
                <View style={[styles.iconBox, { backgroundColor: Colors.primary50 }]}>
                  <Ionicons name={isElectric ? "flash-outline" : "water-outline"} size={20} color={Colors.primary500} />
                </View>
                <Text variant="body" color="gray800" weight="600">{isElectric ? "Recarga" : "Tanqueo"}</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={() => handleAction("maintenance")}>
                <View style={[styles.iconBox, { backgroundColor: Colors.warning50 }]}>
                  <Ionicons name="build-outline" size={20} color={Colors.warning500} />
                </View>
                <Text variant="body" color="gray800" weight="600">Taller / Mto.</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={() => handleAction("tax")}>
                <View style={[styles.iconBox, { backgroundColor: Colors.success50 }]}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.success500} />
                </View>
                <Text variant="body" color="gray800" weight="600">Impuestos / SOAT</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} style={styles.menuItem} onPress={() => handleAction("other")}>
                <View style={[styles.iconBox, { backgroundColor: Colors.gray100 }]}>
                  <Ionicons name="cube-outline" size={20} color={Colors.gray700} />
                </View>
                <Text variant="body" color="gray800" weight="600">Otros Gastos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary500,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    marginTop: 100, // roughly below the header
    marginRight: Spacing.md,
    width: 220,
    ...Shadows.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
