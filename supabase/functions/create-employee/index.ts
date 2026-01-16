import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default avatars based on role
const DEFAULT_FUNCIONARIO_AVATAR = 'https://klltuuwzedbhkbykayyn.supabase.co/storage/v1/object/public/avatars/aec0fc98-9144-4c29-a90b-6d812539e670-1768175022612.png';

interface CreateEmployeeRequest {
  phone: string;
  password: string;
  fullName: string;
  sector: 'bar' | 'cozinha';
  avatarUrl?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (!roleData || (roleData.role !== "admin" && roleData.role !== "dono")) {
      return new Response(
        JSON.stringify({ error: "Apenas gerentes e donos podem criar funcionários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { phone, password, fullName, sector, avatarUrl }: CreateEmployeeRequest = await req.json();

    if (!phone || !password || !fullName || !sector) {
      return new Response(
        JSON.stringify({ error: "Telefone, senha, nome e setor são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a fake email using phone number (Supabase requires email)
    const fakeEmail = `${phone.replace(/\D/g, '')}@funcionario.local`;

    // Use provided avatar or default funcionario avatar
    const finalAvatarUrl = avatarUrl || DEFAULT_FUNCIONARIO_AVATAR;

    // Create the user with admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone,
        sector: sector,
        avatar_url: finalAvatarUrl,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      
      // Check if it's a duplicate phone error
      if (createError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: "Este telefone já está cadastrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile with phone, sector and avatar
    if (newUser.user) {
      await supabaseAdmin
        .from("profiles")
        .update({ 
          phone: phone,
          sector: sector,
          avatar_url: finalAvatarUrl
        })
        .eq("id", newUser.user.id);
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-employee function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
