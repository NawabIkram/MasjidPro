import { OAuth2Client } from "google-auth-library";

let verifier;

export function getGoogleAuthConfig() {
  const clientId = String(process.env.GOOGLE_CLIENT_ID ?? "").trim();
  return { clientId, ready: Boolean(clientId) };
}

export async function verifyGoogleCredential(rawCredential) {
  const credential = String(rawCredential ?? "").trim();
  const { clientId, ready } = getGoogleAuthConfig();
  if (!ready) {
    throw Object.assign(new Error("Google Sign-In is not configured yet."), { statusCode: 503 });
  }
  if (!credential || credential.length > 16_000) {
    throw Object.assign(new Error("Google credential is invalid."), { statusCode: 401 });
  }

  verifier ??= new OAuth2Client(clientId);
  try {
    const ticket = await verifier.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new Error("Google account email is not verified.");
    }
    return {
      subject: payload.sub,
      email: payload.email,
      name: String(payload.name ?? payload.email.split("@")[0]).trim(),
    };
  } catch {
    throw Object.assign(new Error("Google Sign-In could not be verified. Please try again."), { statusCode: 401 });
  }
}
