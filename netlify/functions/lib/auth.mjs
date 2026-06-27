import { promisify } from "node:util";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { deleteJSON, getJSON, setJSON } from "./storage.mjs";

const scryptAsync = promisify(scrypt);
const SESSION_COOKIE = "masjidpro_session";
const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 14;

export const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();
export const hashLookup = (value) => createHash("sha256").update(value).digest("hex");

export async function hashPassword(password) {
  if (String(password).length < 8) {
    throw Object.assign(new Error("Password must be at least 8 characters."), { statusCode: 422 });
  }

  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(String(password), salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password, encodedHash) {
  const [algorithm, salt, expectedHex] = String(encodedHash ?? "").split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;

  const actual = Buffer.from(await scryptAsync(String(password), salt, 64));
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function publicUser(user) {
  if (!user) return null;
  const { passwordHash: _passwordHash, googleSubject: _googleSubject, ...safeUser } = user;
  return safeUser;
}

export async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const lookup = await getJSON(`user-emails/${hashLookup(normalized)}`);
  return lookup?.userId ? getJSON(`users/${lookup.userId}`) : null;
}

export async function findUserByGoogleSubject(googleSubject) {
  const subject = String(googleSubject ?? "").trim();
  if (!subject) return null;
  const lookup = await getJSON(`google-subjects/${hashLookup(subject)}`);
  return lookup?.userId ? getJSON(`users/${lookup.userId}`) : null;
}

export async function createUser(input) {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw Object.assign(new Error("A valid email address is required."), { statusCode: 422 });
  }

  const emailKey = `user-emails/${hashLookup(email)}`;
  const userId = randomUUID();
  const reservation = await setJSON(emailKey, { userId }, { onlyIfNew: true });
  if (!reservation.modified) {
    throw Object.assign(new Error("An account already exists for this email."), { statusCode: 409 });
  }

  const googleSubject = String(input.googleSubject ?? "").trim();
  const googleKey = googleSubject ? `google-subjects/${hashLookup(googleSubject)}` : null;
  let googleReserved = false;
  try {
    if (!input.password && !googleSubject) {
      throw Object.assign(new Error("A password or verified Google identity is required."), { statusCode: 422 });
    }
    if (googleKey) {
      const googleReservation = await setJSON(googleKey, { userId }, { onlyIfNew: true });
      if (!googleReservation.modified) {
        throw Object.assign(new Error("This Google account is already linked to another MasjidPro account."), { statusCode: 409 });
      }
      googleReserved = true;
    }

    const passwordHash = input.password ? await hashPassword(input.password) : null;
    const authProviders = [passwordHash ? "password" : null, googleSubject ? "google" : null].filter(Boolean);
    const user = {
      id: userId,
      email,
      name: String(input.name ?? "").trim(),
      phone: String(input.phone ?? "").trim(),
      role: input.role,
      masjidIds: input.masjidIds,
      preferredMasjidId: input.preferredMasjidId ?? input.masjidIds[0],
      ...(passwordHash ? { passwordHash } : {}),
      ...(googleSubject ? { googleSubject } : {}),
      authProviders,
      createdAt: new Date().toISOString(),
    };
    await setJSON(`users/${user.id}`, user, { onlyIfNew: true });
    return user;
  } catch (error) {
    await deleteJSON(emailKey);
    if (googleReserved && googleKey) await deleteJSON(googleKey);
    throw error;
  }
}

export async function linkGoogleIdentity(user, googleSubject) {
  const subject = String(googleSubject ?? "").trim();
  if (!subject) {
    throw Object.assign(new Error("Google identity is invalid."), { statusCode: 401 });
  }
  if (user.googleSubject && user.googleSubject !== subject) {
    throw Object.assign(new Error("This email is linked to a different Google account."), { statusCode: 409 });
  }

  const subjectKey = `google-subjects/${hashLookup(subject)}`;
  const subjectOwner = await getJSON(subjectKey);
  if (subjectOwner?.userId && subjectOwner.userId !== user.id) {
    throw Object.assign(new Error("This Google account is already linked to another MasjidPro account."), { statusCode: 409 });
  }
  if (!subjectOwner) {
    await setJSON(subjectKey, { userId: user.id }, { onlyIfNew: true });
    const assignedOwner = await getJSON(subjectKey);
    if (assignedOwner?.userId !== user.id) {
      throw Object.assign(new Error("This Google account is already linked to another MasjidPro account."), { statusCode: 409 });
    }
  }

  const providers = new Set(user.authProviders ?? (user.passwordHash ? ["password"] : []));
  providers.add("google");
  const updated = { ...user, googleSubject: subject, authProviders: [...providers], updatedAt: new Date().toISOString() };
  await setJSON(`users/${user.id}`, updated);
  return updated;
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS).toISOString();
  await setJSON(`sessions/${hashLookup(token)}`, { userId, expiresAt });
  return { token, expiresAt };
}

const parseCookies = (header = "") =>
  Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, ...value]) => [key, decodeURIComponent(value.join("="))]),
  );

export async function getSessionUser(event) {
  const token = parseCookies(event.headers?.cookie ?? event.headers?.Cookie)[SESSION_COOKIE];
  if (!token) return null;

  const sessionKey = `sessions/${hashLookup(token)}`;
  const session = await getJSON(sessionKey);
  if (!session) return null;
  if (Date.parse(session.expiresAt) <= Date.now()) {
    await deleteJSON(sessionKey);
    return null;
  }

  return getJSON(`users/${session.userId}`);
}

export async function destroySession(event) {
  const token = parseCookies(event.headers?.cookie ?? event.headers?.Cookie)[SESSION_COOKIE];
  if (token) await deleteJSON(`sessions/${hashLookup(token)}`);
}

export function sessionCookie(token, event) {
  const isSecure = String(event.headers?.["x-forwarded-proto"] ?? "").includes("https") || Boolean(process.env.URL?.startsWith("https"));
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_LIFETIME_MS / 1000}${isSecure ? "; Secure" : ""}`;
}

export function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function requireUser(user, role) {
  if (!user) {
    throw Object.assign(new Error("Please sign in to continue."), { statusCode: 401 });
  }
  if (role && user.role !== role) {
    throw Object.assign(new Error("You do not have access to this action."), { statusCode: 403 });
  }
  return user;
}

export function requireMasjidAccess(user, requestedMasjidId) {
  const masjidId = requestedMasjidId || user.preferredMasjidId || user.masjidIds?.[0];
  if (!masjidId || !user.masjidIds?.includes(masjidId)) {
    throw Object.assign(new Error("You do not have access to this masjid workspace."), { statusCode: 403 });
  }
  return masjidId;
}
