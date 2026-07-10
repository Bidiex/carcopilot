import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase env vars")
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar todos los annual_records (SOAT, Tecnomecánica, Impuestos) activos
    const { data: records, error } = await supabase
      .from('annual_records')
      .select(`
        id, user_id, type, expiry_date,
        vehicles ( id, plate, custom_brand, custom_model )
      `)

    if (error) throw error

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const triggerPromises = []

    for (const record of (records || [])) {
      if (!record.expiry_date || !record.vehicles) continue

      const expDate = new Date(record.expiry_date)
      expDate.setHours(0, 0, 0, 0)

      const diffTime = expDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if ([15, 30, 60].includes(diffDays)) {
        // Determinar el trigger_event
        let typePrefix = ''
        if (record.type === 'soat') typePrefix = 'soat'
        else if (record.type === 'tech_inspection') typePrefix = 'tecnomecanica'
        else if (record.type === 'tax') typePrefix = 'tax'

        if (!typePrefix) continue

        const trigger_event = `${typePrefix}_expiring_${diffDays}`

        const vehicle = record.vehicles
        const vehicleName = `${vehicle.custom_brand} ${vehicle.custom_model}`.trim()

        // Llamar a trigger-system-notification
        const payload = {
          trigger_event,
          user_id: record.user_id,
          reference_id: record.id,
          variables: {
            vehicleName,
            plate: vehicle.plate
          }
        }

        // Realizamos la llamada internamente mediante un HTTP POST a la otra EF
        // Esto permite reusar la lógica anti-duplicados y envío push
        triggerPromises.push(
          fetch(`${supabaseUrl}/functions/v1/trigger-system-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify(payload)
          }).catch(err => {
            // console.error(`Error triggering ${trigger_event} for ${record.id}`, err)
          })
        )
      }
    }

    await Promise.allSettled(triggerPromises)

    return new Response(JSON.stringify({ success: true, processed: triggerPromises.length }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
