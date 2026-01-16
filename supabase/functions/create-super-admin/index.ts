import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if admin already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("full_name", "admin")
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ message: "Super admin already exists" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the super admin user
    const fakeEmail = "admin@superadmin.local";
    const password = "adminacesso";

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "admin",
        is_super_admin: true,
      },
    });

    if (createError) {
      console.error("Error creating super admin:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set role to 'admin' (will be treated as super admin due to is_super_admin metadata)
    if (newUser.user) {
      await supabaseAdmin
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", newUser.user.id);
      
      // Update profile name
      await supabaseAdmin
        .from("profiles")
        .update({ 
          full_name: "admin",
          phone: "admin"
        })
        .eq("id", newUser.user.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Super admin created successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-super-admin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
