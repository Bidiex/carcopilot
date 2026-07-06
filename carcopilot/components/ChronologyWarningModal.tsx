import React from "react";
import { Modal, StyleSheet, View, TouchableWithoutFeedback } from "react-native";
import { Text } from "./Typography";
import { Button } from "./Button";
import { Colors, Spacing, Radius, Layout, Shadows } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";

interface ChronologyWarningModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ChronologyWarningModal({
  visible,
  onCancel,
  onConfirm,
}: ChronologyWarningModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={32} color={Colors.warning500} />
              </View>
              
              <Text variant="heading2" color="gray900" weight="700" align="center" style={styles.title}>
                Este registro rompe el orden cronológico
              </Text>
              
              <Text variant="body" color="gray600" align="center" style={styles.message}>
                La fecha y el odómetro de este registro no coinciden con el orden de tus otros registros. Esto es normal si olvidaste registrar algo anteriormente. ¿Deseas continuar?
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  title="Revisar de nuevo"
                  onPress={onCancel}
                  variant="ghost"
                  style={styles.button}
                />
                <Button
                  title="Guardar de todas formas"
                  onPress={onConfirm}
                  style={[styles.button, { backgroundColor: Colors.warning500, borderColor: Colors.warning500 }]}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Layout.screenPadding,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...Shadows.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.warning50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  message: {
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    width: "100%",
    gap: Spacing.sm,
  },
  button: {
    width: "100%",
  },
});
