const MONZO_API_BASE = "https://api.monzo.com";
const MONZO_AUTH_BASE = "https://auth.monzo.com";

export interface MonzoTokenResponse {
  access_token: string;
  client_id: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
  user_id: string;
}

export interface MonzoAccount {
  id: string;
  description: string;
  created: string;
  type?: string;
}

export interface MonzoBalance {
  balance: number;
  total_balance: number;
  currency: string;
  spend_today: number;
}

export interface MonzoPot {
  id: string;
  name: string;
  style: string;
  balance: number;
  currency: string;
  created: string;
  updated: string;
  deleted: boolean;
}

export function getMonzoAuthUrl(state: string): string {
  const clientId = process.env.MONZO_CLIENT_ID;
  const redirectUri = process.env.MONZO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Monzo OAuth not configured: MONZO_CLIENT_ID and MONZO_REDIRECT_URI required");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });

  return `${MONZO_AUTH_BASE}/?${params.toString()}`;
}

export async function exchangeMonzoCode(
  code: string,
  redirectUri: string
): Promise<MonzoTokenResponse> {
  const clientId = process.env.MONZO_CLIENT_ID;
  const clientSecret = process.env.MONZO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Monzo OAuth not configured");
  }

  const response = await fetch(`${MONZO_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Monzo token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshMonzoToken(
  refreshToken: string
): Promise<MonzoTokenResponse> {
  const clientId = process.env.MONZO_CLIENT_ID;
  const clientSecret = process.env.MONZO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Monzo OAuth not configured");
  }

  const response = await fetch(`${MONZO_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Monzo token refresh failed: ${error}`);
  }

  return response.json();
}

export class MonzoForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonzoForbiddenError";
  }
}

export async function fetchMonzoAccounts(
  accessToken: string
): Promise<{ accounts: MonzoAccount[] }> {
  const response = await fetch(`${MONZO_API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 403) {
    throw new MonzoForbiddenError(
      "Access token has no permissions yet. The user must approve the connection in their Monzo app."
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch Monzo accounts: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchMonzoBalance(
  accessToken: string,
  accountId: string
): Promise<MonzoBalance> {
  const response = await fetch(
    `${MONZO_API_BASE}/balance?account_id=${accountId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Monzo balance: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchMonzoPots(
  accessToken: string,
  accountId: string
): Promise<{ pots: MonzoPot[] }> {
  const response = await fetch(
    `${MONZO_API_BASE}/pots?current_account_id=${accountId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Monzo pots: ${response.statusText}`);
  }

  return response.json();
}
