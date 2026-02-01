import { NextResponse } from "next/server";

/**
 * Debug endpoint to verify Monzo OAuth configuration.
 * Call from browser: /api/auth/monzo/check
 * Does NOT expose secrets.
 */
export async function GET() {
  const redirectUri = process.env.MONZO_REDIRECT_URI;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const hasClientId = !!process.env.MONZO_CLIENT_ID;
  const hasClientSecret = !!process.env.MONZO_CLIENT_SECRET;

  const expectedCallback = appUrl
    ? `${appUrl}/api/auth/monzo/callback`
    : "http://localhost:3000/api/auth/monzo/callback";

  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    configured: hasClientId && hasClientSecret && !!redirectUri,
    redirectUri: redirectUri || "(not set)",
    expectedCallback,
    redirectUriMatches:
      !!redirectUri &&
      redirectUri === (appUrl ? `${appUrl}/api/auth/monzo/callback` : "http://localhost:3000/api/auth/monzo/callback"),
    hasServiceRole: hasServiceRole,
    hint: !redirectUri
      ? "Set MONZO_REDIRECT_URI in .env.local (e.g. http://localhost:3000/api/auth/monzo/callback)"
      : !hasServiceRole
        ? "Set SUPABASE_SERVICE_ROLE_KEY in .env.local - required for Monzo callback"
        : redirectUri !== expectedCallback
          ? `MONZO_REDIRECT_URI must match exactly. In Monzo developer console, set redirect URL to: ${redirectUri}`
          : "Configuration looks correct. Check your terminal (npm run dev) for [Monzo callback] logs when you complete the flow.",
  });
}
