const TOKEN_KEY = 'afyaflow_access_token';
const ROLE_KEY = 'afyaflow_role';
const USER_ID_KEY = 'afyaflow_user_id';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function setAuthSession(token: string, role: string, userId: number): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_ID_KEY, String(userId));
}

export function getCurrentRole(): string | null {
  return localStorage.getItem(ROLE_KEY);
}

export function getCurrentUserId(): number | null {
  const raw = localStorage.getItem(USER_ID_KEY);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isNaN(num) ? null : num;
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

