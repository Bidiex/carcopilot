import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  StyleProp,
} from "react-native";
import { Colors, Spacing } from "../constants/theme";
import { Text } from "./Typography";
import { Ionicons } from "@expo/vector-icons";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isButtonDisabled = disabled || loading;

  const buttonStyles = [
    styles.baseButton,
    styles[`${variant}Button` as const],
    disabled && !loading && styles.disabledButton,
    loading && { opacity: 0.7 },
    style,
  ];

  const getTextColor = (): keyof typeof Colors => {
    if (disabled && !loading) return "gray400";
    if (variant === "primary") return "white";
    if (variant === "ghost") return "primary500";
    return "primary500";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isButtonDisabled}
      style={buttonStyles}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? Colors.white : Colors.primary500}
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={20}
              color={Colors[getTextColor()] as any}
              style={styles.icon}
            />
          )}
          <Text
            variant="body"
            weight="600"
            color={getTextColor()}
            style={[styles.text, textStyle]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 52,
    borderRadius: 14, // Matches radius 14 explicitly defined for buttons in DESIGN.md
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: Colors.primary500,
  },
  secondaryButton: {
    backgroundColor: Colors.gray100,
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.gray200,
  },
  disabledButton: {
    backgroundColor: Colors.gray100,
    borderColor: "transparent",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    fontSize: 16,
  },
});
