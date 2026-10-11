/**
 * Authentication service.
 *
 * With the backend live (`USE_MOCK === false`) credentials are posted to
 * `POST /api/auth/login`, which sets an httpOnly access-token cookie used by
 * every subsequent `apiRequest`. A non-sensitive session marker is still kept
 * in localStorage so the UI knows it is signed in.
 *
 * If the backend is unreachable, the demo credentials are accepted locally so
 * the prototype can still be demonstrated offline.
 */

import { apiRequest, ApiError, USE_MOCK, rememberCredentials, DEMO_EMAIL, DEMO_PASSWORD } from './apiClient';

export { DEMO_EMAIL, DEMO_PASSWORD };

const SESSION_STORAGE_KEY = 'texflow_demo_session';

export interface DemoSession {
  email: string;
  loginAt: number;
  name?: string;
  role?: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function storeSession(email: string, name?: string, role?: string): void {
  const session: DemoSession = { email, loginAt: Date.now(), name, role };
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable (private mode etc.) — session simply won't persist.
  }
}

/** Validate credentials against the demo account. Never logs or returns the password. */
export async function authenticate(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (USE_MOCK) {
    await delay(700);
    if (normalizedEmail !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      return { ok: false, error: 'Invalid demo email or password.' };
    }
    rememberCredentials(normalizedEmail, password);
    storeSession(DEMO_EMAIL, 'Admin User', 'ADMIN');
    return { ok: true };
  }

  try {
    const res = await apiRequest<{ user: { id: string; email: string; name: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: { email: normalizedEmail, password },
    });
    rememberCredentials(normalizedEmail, password);
    storeSession(res.user.email, res.user.name, res.user.role);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message || 'Invalid email or password.' };
    }
    // Backend unreachable — fall back to the demo account so the prototype still runs.
    await delay(400);
    if (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
      rememberCredentials(normalizedEmail, password);
      storeSession(DEMO_EMAIL, 'Admin User', 'ADMIN');
      return { ok: true };
    }
    return { ok: false, error: 'Cannot reach the server. Use the demo credentials shown below.' };
  }
}

/** Read and validate the stored session. Returns null if absent or malformed. */
export function getStoredSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as DemoSession).email !== 'string' ||
      typeof (parsed as DemoSession).loginAt !== 'number'
    ) {
      return null;
    }

    return parsed as DemoSession;
  } catch {
    return null;
  }
}

/** Clear the stored session. */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore — nothing to clear.
  }
}
