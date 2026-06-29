export const Colors = {
  primary: "#4D4DFF",
  primary50: "#EDEDFF",
  primary200: "#B3B3FF",
  primary500: "#4D4DFF",
  primary600: "#3E3EFF",
  primary700: "#3434F5",
  primary800: "#1E1E99",
  primary900: "#0A0A33",

  gradientStart: "#6366FF",
  gradientMiddle: "#5858FF",
  gradientEnd: "#4343F5",
  primaryGradient: ["#6366FF", "#5858FF", "#4343F5"] as const,

  white: "#FFFFFF",

  gray50: "#FAFAFA",
  gray100: "#F5F5F7",
  gray200: "#EFEFF2",
  gray300: "#E4E4E7",
  gray400: "#C7C7CC",
  gray500: "#9A9AA0",
  gray600: "#707078",
  gray700: "#505057",
  gray800: "#2D2D33",
  gray900: "#17171C",

  success: "#2ECC71",
  success50: "#EAF9F0",
  success500: "#2ECC71",
  danger: "#FF4D4F",
  warning: "#F5A623",
  warning50: "#FEF6E9",
  warning500: "#F5A623",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  floating: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },
};

export const Typography = {
  h1: { fontFamily: "Montserrat_700Bold", fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: "Montserrat_600SemiBold", fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: "Montserrat_600SemiBold", fontSize: 16, lineHeight: 22 },
  body: { fontFamily: "Montserrat_400Regular", fontSize: 14, lineHeight: 20 },
  bodyMd: { fontFamily: "Montserrat_500Medium", fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: "Montserrat_400Regular", fontSize: 12, lineHeight: 16 },
  label: { fontFamily: "Montserrat_500Medium", fontSize: 10, lineHeight: 14 },
  display: { fontFamily: "Montserrat_700Bold", fontSize: 34, lineHeight: 40 },

  // Mapeos de retrocompatibilidad con los componentes existentes
  heading1: { fontFamily: "Montserrat_700Bold", fontSize: 24, lineHeight: 30 },
  heading2: { fontFamily: "Montserrat_600SemiBold", fontSize: 20, lineHeight: 26 },
  sectionTitle: { fontFamily: "Montserrat_600SemiBold", fontSize: 16, lineHeight: 22 },
  smallLabel: { fontFamily: "Montserrat_500Medium", fontSize: 10, lineHeight: 14 },
};

export const typography = Typography;

export const Layout = {
  screenPadding: 20,
  verticalRhythm: 24,
  sectionGap: 16,
};
