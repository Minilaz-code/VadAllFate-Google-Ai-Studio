/**
 * V2 session credentials (Host-controlled authentication).
 *
 * The browser NEVER chooses its own identity or role. A session token is only obtained by
 * presenting either (a) the local Host bootstrap key held by the person who launched the
 * Python runtime, or (b) a single-use invite code provisioned by the Host. The role carried by
 * the signed token is what the Python backend enforces; UI role switches never grant authority.
 *
 * Tokens are held in sessionStorage (cleared when the tab closes) - never localStorage and
 * never embedded in the built bundle.
 */

const STORAGE_KEY = 'vadallfate.v2.session';
const FRAGMENT_PARAM = 'vf_host_key';

export interface V2SessionTokens {
  /** Token whose signed role is `dm` (Host DM). */
  dm?: string;
  /** Token whose signed role is `player` or `observer`. */
  player?: string;
  displayName?: string;
  isHost?: boolean;
}

function apiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_VADALLFATE_V2_API_URL;
  return typeof envUrl === 'string' && envUrl ? envUrl.replace(/\/$/, '') : 'http://127.0.0.1:8765/api/v2';
}

function storage(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

let memoryTokens: V2SessionTokens = {};

export function getStoredSession(): V2SessionTokens {
  const s = storage();
  if (!s) return memoryTokens;
  try {
    const raw = s.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as V2SessionTokens) : {};
  } catch {
    return {};
  }
}

function saveSession(tokens: V2SessionTokens): void {
  memoryTokens = tokens;
  const s = storage();
  if (s) s.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearV2Session(): void {
  memoryTokens = {};
  storage()?.removeItem(STORAGE_KEY);
}

export function hasV2Session(): boolean {
  const t = getStoredSession();
  return Boolean(t.dm || t.player);
}

/** Token matching the effective UI role; falls back to whatever credential exists. */
export function getV2Token(role?: string): string | undefined {
  const t = getStoredSession();
  if (role === 'dm' || role === 'dm_host') return t.dm;
  if (role === 'player' || role === 'observer') return t.player ?? undefined;
  return t.dm ?? t.player;
}

export function v2SessionHeaders(role?: string): Record<string, string> {
  const token = getV2Token(role);
  return token ? { 'X-VadAllFate-Session-Token': token } : {};
}

async function postSession(body: Record<string, unknown>): Promise<any> {
  const resp = await fetch(`${apiBase()}/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || typeof data.sessionToken !== 'string') {
    throw new Error(data?.message || `Authentication failed (HTTP ${resp.status})`);
  }
  return data;
}

/** Exchange the Host bootstrap key for a DM session and a Host-as-Player session. */
export async function loginWithHostKey(
  bootstrapKey: string,
  playerCharacterId: string = 'char-lyra-01'
): Promise<V2SessionTokens> {
  const dm = await postSession({ bootstrapKey, role: 'dm_host', actorId: 'dm-1', isHost: true });
  const player = await postSession({
    bootstrapKey,
    role: 'player',
    actorId: playerCharacterId,
    isHost: true,
    assignedCharacterId: playerCharacterId,
  });
  const tokens: V2SessionTokens = {
    dm: dm.sessionToken,
    player: player.sessionToken,
    displayName: dm.displayName,
    isHost: true,
  };
  saveSession(tokens);
  return tokens;
}

/** Redeem a Host-provisioned single-use invite; the backend decides the role, not the client. */
export async function loginWithInvite(inviteCode: string): Promise<V2SessionTokens> {
  const res = await postSession({ inviteCode });
  const tokens: V2SessionTokens = { displayName: res.displayName, isHost: Boolean(res.isHost) };
  if (res.role === 'dm') tokens.dm = res.sessionToken;
  else tokens.player = res.sessionToken;
  saveSession(tokens);
  return tokens;
}

/**
 * The Windows launcher opens the UI as `http://127.0.0.1:3000/#vf_host_key=...`.
 * URL fragments are never sent to the server. The key is consumed once and removed from the URL.
 */
export function consumeHostKeyFromUrlFragment(): string | null {
  if (typeof window === 'undefined' || !window.location?.hash) return null;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const matchedParam = [FRAGMENT_PARAM, 'key', 'host_key'].find((k) => params.has(k));
  const key = matchedParam ? params.get(matchedParam) : null;
  if (!key) return null;
  if (matchedParam) params.delete(matchedParam);
  const rest = params.toString();
  window.history.replaceState(null, '', window.location.pathname + window.location.search + (rest ? `#${rest}` : ''));
  return key;
}

/** Revoke this browser's own server-side session(s) and forget the tokens. */
export async function logoutV2Session(): Promise<void> {
  const t = getStoredSession();
  for (const token of [t.dm, t.player]) {
    if (!token) continue;
    try {
      const verify = await fetch(`${apiBase()}/auth/verify`, {
        headers: { 'X-VadAllFate-Session-Token': token },
      });
      if (!verify.ok) continue;
      const { sessionId } = await verify.json();
      await fetch(`${apiBase()}/auth/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-VadAllFate-Session-Token': token },
        body: JSON.stringify({ targetSessionId: sessionId }),
      });
    } catch {
      /* best effort */
    }
  }
  clearV2Session();
}

/** Host-only: provision a single-use invite for a participant. */
export async function provisionInvite(input: {
  actorId: string;
  role: 'player' | 'observer';
  displayName?: string;
  assignedCharacterId?: string;
}): Promise<{ inviteCode: string }> {
  const resp = await fetch(`${apiBase()}/auth/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...v2SessionHeaders('dm') },
    body: JSON.stringify(input),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.message || `Provision failed (HTTP ${resp.status})`);
  return data;
}
