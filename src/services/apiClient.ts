/**
 * Clean API service layer for TexFlow.
 *
 * The TexFlow backend is not available yet, so every service currently resolves
 * from mock fixtures in `src/services/fixtures`. Components never fetch or touch
 * a database directly — they only call the service functions in `src/services`.
 *
 * To go live: set `USE_MOCK` to false. Each service method already contains the
 * REST path it will call through `apiRequest`, so no component code changes.
 */

export const API_BASE_URL = '/api';

/**
 * Master switch between local fixtures and the REST backend.
 * Defaults to the live backend (false). Set `VITE_USE_MOCK=true` in a
 * `.env.local` file to run the UI purely on fixtures.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Demo account credentials (also shown on the login screen). */
export const DEMO_EMAIL = 'admin@texflow.demo';
export const DEMO_PASSWORD = 'TexFlowDemo123!';

/**
 * Credentials of the most recent successful sign-in, kept in memory only so a
 * silent re-authentication preserves the signed-in user's role. Falls back to
 * the demo admin when the page was reloaded (memory cleared) but a session
 * marker still exists in localStorage.
 */
let lastCredentials: { email: string; password: string } | null = null;

export function rememberCredentials(email: string, password: string): void {
  lastCredentials = { email, password };
}

/** POST /api/auth/login without going through apiRequest (avoids recursion). */
async function loginRequest(email: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

let authRefresh: Promise<boolean> | null = null;

/**
 * Re-establishes the httpOnly session cookie. Parallel 401s share one login
 * request so a burst of page-load calls triggers a single sign-in.
 */
function refreshAuthCookie(): Promise<boolean> {
  if (!authRefresh) {
    const credentials = lastCredentials ?? { email: DEMO_EMAIL, password: DEMO_PASSWORD };
    authRefresh = loginRequest(credentials.email, credentials.password);
    authRefresh.then(
      () => {
        authRefresh = null;
      },
      () => {
        authRefresh = null;
      }
    );
  }
  return authRefresh;
}

/** Simulates network latency so loading states behave like the real thing. */
export function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

function send(path: string, options: RequestOptions): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
}

async function readError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    if (payload?.error?.message) message = payload.error.message;
  } catch {
    // Response had no JSON body — keep the generic message.
  }
  return new ApiError(message, response.status);
}

/**
 * Thin fetch wrapper for the backend. Sends cookies so the httpOnly access
 * token set by `POST /api/auth/login` authenticates every call.
 *
 * If the session cookie is missing or expired (a 401), the client silently
 * re-authenticates once and retries the request, so the UI never shows an
 * authentication error during a long demo.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options);

  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await refreshAuthCookie();
    if (refreshed) {
      response = await send(path, options);
    }
  }

  if (!response.ok) {
    throw await readError(response);
  }

  return (await response.json()) as T;
}

/** Returns a shallow copy of a fixture list so callers can never mutate it. */
export function cloneFixtures<T>(fixtures: T[]): T[] {
  return fixtures.map((item) => ({ ...item }));
}
