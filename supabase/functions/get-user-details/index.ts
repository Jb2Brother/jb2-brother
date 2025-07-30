// supabase/functions/get-user-details/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Función para obtener la cantidad de proyectos de un usuario
async function getProjectsCount(supabaseClient: any, userId: string): Promise<number> {
  const { count, error } = await supabaseClient
    .from('proyectos')
    .select('*', { count: 'exact', head: true })
    .eq('ID_de_usuario', userId);

  if (error) {
    console.error('Error counting projects:', error);
    return 0;
  }
  return count || 0;
}

Deno.serve(async (req) => {
  // Manejar la solicitud preflight de CORS para que el navegador no la bloquee
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      throw new Error("User ID is required.");
    }

    // Crear un cliente especial de Supabase que tiene permisos de "administrador"
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Obtener datos del perfil público del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nombre_completo, nombre_usuario, URL_del_avatar')
      .eq('identificación', userId)
      .single();

    if (profileError) throw profileError;

    // 2. Obtener datos de autenticación (como el último login)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError) throw authError;

    // 3. Obtener el conteo de proyectos del usuario
    const projectsCount = await getProjectsCount(supabaseAdmin, userId);

    // Juntar toda la información en un solo objeto
    const userDetails = {
      ...profile,
      last_sign_in_at: authUser.user.last_sign_in_at,
      projectsCount: projectsCount,
    };
    
    // Devolver la información al panel de admin
    return new Response(JSON.stringify({ user: userDetails }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Si algo sale mal, devolver un error claro
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});