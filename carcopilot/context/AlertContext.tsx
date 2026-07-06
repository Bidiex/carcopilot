import React, { createContext, useContext, useState } from "react";
import { Modal, View, StyleSheet, TouchableWithoutFeedback, Animated, ViewStyle } from "react-native";
import { Colors, Spacing, Radius, Shadows } from "../constants/theme";
import { Text } from "../components/Typography";
import { Button } from "../components/Button";
import { Ionicons } from "@expo/vector-icons";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export type AlertType = "success" | "error" | "warning" | "info";

interface AlertContextType {
  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: AlertType
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttons, setButtons] = useState<AlertButton[]>([]);
  const [type, setType] = useState<AlertType>("info");

  const showAlert = (
    newTitle: string,
    newMessage: string = "",
    newButtons?: AlertButton[],
    newType: AlertType = "info"
  ) => {
    setTitle(newTitle);
    setMessage(newMessage);
    setType(newType);

    if (newButtons && newButtons.length > 0) {
      setButtons(newButtons);
    } else {
      // Default button if none provided
      setButtons([{ text: "Entendido", style: "default" }]);
    }

    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  const handleButtonPress = (onPress?: () => void) => {
    hideAlert();
    if (onPress) {
      // Small timeout to allow modal animation to complete before running callback
      setTimeout(() => {
        onPress();
      }, 100);
    }
  };

  const getIconConfig = () => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle-outline", color: Colors.success, bg: "rgba(46, 204, 113, 0.1)" };
      case "error":
        return { name: "close-circle-outline", color: Colors.danger, bg: "rgba(255, 77, 79, 0.1)" };
      case "warning":
        return { name: "alert-circle-outline", color: Colors.warning, bg: "rgba(245, 166, 35, 0.1)" };
      case "info":
      default:
        return { name: "information-circle-outline", color: Colors.primary500, bg: "rgba(77, 77, 255, 0.1)" };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={hideAlert}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.alertCard}>
            {/* Icon Banner */}
            <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
              <Ionicons name={iconConfig.name as any} size={32} color={iconConfig.color} />
            </View>

            {/* Content */}
            <Text variant="heading2" color="gray900" weight="700" align="center" style={styles.title}>
              {title}
            </Text>
            {message ? (
              <Text variant="body" color="gray600" align="center" style={styles.message}>
                {message}
              </Text>
            ) : null}

            {/* Buttons Stack */}
            <View style={styles.buttonStack}>
              {buttons.map((btn, index) => {
                let variant: "primary" | "secondary" | "ghost" = "primary";
                let btnStyle: ViewStyle = {};

                if (btn.style === "cancel") {
                  variant = "ghost";
                } else if (btn.style === "destructive") {
                  variant = "primary";
                  btnStyle = { backgroundColor: Colors.danger };
                }

                return (
                  <Button
                    key={index}
                    title={btn.text}
                    variant={variant}
                    style={[styles.alertButton, btnStyle]}
                    onPress={() => handleButtonPress(btn.onPress)}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert debe ser usado dentro de un AlertProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(23, 23, 28, 0.4)", // Gray900 transparent overlay
  },
  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg, // Matches radiusLg = 20 from DESIGN.md
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    ...Shadows.floating, // Premium shadow
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  message: {
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  buttonStack: {
    width: "100%",
    gap: Spacing.sm,
  },
  alertButton: {
    height: 48, // slightly more compact buttons for alert modal
  },
});
