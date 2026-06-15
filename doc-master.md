# Documento Maestro — App de Vehículos
> *"Lo que no se mide no se mejora"*

---

## 1. Concepto

**Copiloto financiero de vehículos.**

Una app que permite a cualquier dueño de vehículo registrar, entender y anticipar todos los costos asociados a su(s) vehículo(s). No es un bloc de notas de gastos — es inteligencia aplicada al patrimonio sobre ruedas.

---

## 2. Mercado objetivo

**País:** Colombia (mercado inicial).

**Usuario principal:** Persona natural, dueña de uno o varios vehículos de combustión (motos, carros, camionetas), incluyendo conductores de plataformas como Uber e InDriver.

**Vehículos contemplados:**
- Motos (combustión y eléctricas)
- Carros (combustión y eléctricos)
- Camionetas / camioncitos
- Vehículos eléctricos ligeros *(soporte completo desde v1)*

---

## 3. Propuesta de valor

- Registro fácil y rápido de todos los gastos del vehículo
- Métricas de consumo real calculadas con datos propios del usuario
- Alertas proactivas antes de vencimientos (SOAT, tecnomecánica, impuestos)
- Consultas e inteligencia conversacional por voz
- Un agente de IA que no solo responde, sino que actúa dentro de la app

---

## 4. Modelo de negocio

**Freemium con suscripción Pro mensual.**

| Feature | Free | Pro |
|---|---|---|
| Vehículos | 1 | Ilimitados |
| Categoría gasolina | ✅ | ✅ |
| Todas las categorías | ❌ | ✅ |
| Registro manual | ✅ | ✅ |
| Registro por voz (IA) | ❌ | ✅ |
| Consultas a la IA | ❌ | ✅ |
| Alertas proactivas | ❌ | ✅ |
| Métricas avanzadas | ❌ | ✅ |
| Historial completo | ❌ | ✅ |

> La voz es el principal incentivo de upgrade: es más cómodo, más rápido y genuinamente diferente al registro manual.

---

## 5. Categorías de gasto

### ⛽ Gasolina *(combustión)* / ⚡ Carga eléctrica
Categoría Free. La más frecuente y el corazón del hábito de registro.

**Combustión:**
- Fecha
- Odómetro actual
- Galones cargados
- Valor pagado
- ¿Tanque lleno? (Sí / No)
- Ubicación de la estación *(captura automática por GPS — ver Data colectiva)*

**Eléctrico:**
- Fecha
- Odómetro actual
- kWh cargados
- Valor pagado
- % batería al iniciar carga
- % batería al terminar carga
- Tipo de carga (lenta / rápida / domiciliaria)

**Cálculo de consumo real — combustión:**
El método es "tanque lleno a tanque lleno". La app acumula galones de cargas parciales intermedias y calcula el consumo (km/gal) únicamente cuando el usuario registra un tanque lleno, cerrando el ciclo:

```
Consumo (km/gal) = km recorridos desde último lleno ÷ galones totales del período
```

**Cálculo de consumo real — eléctrico:**
```
Consumo (km/kWh) = km recorridos ÷ kWh cargados en el período
```

---

### 🔧 Mantenimiento *(Pro)*
Aceite, frenos, llantas, correa de distribución, etc.

- Fecha
- Tipo de mantenimiento
- Descripción
- Valor
- Odómetro actual

---

### 📋 SOAT *(Pro)*
Gasto anual. El foco es la alerta de vencimiento.

- Fecha de pago/expedición
- Fecha de vencimiento *(calculada automáticamente: fecha de pago + 1 año — no editable)*
- Valor pagado
- Aseguradora

**Indicador visual tipo semáforo:**
- 🟢 Verde: más de 60 días
- 🟡 Amarillo: entre 15 y 60 días
- 🔴 Rojo: menos de 15 días

---

### 🔩 Tecnomecánica *(Pro)*
Misma lógica que SOAT.

- Fecha de revisión/pago
- Fecha de vencimiento *(calculada automáticamente: fecha de revisión + 1 año — no editable)*
- Valor pagado
- CDA (centro de diagnóstico)

**Indicador visual tipo semáforo igual que SOAT.**

---

