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
    const { trigger_event, user_id, variables = {}, reference_id = null } = await req.json()

    if (!trigger_event || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing trigger_event or user_id' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase env vars")
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Verificar anti-duplicados en sent_system_notifications
    if (reference_id) {
      const { data: existing } = await supabase
        .from('sent_system_notifications')
        .select('id')
        .eq('user_id', user_id)
        .eq('trigger_event', trigger_event)
        .eq('reference_id', reference_id)
        .single()
      
      if (existing) {
        return new Response(JSON.stringify({ skipped: true, reason: 'already_sent' }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      // Para eventos sin reference_id (como user_welcome), chequear solo user_id + trigger_event
      const { data: existing } = await supabase
        .from('sent_system_notifications')
        .select('id')
        .eq('user_id', user_id)
        .eq('trigger_event', trigger_event)
        .is('reference_id', null)
        .single()
      
      if (existing) {
        return new Response(JSON.stringify({ skipped: true, reason: 'already_sent' }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 2. Obtener la plantilla activa
    const { data: template, error: tmplError } = await supabase
      .from('notifications')
      .select('*')
      .eq('trigger_event', trigger_event)
      .eq('status', 'active')
      .single()

    if (tmplError || !template) {
      return new Response(JSON.stringify({ error: 'Plantilla de notificación no encontrada o inactiva' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Obtener el token push del usuario
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', user_id)

    const pushTokens = (tokens ?? []).map(t => t.expo_push_token)

    if (pushTokens.length > 0) {
      // Reemplazar variables en título y cuerpo
      let finalTitle = template.title
      let finalBody = template.body

      for (const [key, value] of Object.entries(variables)) {
        finalTitle = finalTitle.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
        finalBody = finalBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
      }

      const messages = pushTokens.map(token => ({
        to: token,
        title: finalTitle,
        body: finalBody,
        data: {
          destination_type: template.destination_type,
          destination_value: template.destination_value,
        },
      }))

      // Enviar a Expo
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      })
    }

    // 4. Registrar como enviado
    await supabase.from('sent_system_notifications').insert({
      user_id,
      trigger_event,
      reference_id
    })

    return new Response(JSON.stringify({ success: true, tokensCount: pushTokens.length }), { 
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
