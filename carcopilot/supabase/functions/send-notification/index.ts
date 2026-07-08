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
    const { notification_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single()

    if (notifError || !notification) {
      return new Response(JSON.stringify({ error: 'Notificación no encontrada' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let profilesQuery = supabase.from('profiles').select('id')

    if (notification.segment === 'trial') {
      profilesQuery = profilesQuery.eq('plan', 'trial')
    } else if (notification.segment === 'pro') {
      profilesQuery = profilesQuery.eq('plan', 'pro')
    } else if (notification.segment === 'city' && notification.segment_value) {
      profilesQuery = profilesQuery.eq('city', notification.segment_value)
    }

    const { data: profiles } = await profilesQuery
    const userIds = (profiles ?? []).map(p => p.id)

    if (userIds.length === 0) {
      await supabase.from('notifications').update({
        last_sent_at: new Date().toISOString(),
        recipient_count: 0,
      }).eq('id', notification_id)
      return new Response(JSON.stringify({ sent: 0 }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .in('user_id', userIds)

    const pushTokens = (tokens ?? []).map(t => t.expo_push_token)

    if (pushTokens.length === 0) {
      await supabase.from('notifications').update({
        last_sent_at: new Date().toISOString(),
        recipient_count: 0,
      }).eq('id', notification_id)
      return new Response(JSON.stringify({ sent: 0 }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const messages = pushTokens.map(token => ({
      to: token,
      title: notification.title,
      body: notification.body,
      data: {
        destination_type: notification.destination_type,
        destination_value: notification.destination_value,
      },
    }))

    const batches = []
    for (let i = 0; i < messages.length; i += 100) {
      batches.push(messages.slice(i, i + 100))
    }

    for (const batch of batches) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      })
    }

    const { data: nextSendData } = await supabase.rpc('calculate_next_send_at', {
      p_recurrence_type: notification.recurrence_type,
      p_send_time: notification.send_time,
      p_send_day_of_week: notification.send_day_of_week,
      p_start_date: notification.start_date,
      p_end_date: notification.end_date,
      p_last_sent_at: new Date().toISOString(),
    })

    await supabase.from('notifications').update({
      last_sent_at: new Date().toISOString(),
      next_send_at: nextSendData,
      recipient_count: pushTokens.length,
      status: nextSendData ? 'scheduled' : 'sent',
    }).eq('id', notification_id)

    return new Response(JSON.stringify({ sent: pushTokens.length }), { 
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