### 💰 Impuestos *(Pro)*
Impuesto vehicular anual. En Colombia tanto departamentos como municipios cobran impuestos vehiculares, por lo que se registra la entidad territorial receptora.

- Año gravable
- Fecha de pago
- Fecha de vencimiento *(calculada automáticamente: fecha de pago + 1 año — no editable)*
- Valor pagado
- Departamento *(selector — ej: Atlántico, Cundinamarca, Antioquia…)*
- Ciudad/municipio *(campo texto opcional — para identificar si es impuesto municipal)*
- Entidad receptora *(calculada del departamento/ciudad: "Gobernación de Atlántico" / "Alcaldía de Barranquilla")*

**Indicador visual tipo semáforo igual que SOAT.**

---

### 📦 Otros gastos *(Pro)*
Campo libre para gastos que no encajan en otras categorías.

- Fecha
- Descripción
- Valor

---

## 6. Pantallas y navegación

### Estructura general

Navegación inferior fija con **3 botones** (estilo tab bar):

```
[ 🏠 Inicio ]   [ 🚗 Vehículos ]   [ 👤 Cuenta ]
```

**Botón flotante de IA (FAB):**
Botón circular flotante posicionado en la esquina inferior derecha (por encima de la navbar), siempre visible en todas las pantallas. Acceso rápido a la pantalla de chat con la IA. Solo activo para usuarios Pro; usuarios Free ven el botón pero al tocarlo se les muestra la pantalla de upgrade.

```
                              [ 🤖 ]  ← FAB flotante
[ 🏠 Inicio ]  [ 🚗 Vehículos ]  [ 👤 Cuenta ]
```

Todo abre en **pantallas completas**. No hay modales de navegación.

---

### Onboarding *(solo primera vez, post sign up)*

1. Nombre del usuario
2. **Tipo de propulsión** — radio button: `Combustión` / `Eléctrico` *(bifurcación principal)*
3. Tipo de vehículo (moto / carro / camioneta / otro)
4. Marca — selección desde catálogo predefinido
5. Modelo — selección desde catálogo predefinido (filtrado por marca)
6. Año
7. **Placa** *(opcional para eléctricos sin placa)*

Validación automática de placa según tipo de vehículo:

| Tipo | Formato | Ejemplo | Obligatoria |
|---|---|---|---|
| Carro combustión | 3 letras + 3 números | ABC123 | Sí |
| Carro eléctrico | 3 letras + 3 números | ABC123 | Sí |
| Moto combustión | 3 letras + 2 números + 1 letra | WQB80E | Sí |
| Moto eléctrica | Sin placa frecuente | — | No |

8. **Si combustión:** Kilometraje inicial (odómetro)
9. **Si eléctrico:** Kilometraje inicial + capacidad de batería (kWh)

---

### 🏠 Inicio (Home)

**Parte superior:**
Selector de vehículo activo tipo dropdown/pill:
```
[ 🚗 Toyota Corolla 2018  ▼ ]
```
Al tocar despliega todos los vehículos registrados para cambiar rápidamente.

**Cuerpo:**
Métricas clave del vehículo activo (consumo promedio, gasto del mes, próximas alertas, etc.)

**Cuadrícula de categorías:**
```
[ ⛽ Gasolina ]     [ 🔧 Mantenimiento ]
[ 📋 SOAT ]         [ 🔩 Tecnomecánica ]
[ 💰 Impuestos ]    [ 📦 Otros ]
```

**Botón de registro rápido:**
Botón central/flotante que abre un selector de categoría y lleva directamente al formulario de registro. Cada categoría también tiene su propio botón de nuevo registro interno.

---

### 🚗 Vehículos

Lista de todos los vehículos registrados por el usuario.

```
[ + Agregar vehículo ]  ← solo Pro si ya tiene 1

  🚗 Toyota Corolla 2018 — ABC123
     Activo  •  Combustión
     [Ver detalle]  [Editar]

  🏍 Yamaha Crypton 2020 — WQB80E
     Combustión
     [Ver detalle]  [Editar]
```

- Tocar un vehículo abre su historial completo de registros por categoría
- Botón de agregar bloquea con pantalla de upgrade si el usuario es Free y ya tiene 1 vehículo

---

Chat conversacional con micrófono.

