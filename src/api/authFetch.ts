/**
 * authFetch — fetch wrapper that injects the Bearer token from localStorage.
 *
 * CYBERPOOL FIX: several admin tabs used raw `fetch()` without an
 * Authorization header, so after the server started enforcing requireAuth on
 * admin routers (supplier-hub, cron, source-connector, source-automation,
 * payments/admin, reliable-orders/admin) those calls would 401. All admin
 * components should route requests through this helper (or through src/api/*
 * ApiClient, which already injects the token).
 */
export async function authFetch(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {})
  };

  try {
    const token = localStorage.getItem('cyberpool_auth_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // localStorage unavailable (SSR/tests) — proceed without token
  }

  return fetch(input, { ...init, headers });
}