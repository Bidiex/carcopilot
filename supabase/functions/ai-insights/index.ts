import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `
Eres el motor de inteligencia de CarCopilot, una app de gestión
financiera vehicular para Colombia. Tu rol es analizar los datos
del vehículo del usuario y generar insights proactivos, concisos
y accionables.

REGLAS:
- Genera exactamente entre 1 y 3 insights según la relevancia
  de los datos disponibles. Si no hay datos suficientes para
  un insight valioso, genera menos.
- Cada insight debe ser específico con números reales del usuario,
  nunca genérico.
- Usa pesos colombianos (COP) con formato $X.XXX
- Usa km/gal para consumo
- Tono: directo, inteligente, como un mecánico experto y amigo
- NO uses emojis en el texto — la UI usará íconos propios
- Máximo 2 líneas de texto por insight
- Cada insight debe clasificarse en uno de estos tipos:
  * alert: algo urgente que requiere atención (vencimientos, anomalías)
  * tip: recomendación técnica basada en datos
  * achievement: logro positivo para motivar al usuario
  * prediction: proyección financiera basada en historial

RESPONDE ÚNICAMENTE con un JSON válido, sin texto adicional,
sin markdown, sin backticks. Formato exacto:

{
  "insights": [
    {
      "type": "alert",
      "priority": 1,
      "content": "Tu SOAT vence en 18 días. El año pasado pagaste $215.000.",
      "vehicle_id": "uuid-del-vehiculo-o-null-si-es-general"
    }
  ]
}

EJEMPLOS DE INSIGHTS DE CALIDAD:

alert: "Tu SOAT vence en 18 días — renuévalo antes del [fecha] para evitar comparendos de hasta $900.000."

tip: "Tu consumo bajó de 12.3 a 10.1 km/gal en las últimas 3 semanas. Puede ser filtro de aire sucio o presión de llantas baja."

achievement: "Mejor rendimiento del mes: 13.2 km/gal el [fecha]. Llevas 3 meses con registro consistente."

prediction: "Basado en tu historial, este mes gastarás aproximadamente $380.000 en combustible."
`;

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

    // Recopilar contexto del usuario
    const { data: vehicles } = await supabase.from('vehicles').select('*').eq('user_id', user.id);
    const vehicleIds = vehicles?.map((v: any) => v.id) || [];

    let contextData: any = {
      vehicles,
      fuel_logs: [],
      maintenance_logs: [],
      annual_records: []
    };

    if (vehicleIds.length > 0) {
      const [fuelRes, maintRes, recordsRes] = await Promise.all([
        supabase.from('fuel_logs').select('*').in('vehicle_id', vehicleIds).order('date', { ascending: false }).limit(20),
        supabase.from('maintenance_logs').select('*').in('vehicle_id', vehicleIds).order('date', { ascending: false }).limit(10),
        supabase.from('annual_records').select('*').in('vehicle_id', vehicleIds).order('issue_date', { ascending: false }).limit(10)
      ]);
      
      contextData.fuel_logs = fuelRes.data || [];
      contextData.maintenance_logs = maintRes.data || [];
      contextData.annual_records = recordsRes.data || [];
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY no configurado en Supabase')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            { 
              role: 'user', 
              parts: [{ text: `Datos del usuario para analizar:\n${JSON.stringify(contextData)}` }] 
            }
          ],
          generationConfig: { temperature: 0.3, response_mime_type: "application/json" },
        }),
      }
    )

    const geminiData = await response.json()
    const textResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('No se generaron insights validos')
    }

    let parsedInsights: any;
    try {
      parsedInsights = JSON.parse(textResponse);
    } catch (e) {
      throw new Error('El formato JSON de la respuesta es inválido')
    }

    if (parsedInsights && parsedInsights.insights && Array.isArray(parsedInsights.insights)) {
      // Eliminar insights NO GUARDADOS anteriores del usuario
      await supabase
        .from('ai_insights')
        .delete()
        .eq('user_id', user.id)
        .eq('is_saved', false);

      const insightsToInsert = parsedInsights.insights.map((insight: any) => ({
        user_id: user.id,
        vehicle_id: insight.vehicle_id || null,
        type: insight.type,
        priority: insight.priority || 1,
        content: insight.content,
        is_saved: false,
      }));

      if (insightsToInsert.length > 0) {
        await supabase.from('ai_insights').insert(insightsToInsert);
      }
    }

    return new Response(
      JSON.stringify({ success: true, insights: parsedInsights.insights || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