**Flujo completo:**
```
Usuario habla por micrófono
        ↓
Audio enviado a Gemma 4 (STT + interpretación)
        ↓
IA identifica intención y extrae datos
        ↓
Si es una acción → ejecuta en la app (registra, consulta, navega)
Si es una consulta → responde con datos del usuario
        ↓
IA responde en texto + voz (Google TTS)
```

**Ejemplos de lo que puede hacer:**
- *"Registra un gasto de gasolina, cargué lleno, 40 litros, $220.000, el odómetro está en 87.400"*
- *"¿Cuánto gasté en mantenimiento este año?"*
- *"¿Cuándo vence mi SOAT?"*
- *"¿En qué mes gasto más en gasolina?"*

---

### 👤 Cuenta

```
[ Foto de perfil ]
[ Nombre — Email ]

MIS VEHÍCULOS
  → Lista de vehículos
  → Agregar vehículo (Pro: ilimitados / Free: bloqueado)
  → Editar / eliminar vehículo

MI PLAN
  → Badge Free / Pro
  → Free: botón "Hazte Pro" con beneficios
  → Pro: fecha de renovación

PREFERENCIAS
  → Notificaciones push (on/off)

SESIÓN
  → Cerrar sesión
```

---

## 7. Inteligencia y alertas

### Alertas proactivas *(Pro)*
La app envía notificaciones push sin que el usuario pregunte:

- SOAT próximo a vencer (60, 30, 15 días antes)
- Tecnomecánica próxima a vencer (mismos intervalos)
- Impuesto vehicular próximo a vencer
- Kilometraje cercano al próximo mantenimiento
- Consumo de gasolina anómalo vs. promedio histórico

### Métricas disponibles
- Consumo real km/gal (combustión) o km/kWh (eléctrico) por ciclo y promedio histórico
- Gasto total por categoría (mensual / anual)
- Comparativo mes a mes
- Costo total por kilómetro recorrido
- Historial completo por categoría
- Promedio de consumo del modelo vs. otros usuarios con el mismo modelo *(data colectiva)*
- Mapa de precios de gasolina por estación / ciudad *(data colectiva)*

---

## 8. Data colectiva e inteligencia agregada

Esta es una capa de valor de largo plazo que se construye silenciosamente con el uso de la app. Los usuarios proveen data real colombiana que alimenta inteligencia colectiva.

### Catálogo de vehículos
Lista predefinida de marcas y modelos comunes en Colombia (Chevrolet Spark, Toyota Corolla, Yamaha Crypton, Honda Activa 125, etc.). Con suficientes usuarios registrando, la app construye:

- Consumo promedio real por modelo en Colombia
- Comparativo del usuario vs. promedio de su modelo: *"Tu Corolla consume 8% más que el promedio"*
- Base de datos propia comercializable a futuro (concesionarios, aseguradoras, estudios de mercado)

### Red de estaciones de gasolina
Cuando el usuario registra un tanqueo, la app captura automáticamente la ubicación por GPS y hace match con la estación más cercana vía Google Places API. El precio por litro se calcula implícitamente del registro (valor ÷ litros).

Con muchos usuarios esto construye:
- Precio promedio por litro por estación
- Mapa de precios de gasolina en tiempo real por ciudad
- Comparativo de precios entre estaciones cercanas al usuario

> **Nota:** Esta data se recopila de forma anónima y agregada. El usuario no necesita hacer nada extra — ocurre como parte del registro normal.

### Stack adicional para data colectiva
| Capa | Tecnología |
|---|---|
| Geolocalización | Expo Location |
| Match de estaciones | Google Places API |
| Catálogo de vehículos | Tabla propia en Supabase (curada manualmente al inicio) |

---

## 9. Stack tecnológico

### Stack confirmado

| Capa | Tecnología |
|---|---|
| Lenguaje | **TypeScript** (estricto en todo el proyecto) |
| Frontend / App | **React Native con Expo** (Expo Router para navegación) |
| Base de datos | **Supabase** (PostgreSQL gestionado) |
| Autenticación | **Supabase Auth** + AsyncStorage (sesión persistente) |
| Storage | Supabase Storage |
| IA / LLM | Gemma 4 vía Google AI Studio |
| Voz → Texto | Gemma 4 E2B/E4B (audio nativo multimodal) |
| Texto → Voz | Google Text-to-Speech |
| Function calling | Gemma 4 nativo |
| Hosting API | Google AI Studio (gratis en early stage) |
| Geolocalización | Expo Location |
| Match de estaciones | Google Places API |

