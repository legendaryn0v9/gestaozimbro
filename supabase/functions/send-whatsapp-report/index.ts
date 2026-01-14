import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  date: string;
  targetUserId?: string; // Single user to send report to
  sendToAll?: boolean; // Send to all users (dono only)
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiInstanceId || !zapiToken) {
      console.error('Missing Z-API credentials');
      return new Response(
        JSON.stringify({ error: 'Z-API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user is admin/dono
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or dono
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (!roleData || !['admin', 'dono'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Only admins and owners can send reports' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { date, targetUserId, sendToAll }: ReportRequest = await req.json();

    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only dono can use sendToAll
    if (sendToAll && roleData.role !== 'dono') {
      return new Response(
        JSON.stringify({ error: 'Only owners can send to all users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target users based on the request
    let usersQuery = supabase
      .from('profiles')
      .select('id, full_name, phone, sector')
      .not('phone', 'is', null);

    if (targetUserId) {
      // Single user mode
      usersQuery = usersQuery.eq('id', targetUserId);
    }
    // If sendToAll, we get all users with phone numbers (already the default query)

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users with phone numbers found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    // Get movements for the date
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: allMovements } = await supabase
      .from('stock_movements')
      .select(`
        id,
        user_id,
        movement_type,
        quantity,
        notes,
        created_at,
        item_name_snapshot,
        item_price,
        item_unit
      `)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .order('created_at', { ascending: true });

    const movements = allMovements || [];

    // Calculate totals
    const entradas = movements.filter(m => m.movement_type === 'entrada');
    const saidas = movements.filter(m => m.movement_type === 'saida');
    const totalEntradas = entradas.reduce((sum, m) => sum + Number(m.quantity), 0);
    const totalSaidas = saidas.reduce((sum, m) => sum + Number(m.quantity), 0);
    const valorEntradas = entradas.reduce((sum, m) => sum + (Number(m.item_price || 0) * Number(m.quantity)), 0);
    const valorSaidas = saidas.reduce((sum, m) => sum + (Number(m.item_price || 0) * Number(m.quantity)), 0);

    // Format date for display
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    const sentResults: { userId: string; userName: string; success: boolean; error?: string }[] = [];

    // Add delay between messages to avoid spam detection
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (!user.phone) continue;

      const userRole = rolesMap.get(user.id) || 'funcionario';
      const userMovements = movements.filter(m => m.user_id === user.id);

      // Build ONE consolidated message for this user
      let message = `📊 *RELATÓRIO DIÁRIO*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📅 *${formattedDate}*\n\n`;
      message += `Olá, *${user.full_name}*! 👋\n\n`;

      if (userRole === 'dono') {
        // Complete report for owner
        message += `👑 *VISÃO DO DONO*\n\n`;
        
        message += `📦 *RESUMO GERAL*\n`;
        message += `├ Total: ${movements.length} movimentações\n`;
        message += `├ ⬆️ Entradas: ${totalEntradas} itens\n`;
        message += `└ ⬇️ Saídas: ${totalSaidas} itens\n\n`;
        
        message += `💰 *FINANCEIRO*\n`;
        message += `├ Investido: R$ ${valorEntradas.toFixed(2).replace('.', ',')}\n`;
        message += `├ Vendido: R$ ${valorSaidas.toFixed(2).replace('.', ',')}\n`;
        const balance = valorSaidas - valorEntradas;
        message += `└ Balanço: ${balance >= 0 ? '📈' : '📉'} R$ ${balance.toFixed(2).replace('.', ',')}\n\n`;

        // Group movements by user role
        const funcMovs = movements.filter(m => rolesMap.get(m.user_id) === 'funcionario');
        const adminMovs = movements.filter(m => rolesMap.get(m.user_id) === 'admin');
        const donoMovs = movements.filter(m => rolesMap.get(m.user_id) === 'dono');

        if (funcMovs.length > 0) {
          message += `👷 *Funcionários:* ${funcMovs.length} mov.\n`;
        }
        if (adminMovs.length > 0) {
          message += `👔 *Gestores:* ${adminMovs.length} mov.\n`;
        }
        if (donoMovs.length > 0) {
          message += `👑 *Você:* ${donoMovs.length} mov.\n`;
        }

      } else if (userRole === 'admin') {
        // Report for admin/gestor
        message += `👔 *VISÃO DO GESTOR*\n\n`;
        
        message += `📦 *RESUMO GERAL*\n`;
        message += `├ Total: ${movements.length} movimentações\n`;
        message += `├ ⬆️ Entradas: ${totalEntradas} itens\n`;
        message += `└ ⬇️ Saídas: ${totalSaidas} itens\n\n`;
        
        message += `💰 *FINANCEIRO*\n`;
        message += `├ Investido: R$ ${valorEntradas.toFixed(2).replace('.', ',')}\n`;
        message += `├ Vendido: R$ ${valorSaidas.toFixed(2).replace('.', ',')}\n`;
        const balance = valorSaidas - valorEntradas;
        message += `└ Balanço: ${balance >= 0 ? '📈' : '📉'} R$ ${balance.toFixed(2).replace('.', ',')}\n\n`;

        if (userMovements.length > 0) {
          message += `📝 *SUAS MOVIMENTAÇÕES*\n`;
          const limitedMovs = userMovements.slice(0, 8);
          limitedMovs.forEach((m, idx) => {
            const prefix = idx === limitedMovs.length - 1 ? '└' : '├';
            const tipo = m.movement_type === 'entrada' ? '⬆️' : '⬇️';
            message += `${prefix} ${tipo} ${m.item_name_snapshot}: ${m.quantity} ${m.item_unit || ''}\n`;
          });
          if (userMovements.length > 8) {
            message += `   _...e mais ${userMovements.length - 8}_\n`;
          }
        }

      } else {
        // Report for funcionario
        message += `👷 *SEU RELATÓRIO*\n\n`;
        
        message += `📦 *Suas movimentações:* ${userMovements.length}\n\n`;

        if (userMovements.length > 0) {
          const limitedMovs = userMovements.slice(0, 10);
          limitedMovs.forEach((m, idx) => {
            const prefix = idx === limitedMovs.length - 1 ? '└' : '├';
            const tipo = m.movement_type === 'entrada' ? '⬆️' : '⬇️';
            message += `${prefix} ${tipo} ${m.item_name_snapshot}: ${m.quantity} ${m.item_unit || ''}\n`;
          });
          if (userMovements.length > 10) {
            message += `   _...e mais ${userMovements.length - 10}_\n`;
          }
        } else {
          message += `_Você não teve movimentações hoje._\n`;
        }
      }

      message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `🤖 _Relatório automático_`;

      // Format phone number for Z-API (remove non-digits and ensure country code)
      let formattedPhone = user.phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      try {
        console.log(`Sending single consolidated message to ${user.full_name} (${formattedPhone})`);
        
        const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
        
        const response = await fetch(zapiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': zapiClientToken || '',
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message: message,
          }),
        });

        const result = await response.json();
        console.log(`Z-API response for ${user.full_name}:`, result);

        if (response.ok && !result.error) {
          sentResults.push({ userId: user.id, userName: user.full_name, success: true });
        } else {
          sentResults.push({ userId: user.id, userName: user.full_name, success: false, error: result.error || 'Unknown error' });
        }

        // Add delay between messages to avoid spam (2 seconds)
        if (i < users.length - 1) {
          await delay(2000);
        }
      } catch (error: any) {
        console.error(`Error sending to ${user.full_name}:`, error);
        sentResults.push({ userId: user.id, userName: user.full_name, success: false, error: error.message });
      }
    }

    const successCount = sentResults.filter(r => r.success).length;
    const failCount = sentResults.filter(r => !r.success).length;

    console.log(`Sent ${successCount} messages, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        results: sentResults,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-whatsapp-report:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
