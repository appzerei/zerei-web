import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Client "de identidade": usa o token de quem chamou, só pra descobrir QUEM é.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Token de autenticação ausente' }),
      { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const identityClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await identityClient.auth.getUser();

  if (userError || !user) {
    console.warn('[delete-account] token inválido', userError?.message);
    return new Response(
      JSON.stringify({ error: 'Sessão inválida ou expirada' }),
      { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const userId = user.id;

  // Client "admin": usa a service_role pra de fato apagar, ignorando RLS.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // 1) Posts do usuário — precisamos saber os IDs antes de apagar,
    // pra limpar comentários e likes de OUTRAS pessoas nesses posts.
    const { data: userPosts, error: postsSelectError } = await admin
      .from('posts')
      .select('id')
      .eq('user_id', userId);

    if (postsSelectError) {
      throw new Error(`[posts:select] ${postsSelectError.message}`);
    }

    const postIds = (userPosts ?? []).map((p) => p.id);

    // 2) Comentários e likes feitos POR OUTRAS PESSOAS nos posts desse usuário
    if (postIds.length > 0) {
      const { error: commentsOnPostsError } = await admin
        .from('comments')
        .delete()
        .in('post_id', postIds);
      if (commentsOnPostsError) throw new Error(`[comments:by_post] ${commentsOnPostsError.message}`);

      const { error: likesOnPostsError } = await admin
        .from('likes')
        .delete()
        .in('post_id', postIds);
      if (likesOnPostsError) throw new Error(`[likes:by_post] ${likesOnPostsError.message}`);
    }

    // 3) Comentários e likes que o próprio usuário fez em posts de outras pessoas
    const { error: commentsByUserError } = await admin
      .from('comments')
      .delete()
      .eq('user_id', userId);
    if (commentsByUserError) throw new Error(`[comments:by_user] ${commentsByUserError.message}`);

    const { error: likesByUserError } = await admin
      .from('likes')
      .delete()
      .eq('user_id', userId);
    if (likesByUserError) throw new Error(`[likes:by_user] ${likesByUserError.message}`);

    // 4) Posts do usuário (agora sem comentários/likes pendurados)
    const { error: postsDeleteError } = await admin
      .from('posts')
      .delete()
      .eq('user_id', userId);
    if (postsDeleteError) throw new Error(`[posts:delete] ${postsDeleteError.message}`);

    // 5) Mensagens e participação em grupos
    const { error: teamMessagesError } = await admin
      .from('team_messages')
      .delete()
      .eq('user_id', userId);
    if (teamMessagesError) throw new Error(`[team_messages] ${teamMessagesError.message}`);

    const { error: teamMembersError } = await admin
      .from('team_members')
      .delete()
      .eq('user_id', userId);
    if (teamMembersError) throw new Error(`[team_members] ${teamMembersError.message}`);

    // 6) Grupos criados pelo usuário — mantém o grupo, tira o dono
    const { error: teamsOrphanError } = await admin
      .from('teams')
      .update({ created_by: null })
      .eq('created_by', userId);
    if (teamsOrphanError) throw new Error(`[teams:orphan] ${teamsOrphanError.message}`);

    // 7) Progresso e limites
    const { error: challengeError } = await admin
      .from('challenge_completions')
      .delete()
      .eq('user_id', userId);
    if (challengeError) throw new Error(`[challenge_completions] ${challengeError.message}`);

    const { error: rateLimitError } = await admin
      .from('rate_limits')
      .delete()
      .eq('user_id', userId);
    if (rateLimitError) throw new Error(`[rate_limits] ${rateLimitError.message}`);

    // 8) Moderação — apaga o próprio registro de banido;
    // se ele baniu alguém como moderador, mantém o histórico mas anonimiza quem baniu
    const { error: bannedUserError } = await admin
      .from('banned_users')
      .delete()
      .eq('banned_user_id', userId);
    if (bannedUserError) throw new Error(`[banned_users:own] ${bannedUserError.message}`);

    const { error: bannedByError } = await admin
      .from('banned_users')
      .update({ banned_by: null })
      .eq('banned_by', userId);
    if (bannedByError) throw new Error(`[banned_users:by] ${bannedByError.message}`);

    // 9) Amizades e indicações
    const { error: friendshipsError } = await admin
      .from('friendships')
      .delete()
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (friendshipsError) throw new Error(`[friendships] ${friendshipsError.message}`);

    const { error: referralsError } = await admin
      .from('referrals')
      .delete()
      .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
    if (referralsError) throw new Error(`[referrals] ${referralsError.message}`);

    // 10) Perfil
    const { error: profileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw new Error(`[profiles] ${profileError.message}`);

    // 11) Por último: a conta de autenticação em si.
    // Isso invalida qualquer sessão/token que ainda exista pra esse usuário.
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
    if (authDeleteError) throw new Error(`[auth.deleteUser] ${authDeleteError.message}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Se algo já foi apagado antes do erro, os dados restantes ficam órfãos.
    // Isso é raro (erro de rede/banco no meio do processo), mas fica registrado
    // pra você conseguir investigar e limpar manualmente se precisar.
    console.error(`[delete-account] falhou pra userId=${userId}:`, error);
    return new Response(
      JSON.stringify({ error: 'Não foi possível apagar todos os dados. Tente novamente ou contate o suporte.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});