### Dependencias clave de autenticación

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
```

### Patrón de sesión persistente

La app **nunca vuelve a mostrar la pantalla de login** una vez el usuario se registró. Supabase guarda el token en `AsyncStorage` del dispositivo y lo refresca automáticamente.

**Inicialización del cliente Supabase:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // requerido en React Native
  }
})
```

**Lógica de navegación en el layout raíz:**
```typescript
// El listener detecta el estado de sesión al abrir la app y en cada cambio
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    // Navegar al stack principal de la app
  } else {
    // Navegar al stack de auth (login/signup)
  }
})
```

**Flujo de usuario resultante:**
1. Primera vez: ve la pantalla de Login/Signup → se registra → entra a la app
2. Todas las veces siguientes: abre la app → ya está dentro (sin pantalla de login)
3. Solo vuelve a ver login si cierra sesión manualmente desde Cuenta

> **Nota de costos IA:** Google AI Studio tiene límites gratuitos generosos. Para el volumen de una app early stage (5–10 registros por voz/día por usuario), el tier gratuito cubre los primeros cientos de usuarios. La voz es feature Pro, por lo que el costo de IA solo lo generan usuarios que ya pagan.

---

## 10. Plan de acción

### ✅ Fase 1 — Concepto y diseño (completada)
Concepto, flujo de usuario, pantallas (diseño generado), modelo de negocio, categorías, stack tecnológico confirmado (React Native + Expo + Supabase + TypeScript).

### ✅ Fase 2 — Estructura de datos (completada)
Tablas y relaciones definidas en este documento: profiles, vehicles, vehicle_catalog, fuel_logs, electric_charge_logs, maintenance_logs, annual_records, other_expenses, gas_stations, gas_price_reports.

### Fase 3 — Setup del proyecto
- Inicializar proyecto con Expo
- Configurar navegación inferior (React Navigation)
- Conectar Supabase (auth, DB, storage)
- Conectar Google AI Studio API

### Fase 4 — MVP
Construir el flujo completo de **gasolina** de punta a punta:
- Onboarding + registro de vehículo
- Formulario de registro de gasolina
- Cálculo de consumo real (tanque lleno a tanque lleno)
- Historial de cargas
- Métrica de consumo promedio en el dashboard

Con esto hay una app funcional real para probar con usuarios reales.

### Fase 5 — Expansión de categorías
Replicar estructura para mantenimiento, SOAT, tecnomecánica, impuestos y otros. Añadir alertas push.

### Fase 6 — IA y voz
Integrar Gemma 4, flujo de micrófono, function calling, respuesta por voz. Activar como feature Pro.

### Fase 7 — Monetización
Integrar pasarela de pago, lógica de plan Free vs Pro, pantalla de upgrade.

---

## 11. Estructura de datos (Supabase)

---

### `profiles`
Extiende el usuario de Supabase Auth.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | FK → auth.users |
| name | text | |
| avatar_url | text | |
| plan | enum | `free` / `pro` |
| plan_expires_at | timestamptz | null si free |
| created_at | timestamptz | |

---

### `vehicle_catalog`
Mantenida por el dueño del producto. Base para el selector del onboarding.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| brand | text | Chevrolet, Toyota, Yamaha… |
| model | text | Spark, Corolla, Crypton… |
| type | enum | `car` / `moto` / `truck` / `other` |
| propulsion | enum | `combustion` / `electric` |
| tank_capacity_gal | numeric | null si eléctrico |
| battery_capacity_kwh | numeric | null si combustión |
| created_at | timestamptz | |

> **Fuentes para poblar el catálogo inicial:** RUNT (runt.com.co), Fasecolda, Car Query API. Con los 30-40 modelos más comunes en Colombia se cubre el 80% de usuarios.

---

