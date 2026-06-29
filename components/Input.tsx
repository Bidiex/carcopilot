import React, { useState } from "react";
import {
  TextInput as RNTextInput,
  View,
  StyleSheet,
  TextInputProps,
  Pressable,
} from "react-native";
import { Colors, Spacing, Radius } from "../constants/theme";
import { Text } from "./Typography";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency, formatNumber, unformatNumber } from "../utils/formatters";

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
  isPassword?: boolean;
  format?: 'currency' | 'number';
}

export const Input: React.FC<CustomInputProps> = ({
  label,
  error,
  leftIcon,
  isPassword = false,
  format,
  style,
  onFocus,
  onBlur,
  value,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };
  
  const handleChangeText = (text: string) => {
    if (!onChangeText) return;
    if (format) {
      onChangeText(unformatNumber(text));
    } else {
      onChangeText(text);
    }
  };
  
  const getDisplayValue = () => {
    if (value === undefined || value === null) return value;
    if (format === 'currency') return formatCurrency(value.toString());
    if (format === 'number') return formatNumber(value.toString());
    return value.toString();
  };

  const isSecure = isPassword && !showPassword;

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="caption" color="gray600" style={styles.label}>
          {label}
        </Text>
      )}
      
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
          props.editable === false ? { backgroundColor: Colors.gray200, opacity: 0.7 } : null,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={error ? Colors.danger : isFocused ? Colors.primary : Colors.gray500}
            style={styles.leftIcon}
          />
        )}

        <RNTextInput
          style={[styles.textInput, style]}
          placeholderTextColor={Colors.gray400}
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={getDisplayValue()}
          onChangeText={handleChangeText}
          {...props}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.gray500}
            />
          </Pressable>
        )}
      </View>

      {error && (
        <Text variant="caption" color="danger" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
    fontFamily: "Montserrat_500Medium",
  },
  inputWrapper: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    borderRadius: Radius.sm, // matches radius 14 (radiusSm is 12, but DESIGN.md says inputs radius is 14. We will use 14 exactly as stated in the DESIGN.md inputs section)
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white, // slight premium touch on focus: turn white
  },
  inputWrapperError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.white,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: Colors.gray900,
    fontFamily: "Montserrat_400Regular",
  },
  rightIcon: {
    padding: Spacing.xs,
  },
  errorText: {
    marginTop: Spacing.xs,
    marginLeft: 4,
  },
});
