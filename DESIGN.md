---
name: mobile-banking-design-system
description: Sistema de diseño oficial para aplicaciones React Native inspiradas en fintech modernas con estética premium, gradientes azules-violeta, superficies suaves, componentes redondeados y jerarquía visual enfocada en información financiera. Usar siempre que se creen pantallas, componentes, layouts, estilos o decisiones visuales del proyecto.
version: 1.0
owner: product-design
---

# Mobile Banking Design System

## Purpose

Este documento es la fuente de verdad absoluta para cualquier decisión visual dentro del proyecto.

Ningún componente debe introducir estilos arbitrarios.

Toda pantalla debe reutilizar:

- Tokens de color
- Escala tipográfica
- Sistema de espaciado
- Radios
- Sombras
- Layouts
- Componentes definidos aquí

El objetivo es mantener una experiencia consistente, premium, limpia y moderna.

---

# Design Philosophy

## Visual Personality

La interfaz comunica:

- Confianza
- Tecnología
- Seguridad financiera
- Simplicidad
- Elegancia

Inspiraciones:

- Revolut
- Nubank
- Monzo
- Current
- Modern Banking Apps
- iOS Human Interface Guidelines

---

# Core Visual Principles

## Principle 1

Las tarjetas son el protagonista visual.

Toda información importante vive dentro de Cards.

Nunca usar grandes bloques de texto flotando sobre fondo blanco.

---

## Principle 2

Los bordes redondeados dominan toda la interfaz.

Evitar esquinas duras.

---

## Principle 3

El color principal solo debe utilizarse para:

- Acciones primarias
- Estados activos
- Datos financieros importantes

---

## Principle 4

Mucho espacio en blanco.

La UI nunca debe sentirse comprimida.

---

## Principle 5

Jerarquía basada en:

1. Tamaño
2. Peso tipográfico
3. Color
4. Espaciado

Nunca depender únicamente del color.

---

# Color System

## Primary Brand

```ts
primary500 = "#4D4DFF"
primary600 = "#3E3EFF"
primary700 = "#3434F5"
```

---

## Primary Gradient

Gradiente oficial.

```ts
gradientStart = "#6366FF"
gradientMiddle = "#5858FF"
gradientEnd = "#4343F5"
```

React Native:

```tsx
["#6366FF", "#5858FF", "#4343F5"]
```

Direction:

```tsx
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

---

## Neutrals

```ts
white = "#FFFFFF"

