import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMonzoAccounts, MonzoForbiddenError } from "@/lib/api/monzo";
import { syncMonzoToDb } from "@/lib/monzo/sync";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pendingId = searchParams.get("pending_id");

  if (!pendingId) {
    return NextResponse.json(
      { error: "missing_pending_id", pending: false },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", pending: false },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data: pending, error: fetchError } = await admin
    .from("monzo_pending_approvals")
    .select("id, user_id, access_token, refresh_token, token_expiry")
    .eq("id", pendingId)
    .single();

  if (fetchError || !pending) {
    return NextResponse.json(
      { error: "pending_not_found", pending: false },
      { status: 404 }
    );
  }

  if (pending.user_id !== user.id) {
    return NextResponse.json(
      { error: "forbidden", pending: false },
      { status: 403 }
    );
  }

  try {
    await fetchMonzoAccounts(pending.access_token);
  } catch (err) {
    if (err instanceof MonzoForbiddenError) {
      return NextResponse.json({ pending: true });
    }
    throw err;
  }

  const expiresIn = Math.floor(
    (new Date(pending.token_expiry).getTime() - Date.now()) / 1000
  );
  if (expiresIn <= 0) {
    await admin
      .from("monzo_pending_approvals")
      .delete()
      .eq("id", pendingId);
    return NextResponse.json(
      { error: "token_expired", pending: false },
      { status: 400 }
    );
  }

  await syncMonzoToDb(
    {
      access_token: pending.access_token,
      refresh_token: pending.refresh_token,
      expires_in: expiresIn,
    },
    user.id
  );

  await admin
    .from("monzo_pending_approvals")
    .delete()
    .eq("id", pendingId);

  return NextResponse.json({ success: true, pending: false });
}
