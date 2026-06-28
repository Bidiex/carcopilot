import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALL_TOOLS = [
  {
    name: 'registrar_gasolina',
    description: 'Registra un tanqueo de gasolina. Usar para vehículos de combustión.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING', description: 'ID del vehículo' },
        galones: { type: 'NUMBER', description: 'Galones cargados' },
        precio_total: { type: 'NUMBER', description: 'Costo total en COP' },
        precio_por_galon: { type: 'NUMBER', description: 'Precio por galón en COP' },
        odometro: { type: 'NUMBER', description: 'Lectura actual del odómetro en km' },
        tanque_lleno: { type: 'BOOLEAN', description: 'Si se llenó el tanque completo' },
        nombre_estacion: { type: 'STRING', description: 'Nombre de la estación de servicio (opcional)' },
      },
      required: ['vehiculo_id', 'precio_total', 'odometro'],
    }
  },
  {
    name: 'registrar_carga_electrica',
    description: 'Registra una carga eléctrica. Solo para vehículos eléctricos.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        kwh_cargados: { type: 'NUMBER', description: 'Kilowatts-hora cargados' },
        costo_total: { type: 'NUMBER', description: 'Costo total en COP' },
        odometro: { type: 'NUMBER', description: 'Lectura actual del odómetro en km' },
        porcentaje_inicial: { type: 'NUMBER', description: 'Porcentaje de batería al iniciar la carga' },
        porcentaje_final: { type: 'NUMBER', description: 'Porcentaje de batería al terminar' },
      },
      required: ['vehiculo_id', 'costo_total', 'kwh_cargados', 'odometro'],
    }
  },
  {
    name: 'registrar_mantenimiento',
    description: 'Registra un gasto de mantenimiento o reparación del vehículo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        descripcion: { type: 'STRING', description: 'Descripción del mantenimiento realizado' },
        costo: { type: 'NUMBER', description: 'Costo total en COP' },
        odometro: { type: 'NUMBER', description: 'Lectura del odómetro al momento del mantenimiento' },
        taller: { type: 'STRING', description: 'Nombre del taller o lugar donde se realizó (opcional)' },
        tipo: { type: 'STRING', description: 'Tipo o ID de la categoría (revisa el listado de categorías en las instrucciones del sistema dependiendo si es carro o moto)' },
      },
      required: ['vehiculo_id', 'descripcion', 'costo', 'odometro', 'tipo'],
    }
  },
  {
    name: 'registrar_soat',
    description: 'Registra el pago del SOAT (Seguro Obligatorio de Accidentes de Tránsito).',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        valor_pagado: { type: 'NUMBER', description: 'Valor pagado en COP' },
        fecha_pago: { type: 'STRING', description: 'Fecha de pago en formato YYYY-MM-DD' },
        aseguradora: { type: 'STRING', description: 'Nombre de la aseguradora (opcional)' },
      },
      required: ['vehiculo_id', 'valor_pagado', 'fecha_pago'],
    }
  },
  {
    name: 'registrar_tecnomecanica',
    description: 'Registra el pago de la revisión técnico-mecánica.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        valor_pagado: { type: 'NUMBER', description: 'Valor pagado en COP' },
        fecha_revision: { type: 'STRING', description: 'Fecha de revisión en formato YYYY-MM-DD' },
        cda: { type: 'STRING', description: 'Nombre del CDA donde se realizó (opcional)' },
      },
      required: ['vehiculo_id', 'valor_pagado', 'fecha_revision'],
    }
  },
  {
    name: 'registrar_impuesto',
    description: 'Registra el pago del impuesto vehicular departamental o municipal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        valor_pagado: { type: 'NUMBER', description: 'Valor pagado en COP' },
        anio_gravable: { type: 'NUMBER', description: 'Año al que corresponde el impuesto' },
        fecha_pago: { type: 'STRING', description: 'Fecha de pago en formato YYYY-MM-DD' },
        departamento: { type: 'STRING', description: 'Departamento donde se pagó (ej: Atlántico)' },
        ciudad: { type: 'STRING', description: 'Ciudad si es impuesto municipal (opcional)' },
      },
      required: ['vehiculo_id', 'valor_pagado', 'anio_gravable', 'fecha_pago'],
    }
  },
  {
    name: 'registrar_otro_gasto',
    description: 'Registra cualquier otro gasto relacionado con el vehículo no cubierto por otras categorías.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        descripcion: { type: 'STRING', description: 'Descripción del gasto' },
        monto: { type: 'NUMBER', description: 'Monto en COP' },
        fecha: { type: 'STRING', description: 'Fecha del gasto en formato YYYY-MM-DD' },
      },
      required: ['vehiculo_id', 'descripcion', 'monto'],
    }
  },
  {
    name: 'consultar_gastos_mes',
    description: 'Consulta el total de gastos del vehículo en un mes específico o el mes actual.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        mes: { type: 'NUMBER', description: 'Mes en número (1-12). Si no se especifica, usar mes actual.' },
        anio: { type: 'NUMBER', description: 'Año. Si no se especifica, usar año actual.' },
      },
      required: ['vehiculo_id'],
    }
  },
  {
    name: 'consultar_consumo',
    description: 'Consulta el rendimiento promedio (km/gal o km/kWh) del vehículo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        ultimos_n_registros: { type: 'NUMBER', description: 'Cuántos registros recientes considerar. Default: 5.' },
      },
      required: ['vehiculo_id'],
    }
  },
  {
    name: 'consultar_vencimientos',
    description: 'Consulta los vencimientos próximos de SOAT, tecnomecánica e impuestos.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        dias_anticipacion: { type: 'NUMBER', description: 'Alertar si vence en menos de X días. Default: 60.' },
      },
      required: ['vehiculo_id'],
    }
  },
  {
    name: 'consultar_historial',
    description: 'Consulta los últimos registros de una categoría específica.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING' },
        categoria: { type: 'STRING', description: 'gasolina, electrico, mantenimiento, soat, tecnomecanica, impuesto, otro' },
        limite: { type: 'NUMBER', description: 'Cantidad de registros a retornar. Default: 5.' },
      },
      required: ['vehiculo_id', 'categoria'],
    }
  },
  {
    name: 'seleccionar_vehiculo',
    description: 'Selecciona el vehículo activo para los próximos registros de la sesión.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehiculo_id: { type: 'STRING', description: 'ID del vehículo a seleccionar' },
      },
      required: ['vehiculo_id'],
    }
  }
];