### `vehicles`
Vehículo registrado por el usuario.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → profiles |
| catalog_id | uuid | FK → vehicle_catalog, null si "Otro" |
| custom_brand | text | Solo si catalog_id es null |
| custom_model | text | Solo si catalog_id es null |
| type | enum | `car` / `moto` / `truck` / `other` |
| propulsion | enum | `combustion` / `electric` |
| plate | text | nullable (motos eléctricas sin placa) |
| year | integer | |
| initial_odometer | numeric | km al momento del registro |
| battery_capacity_kwh | numeric | null si combustión |
| is_active | boolean | vehículo activo en el selector del Home |
| created_at | timestamptz | |

---

### `fuel_logs`
Registros de gasolina — vehículos de combustión.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| vehicle_id | uuid | FK → vehicles |
| user_id | uuid | FK → profiles |
| date | date | |
| odometer | numeric | km al momento del tanqueo |
| gallons | numeric | galones cargados |
| amount_cop | numeric | valor pagado en COP |
| full_tank | boolean | true = cierra ciclo de consumo |
| consumption_km_gal | numeric | calculado al cerrar ciclo, null si parcial |
| station_id | uuid | FK → gas_stations, nullable |
| created_at | timestamptz | |

---

### `electric_charge_logs`
Registros de carga — vehículos eléctricos.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| vehicle_id | uuid | FK → vehicles |
| user_id | uuid | FK → profiles |
| date | date | |
| odometer | numeric | |
| kwh_charged | numeric | |
| amount_cop | numeric | |
| battery_pct_start | integer | % al iniciar carga |
| battery_pct_end | integer | % al terminar carga |
| charge_type | enum | `slow` / `fast` / `home` |
| consumption_km_kwh | numeric | calculado por ciclo |
| created_at | timestamptz | |

---

### `maintenance_logs`

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| vehicle_id | uuid | FK → vehicles |
| user_id | uuid | FK → profiles |
| date | date | |
| type | text | Aceite, frenos, llantas… |
| description | text | |
| amount_cop | numeric | |
| odometer | numeric | |
| created_at | timestamptz | |

---

### `annual_records`
Cubre SOAT, tecnomecánica e impuestos. Diferenciados por `type`.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| vehicle_id | uuid | FK → vehicles |
| user_id | uuid | FK → profiles |
| type | enum | `soat` / `tech_inspection` / `tax` |
| issue_date | date | Fecha de pago/expedición/revisión |
| expiry_date | date | **Calculada automáticamente:** issue_date + 1 año |
| amount_cop | numeric | |
| provider | text | Aseguradora / CDA / null |
| tax_year | integer | Solo para type = `tax` |
| tax_department | text | Solo para type = `tax` — ej: "Atlántico", "Cundinamarca" |
| tax_city | text | Solo para type = `tax` — nullable, para impuesto municipal |
| created_at | timestamptz | |

> **Nota:** `expiry_date` nunca se ingresa manualmente. Se calcula en la capa de aplicación (o trigger de Supabase) como `issue_date + interval '1 year'`.

---

### `other_expenses`

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| vehicle_id | uuid | FK → vehicles |
| user_id | uuid | FK → profiles |
| date | date | |
| description | text | |
| amount_cop | numeric | |
| created_at | timestamptz | |

---

### `gas_stations` *(data colectiva)*

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| google_place_id | text | ID único de Google Places |
| name | text | |
| address | text | |
| city | text | |
| lat | numeric | |
| lng | numeric | |
| created_at | timestamptz | |

---

### `gas_price_reports` *(data colectiva — anónima)*
Un registro por cada tanqueo con estación asociada. Sin user_id por diseño.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| station_id | uuid | FK → gas_stations |
| date | date | |
| price_per_gallon_cop | numeric | Calculado: amount_cop ÷ gallons |
| created_at | timestamptz | |

---

## 12. Pendiente por definir

- [ ] Nombre de la app
- [ ] Identidad visual (colores, tipografía, ícono)
- [ ] Pasarela de pago para suscripción Pro (Wompi, PayU, Stripe)
- [ ] Precio del plan Pro en COP
- [ ] Política de datos y privacidad
- [ ] Estrategia de lanzamiento y adquisición de primeros usuarios

---

*Documento vivo — actualizar a medida que avanza el desarrollo.*
