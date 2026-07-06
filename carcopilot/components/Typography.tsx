import React from "react";
import { Text as RNText, StyleSheet, TextProps, TextStyle } from "react-native";
import { Typography as TypographyStyles, Colors } from "../constants/theme";

export type TypographyVariant =
  | "display"
  | "heading1"
  | "heading2"
  | "sectionTitle"
  | "body"
  | "caption"
  | "smallLabel";

interface CustomTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof typeof Colors | string;
  align?: "left" | "center" | "right" | "justify";
  weight?: TextStyle["fontWeight"];
}

export const Text: React.FC<CustomTextProps> = ({
  children,
  variant = "body",
  color = "gray900",
  align = "left",
  weight,
  style,
  ...props
}) => {
  const variantStyle = TypographyStyles[variant];
  
  // Determinar color
  const textColor = (Colors[color as keyof typeof Colors] || color) as any;

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const targetWeight = weight || flattenedStyle.fontWeight;

  let finalFontFamily = variantStyle?.fontFamily || "Montserrat_400Regular";

  if (targetWeight) {
    const weightStr = String(targetWeight).toLowerCase();
    if (weightStr === "700" || weightStr === "bold") {
      finalFontFamily = "Montserrat_700Bold";
    } else if (weightStr === "600" || weightStr === "semibold") {
      finalFontFamily = "Montserrat_600SemiBold";
    } else if (weightStr === "500" || weightStr === "medium") {
      finalFontFamily = "Montserrat_500Medium";
    } else if (weightStr === "400" || weightStr === "normal") {
      finalFontFamily = "Montserrat_400Regular";
    }
  }

  const finalStyle = {
    ...variantStyle,
    color: textColor,
    textAlign: align,
    ...flattenedStyle,
    fontFamily: finalFontFamily,
  };

  // Eliminamos fontWeight suelto para que el renderizador nativo use la variante cargada en fontFamily
  delete finalStyle.fontWeight;

  return (
    <RNText style={finalStyle} {...props}>
      {children}
    </RNText>
  );
};