gray50 = "#FAFAFA"
gray100 = "#F5F5F7"
gray200 = "#EFEFF2"
gray300 = "#E4E4E7"
gray400 = "#C7C7CC"
gray500 = "#9A9AA0"
gray600 = "#707078"
gray700 = "#505057"
gray800 = "#2D2D33"
gray900 = "#17171C"
```

---

## Success

```ts
success = "#2ECC71"
```

---

## Danger

```ts
danger = "#FF4D4F"
```

---

## Warning

```ts
warning = "#F5A623"
```

---

# Typography

## Font Family

Fuente oficial del proyecto:
Montserrat (Google Fonts — instalada localmente vía @expo-google-fonts/montserrat)

Variantes instaladas:
- Montserrat_400Regular  → body, caption
- Montserrat_500Medium   → bodyMd, label
- Montserrat_600SemiBold → h2, h3
- Montserrat_700Bold     → h1, display

Nunca usar fontWeight como número suelto. Siempre usar fontFamily con la variante correcta.

En React Native, fontWeight sin la variante correcta de fuente no aplica en iOS.

---

## Display

Balance Numbers

```ts
fontSize: 34
fontWeight: "700"
lineHeight: 40
```

---

## Heading 1

```ts
fontSize: 24
fontWeight: "700"
lineHeight: 30
```

---

## Heading 2

```ts
fontSize: 20
fontWeight: "600"
lineHeight: 26
```

---

## Section Title

```ts
fontSize: 16
fontWeight: "600"
lineHeight: 22
```

---

## Body

```ts
fontSize: 14
fontWeight: "400"
lineHeight: 20
```

---

## Caption

```ts
fontSize: 12
fontWeight: "400"
lineHeight: 16
```

---

## Small Label

```ts
fontSize: 10
fontWeight: "500"
lineHeight: 14
```

---

# Spacing System

ÚNICA escala permitida.

```ts
0
4
8
12
16
20
24
32
40
48
64
```

Alias:

```ts
xs = 4
sm = 8
md = 16
lg = 24
xl = 32
xxl = 48
```

---

# Border Radius

## Radius Scale

```ts
radiusXs = 8
radiusSm = 12
radiusMd = 16
radiusLg = 20
radiusXl = 24
radiusFull = 999
```

---

## Rules

Cards:

```ts
20
```

Buttons:

```ts
14
```

Inputs:

```ts
14
```

Floating buttons:

```ts
999
```

---

# Shadows

## Card Shadow

```ts
shadowColor: "#000"
shadowOpacity: 0.05
shadowRadius: 16
shadowOffset:
{
 width:0,
 height:4
}
elevation: 4
```

---

## Floating Shadow

```ts
shadowColor:"#000"
shadowOpacity:0.12
shadowRadius:20
shadowOffset:
{
 width:0,
 height:8
}
elevation:8
```

---

# Layout System

## Screen Padding

Toda pantalla:

```ts
paddingHorizontal: 20
```

---

## Vertical Rhythm

Separación entre bloques:

```ts
24
```

---

## Section Gap

```ts
16
```

---

# Card System

## Primary Financial Card

Características:

```ts
borderRadius:24
padding:20
gradientBackground:true
```

Altura recomendada:

```ts
180 - 220
```

Uso:

- Balance
- Wallet
- Account
- Credit Summary

---

## Secondary Card

```ts
backgroundColor:"#FFF"
borderRadius:20
padding:16
```

Uso:

- Quick actions
- Settings
- Transactions

---

# Buttons

## Primary Button

```ts
height:52
borderRadius:14
backgroundColor:primary500
```

Texto:

```ts
fontSize:16
fontWeight:"600"
color:"#FFF"
```

---

## Ghost Button

```ts
backgroundColor:"transparent"
```

Borde:

```ts
1px solid rgba(255,255,255,.25)
```

---

## Quick Action Button

```ts
width:72
height:72
borderRadius:18
```

Layout:

```ts
icon
8px gap
label
```

---

# Icons

Librería oficial: Lucide React Native

Instalación: lucide-react-native + react-native-svg
Estilo: Outline

strokeWidth estándar: 1.5 (premium) — nunca usar el default de 2 en íconos decorativos
strokeWidth 2.0: solo para íconos de acción primaria o énfasis

Tamaños estándar:
- 16 → íconos dentro de badges o chips
- 20 → íconos secundarios, navegación inactiva
- 24 → íconos estándar de UI
- 28 → íconos de acción destacada

Uso correcto:
```tsx
import { Car, Fuel, Wrench, Bell, ChevronRight } from 'lucide-react-native'
<Car size={24} color={Colors.primary} strokeWidth={1.5} />
```

Color de íconos:
- Activo / primario: Colors.primary (#4D4DFF)
- Secundario / inactivo: Colors.gray400
- Sobre fondo oscuro / gradiente: Colors.white
- Peligro: Colors.danger
- Éxito: Colors.success

Nunca usar:
- Íconos sólidos (fill)
- Íconos 3D
- Íconos multicolor
- strokeWidth mayor a 2

---

# Navigation

## Bottom Tab Bar

Altura:

```ts
72
```

Background:

```ts
#FFFFFF
```

Top Border:

```ts
#EFEFF2
```

Icon Active:

```ts
primary500
```

Icon Inactive:

```ts
gray400
```

Label:

```ts
10px
```

---

# Transaction Lists

## Row Height

```ts
64
```

Layout:

LEFT

- Icon

CENTER

- Title
- Subtitle

RIGHT

- Amount
- Status

---

## Positive Amount

```ts
color: success
fontWeight:"600"
```

---

## Negative Amount

```ts
color: danger
fontWeight:"600"
```

---

# Inputs

Height:

```ts
52
```

Radius:

```ts
14
```

Background:

```ts
gray100
```

Padding:

```ts
16
```

Focus:

```ts
borderColor: primary500
borderWidth: 1
```

---

# Component Composition Rules

## Rule 1

Nunca más de 3 niveles visuales de profundidad.

---

## Rule 2

Máximo 2 colores principales por pantalla.

---

## Rule 3

Una sola acción primaria visible por viewport.

---

## Rule 4

Toda pantalla debe iniciar con:

- Header
- Summary Card
- Content Sections

---

## Rule 5

Las métricas financieras deben usar:

```ts
fontWeight:700
```

---

# React Native Style Tokens

```ts
export const Colors = {
  primary:"#4D4DFF",
  success:"#2ECC71",
  danger:"#FF4D4F",
  warning:"#F5A623",

  white:"#FFFFFF",

  gray50:"#FAFAFA",
  gray100:"#F5F5F7",
  gray200:"#EFEFF2",
  gray300:"#E4E4E7",
  gray400:"#C7C7CC",
  gray500:"#9A9AA0",
  gray600:"#707078",
  gray700:"#505057",
  gray800:"#2D2D33",
  gray900:"#17171C"
}

export const Spacing = {
  xs:4,
  sm:8,
  md:16,
  lg:24,
  xl:32,
  xxl:48
}

export const Radius = {
  sm:12,
  md:16,
  lg:20,
  xl:24,
  full:999
}
```

---

## Dependencies de diseño

### Design Dependencies

Estas son las dependencias que sostienen el sistema de diseño. Nunca removerlas.

| Dependencia | Versión | Propósito |
|---|---|---|
| `@expo-google-fonts/montserrat` | latest compatible con SDK 54 | Tipografía oficial |
| `expo-font` | ~14.0.x | Carga de fuentes locales |
| `lucide-react-native` | latest | Librería de íconos oficial |
| `react-native-svg` | compatible con SDK 54 | Requerido por `lucide-react-native` |
| `expo-linear-gradient` | compatible con SDK 54 | Gradientes en cards primarias |

> **Nota:** `expo-linear-gradient` debe instalarse cuando se implementen las Primary Financial Cards con gradiente. Comando: `npx expo install expo-linear-gradient`

---

# Design Compliance Checklist

Antes de aprobar una pantalla verificar:

- Usa únicamente colores definidos.
- Usa únicamente spacing tokens.
- Usa únicamente radius tokens.
- Mantiene padding horizontal de 20.
- Mantiene separación vertical de 24.
- Usa cards como contenedores principales.
- No introduce sombras personalizadas.
- No introduce tamaños tipográficos fuera de escala.
- Respeta la jerarquía financiera.
- Conserva el look premium fintech.

Si alguna regla falla, la implementación debe considerarse incorrecta.