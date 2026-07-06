# Auditoría de Seguridad — CarCopilot
Fecha: 28 de junio de 2026

## Resumen ejecutivo
- **Total problemas encontrados**: 7
- **Críticos**: 1 (corregidos: 1 / pendientes: 0)
- **Medios**: 1 (corregidos: 1 / pendientes: 0)
- **Bajos / Mejora continua**: 5 (corregidos: 3 / pendientes: 2)

---

## Problemas encontrados y estado

### 🔴 CRÍTICOS
| # | Archivo | Problema | Estado |
|---|---|---|---|
| 1 | `utils/registerPushToken.ts` | **Exposición de datos en logs**: `console.log` imprimía el `userId` y el Push Token del dispositivo a la consola. Visible con herramientas de debug en producción. | ✅ Corregido (Líneas comentadas) |

### 🟡 MEDIOS
| # | Archivo | Problema | Estado |
|---|---|---|---|
| 2 | `app/(tabs)/ai.tsx` | **Persistencia biométrica**: El archivo temporal de audio grabado para Gemini no se eliminaba explícitamente del dispositivo después de convertirse a Base64. | ✅ Corregido (Eliminación con FileSystem agregada) |

### 🟢 BAJOS
| # | Archivo | Problema | Estado |
|---|---|---|---|
| 3 | Múltiples (11 archivos) | **Exposición de internals en errores**: `console.error` imprimía el objeto de error completo, exponiendo trazas de la base de datos o stack traces. | ✅ Corregido (Líneas comentadas) |
| 4 | `.env.example` | Faltaba la variable de entorno `EXPO_PUBLIC_PROJECT_ID`. | ✅ Corregido |
| 5 | `.gitignore` | Faltaban extensiones de certificados/seguridad como `*.keystore` y `GoogleService-Info.plist` (iOS). | ✅ Corregido |
| 6 | Funciones Supabase | Existen dos funciones `SECURITY DEFINER` (`rls_auto_enable`, `handle_new_user`). | ⚠️ Pendiente (Requiere revisión manual) |
| 7 | Función `ai-proxy` | **Falta validación de contexto (Bajo)**: La Edge Function confía ciegamente en el `userContext` enviado desde el cliente sin validarlo contra el `user_id` autenticado. Aunque RLS protege las escrituras en la base de datos localmente, un usuario malintencionado podría inyectar vehículos ajenos en el prompt. | ⚠️ Auditado (Se recomienda que el contexto se consulte en backend) |

---

## Items que requieren revisión manual

1. **Funciones SECURITY DEFINER**: Si creaste estas funciones desde el Dashboard o por migraciones, asegúrate de que no inyectan datos de entrada del usuario sin validación. Al ser definer, se ejecutan saltando las políticas RLS.

## Conclusiones sobre la Edge Function `ai-proxy`
Se descargó el código fuente desde Supabase usando MCP y se auditó localmente (`supabase/functions/ai-proxy/index.ts`):
- ✅ **Auth**: Sí valida el token JWT (`supabase.auth.getUser()`) y deniega acceso sin token (401).
- ✅ **Logs Seguros**: No se encontró uso de `console.log` con datos del usuario.
- ✅ **Endpoints Privados**: No hay rutas sin autenticación aparte de `OPTIONS` para CORS.
- ⚠️ **Verificación de contexto**: No se valida que el `userContext` provisto por el cliente corresponda al usuario autenticado. Aunque no es crítico (las escrituras están protegidas por RLS en el cliente), es una mala práctica confiar en datos del cliente para el Prompt. Se recomienda que el backend obtenga los vehículos usando el token JWT directamente.

## Recomendaciones para fases futuras
- **Manejo de Errores Remoto**: En lugar de comentar los `console.error`, implementar una herramienta como **Sentry** o **Bugsnag** para recolectar fallos en producción sin exponerlos en el logcat o consola local.
- **Auditoría de IA**: Implementar sanitización de la respuesta en la Edge Function para evitar inyección de prompts desde el audio (Prompt Injection).
- **Gestión de variables de entorno**: Validar que nadie tenga acceso a los `.keystore` de producción salvo los administradores de DevOps/CI-CD.