function buildSystemPrompt(userContext: any) {
  const activeVehicle = userContext.vehicles?.find((v: any) => v.id === userContext.activeVehicleId);
  const isMoto = activeVehicle?.type === 'moto';

  const categoryContext = isMoto ? `
CATEGORÍAS DE MANTENIMIENTO (MOTO):
El vehículo activo es una motocicleta. Al registrar un mantenimiento, debes clasificarlo (parámetro 'tipo') usando EXACTAMENTE uno de estos IDs:
moto_motor, moto_lubricacion, moto_refrigeracion, moto_combustible, moto_admision, moto_encendido, moto_escape, moto_caja_embrague, moto_transmision, moto_suspension_delantera, moto_suspension_trasera, moto_direccion, moto_frenos, moto_ruedas, moto_electrico, moto_iluminacion, moto_instrumentacion, moto_controles, moto_chasis, moto_seguridad, moto_accesorios, moto_electrica, moto_general, otros.
Si dudas, pregúntale al usuario a qué categoría pertenece.
` : `
CATEGORÍAS DE MANTENIMIENTO (CARRO):
El vehículo activo es un automóvil. Al registrar un mantenimiento, debes clasificarlo (parámetro 'tipo') usando EXACTAMENTE uno de estos IDs:
motor_internos, admision_aire, sistema_combustible, sistema_encendido, sistema_lubricacion, sistema_refrigeracion, escape_emisiones, transmision, traccion_ejes, suspension, direccion, frenos, ruedas, electrico, iluminacion, carroceria, vidrios_espejos, interior, aire_acondicionado, seguridad, acceso, conectividad, hibridos_electricos, accesorios, otros.
Si dudas, pregúntale al usuario a qué categoría pertenece.
`;

  return `
Eres CarCopilot, un asistente financiero experto en vehículos. Tu objetivo es ayudar al usuario a registrar gastos, entender su consumo y anticipar mantenimientos o pagos legales en Colombia.

CONTEXTO DEL USUARIO:
- Tienes acceso a sus vehículos registrados.
- Eres proactivo, directo y breve. No des saludos largos.
- Siempre respondes en pesos colombianos (COP) y usas jerga colombiana comprensible (SOAT, tecnomecánica, tanqueo).
- Cuando el usuario indique una confirmación (ej: "sí", "correcto", "hazlo"), puedes ejecutar la acción correspondiente.

REGLA DE VEHÍCULO:
- Si el usuario tiene exactamente 1 vehículo, úsalo siempre automáticamente sin preguntar.
- Si el usuario tiene más de 1 vehículo Y el mensaje no especifica claramente cuál, SIEMPRE pregunta primero antes de registrar: "¿Para cuál vehículo es este registro? Tienes: " y menciona los vehículos por marca/modelo.
- Si el usuario menciona la marca, modelo o placa del vehículo en su mensaje, identifícalo y úsalo sin preguntar.
- Nunca asumas el vehículo activo cuando hay más de uno a menos que se indique explícitamente.

VEHÍCULOS DEL USUARIO: ${JSON.stringify(userContext.vehicles)}
VEHÍCULO ACTIVO ACTUALMENTE: ${userContext.activeVehicleId}
FECHA ACTUAL: ${userContext.currentDate}

${categoryContext}

REGLAS DE OPERACIÓN:
1. Si el usuario te dicta un gasto, usa la herramienta correspondiente para guardarlo. No asumas datos críticos.
2. Si el usuario hace una consulta, responde brevemente con los datos obtenidos.
3. Mantén tus respuestas habladas por debajo de las 30 palabras. Eres un copiloto rápido.
4. NUNCA respondas con bloques de código (Markdown). Responde solo con lenguaje natural que pueda ser leído en voz alta (texto plano).
5. REGLA CRÍTICA: Si el usuario no provee uno o más de los parámetros requeridos para una herramienta (como odómetro, galones, kWh o tipo), NO asumas los valores ni llames a la herramienta con valores nulos. DEBES responder haciendo las preguntas necesarias para obtener la información faltante, y NO invoques la herramienta hasta tener todos los datos requeridos.
`;
}

function buildContents(audioBase64: string, mimeType: string, conversationHistory: any[]) {
  const contents = [];
  
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      if (msg.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (msg.role === 'model') {
        contents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }
  }

  if (audioBase64) {
    contents.push({
      role: "user",
      parts: [
        {
          inline_data: {
            mime_type: mimeType || "audio/mp4",
            data: audioBase64
          }
        }
      ]
    });
  }

  return contents;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { audioBase64, mimeType, conversationHistory, userContext } = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY no configurado en Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt(userContext) }] },
          contents: buildContents(audioBase64, mimeType, conversationHistory),
          tools: [{ function_declarations: ALL_TOOLS }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    )

    const geminiData = await response.json()

    return new Response(
      JSON.stringify(geminiData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
