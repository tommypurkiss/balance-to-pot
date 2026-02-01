const TRUELAYER_AUTH_BASE = "https://auth.truelayer.com";
const TRUELAYER_API_BASE = "https://api.truelayer.com";

export interface TrueLayerTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface TrueLayerCard {
  account_id: string;
  card_network: string;
  card_type: string;
  currency: string;
  display_name?: string;
  partial_card_number?: string;
  name_on_card?: string;
  provider?: { display_name: string; provider_id: string };
}

export interface TrueLayerCardBalance {
  available: number;
  current: number;
  credit_limit?: number;
}

export function getTrueLayerAuthUrl(state: string): string {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const redirectUri = process.env.TRUELAYER_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      "TrueLayer OAuth not configured: TRUELAYER_CLIENT_ID and TRUELAYER_REDIRECT_URI required"
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope:
      "info cards accounts transactions balance offline_access direct_debits standing_orders products beneficiaries",
    nonce: String(Date.now()),
    enable_mock: process.env.NODE_ENV === "development" ? "true" : "false",
    enable_open_banking_providers: "true",
    enable_credentials_sharing_providers: "false",
    state,
  });

  return `${TRUELAYER_AUTH_BASE}/?${params.toString()}`;
}

export async function exchangeTrueLayerCode(
  code: string,
  redirectUri: string
): Promise<TrueLayerTokenResponse> {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("TrueLayer OAuth not configured");
  }

  const response = await fetch(`${TRUELAYER_AUTH_BASE}/connect/token`, {
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
    console.error("[TrueLayer] Token exchange failed:", {
      status: response.status,
      body: error.slice(0, 300),
    });
    throw new Error(`TrueLayer token exchange failed: ${error}`);
  }

  const tokens = await response.json();
  console.log("[TrueLayer] Token exchange success");
  return tokens;
}

export async function refreshTrueLayerToken(
  refreshToken: string
): Promise<TrueLayerTokenResponse> {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("TrueLayer OAuth not configured");
  }

  const response = await fetch(`${TRUELAYER_AUTH_BASE}/connect/token`, {
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
    throw new Error(`TrueLayer token refresh failed: ${error}`);
  }

  return response.json();
}

export interface TrueLayerCardsResult {
  cards: TrueLayerCard[];
  rawResponse: unknown;
}

export async function fetchTrueLayerCards(
  accessToken: string
): Promise<TrueLayerCardsResult> {
  const response = await fetch(`${TRUELAYER_API_BASE}/data/v1/cards`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const body = typeof data === "object" ? JSON.stringify(data) : String(data);
    const errMsg =
      (typeof data === "object" && data && "error" in data
        ? String((data as { error?: string }).error)
        : null) || response.statusText;
    console.error("[TrueLayer] Cards fetch failed:", {
      status: response.status,
      statusText: response.statusText,
      body: body.slice(0, 500),
    });
    throw new Error(`Failed to fetch TrueLayer cards: ${response.status} ${errMsg}`);
  }

  const cards = Array.isArray(data) ? data : (data as { results?: unknown[] }).results ?? data ?? [];
  const cardsArray = Array.isArray(cards) ? cards : [];

  if (!Array.isArray(cards)) {
    console.error("[TrueLayer] Unexpected cards response shape:", {
      keys: typeof data === "object" ? Object.keys(data as object) : "not-object",
      sample: JSON.stringify(data).slice(0, 300),
    });
  }

  console.log("[TrueLayer] Fetched cards:", cardsArray.length, "card(s)");
  return { cards: cardsArray, rawResponse: data };
}

export async function fetchTrueLayerCardBalance(
  accessToken: string,
  cardId: string
): Promise<TrueLayerCardBalance> {
  const response = await fetch(
    `${TRUELAYER_API_BASE}/data/v1/cards/${cardId}/balance`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch TrueLayer card balance: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.results?.[0] ?? data ?? { available: 0, current: 0 };
}
