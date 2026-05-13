import { supabase } from '@/lib/supabase';

export function getSessionToken(user) {
  return user?.session_token || null;
}

export async function backofficeQuery(user, resource, params = {}) {
  const token = getSessionToken(user);
  if (!token) {
    return { data: null, error: { message: 'Missing back office session' } };
  }

  return supabase.rpc('backoffice_query', {
    p_session_token: token,
    p_resource: resource,
    p_params: params,
  });
}

export async function backofficeMutation(
  user,
  table,
  action,
  payload = {},
  filter = {},
  onConflict = null
) {
  const token = getSessionToken(user);
  if (!token) {
    return { data: null, error: { message: 'Missing back office session' } };
  }

  return supabase.rpc('backoffice_mutation', {
    p_session_token: token,
    p_table: table,
    p_action: action,
    p_payload: payload,
    p_filter: filter,
    p_on_conflict: onConflict,
  });
}
