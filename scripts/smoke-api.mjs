import assert from "node:assert/strict";
import { handler } from "../netlify/functions/api.mjs";

const call = async (method, path, { body, cookie, query } = {}) => {
  const result = await handler({
    httpMethod: method,
    path: `/api${path}`,
    body: body ? JSON.stringify(body) : null,
    headers: cookie ? { cookie } : {},
    queryStringParameters: query ?? {},
  });
  return {
    status: result.statusCode,
    payload: JSON.parse(result.body),
    cookie: result.headers?.["Set-Cookie"],
  };
};

const suffix = Date.now();
const adminEmail = `admin.${suffix}@phase2.test`;
const donorEmail = `donor.${suffix}@phase2.test`;

const health = await call("GET", "/health");
assert.equal(health.status, 200);

const googleConfig = await call("GET", "/auth/google-config");
assert.equal(googleConfig.status, 200);
assert.equal(typeof googleConfig.payload.data.ready, "boolean");
assert.equal(googleConfig.payload.data.ready, Boolean(googleConfig.payload.data.clientId));

const billingConfig = await call("GET", "/billing/config");
assert.equal(billingConfig.status, 200);
assert.equal(typeof billingConfig.payload.data.ready, "boolean");

const adminRegistration = await call("POST", "/auth/register-masjid", {
  body: {
    masjidName: "Phase 2 QA Masjid",
    country: "Pakistan",
    city: "Islamabad",
    address: "QA Street",
    timezone: "Asia/Karachi",
    calculationMethod: "Karachi",
    asrMethod: "Hanafi",
    adminName: "QA Admin",
    adminEmail,
    password: "StrongPass123!",
  },
});
assert.equal(adminRegistration.status, 201);
assert.equal(adminRegistration.payload.data.user.role, "admin");

const adminCookie = adminRegistration.cookie.split(";")[0];
const masjidId = adminRegistration.payload.data.masjids[0].id;
const session = await call("GET", "/auth/me", { cookie: adminCookie });
assert.equal(session.payload.data.user.email, adminEmail);

const inactiveBilling = await call("GET", "/billing/status", { cookie: adminCookie });
assert.equal(inactiveBilling.status, 200);
assert.equal(inactiveBilling.payload.data.status, "inactive");
assert.equal(inactiveBilling.payload.data.checkoutReady, Boolean(process.env.STRIPE_SECRET_KEY));

const invalidCheckout = await call("POST", "/billing/checkout", {
  cookie: adminCookie,
  body: { planId: "enterprise" },
});
assert.equal(invalidCheckout.status, 422);

if (!process.env.STRIPE_SECRET_KEY) {
  const unavailableCheckout = await call("POST", "/billing/checkout", {
    cookie: adminCookie,
    body: { planId: "growth" },
  });
  assert.equal(unavailableCheckout.status, 503);
}

const settings = await call("PATCH", "/settings", {
  cookie: adminCookie,
  body: { masjidId, city: "Rawalpindi" },
});
assert.equal(settings.payload.data.city, "Rawalpindi");

const adminDonation = await call("POST", "/donations", {
  cookie: adminCookie,
  body: {
    masjidId,
    donorName: "QA Donor",
    donorEmail,
    fund: "General",
    amount: 250,
    method: "Cash",
    status: "Completed",
  },
});
assert.equal(adminDonation.status, 201);
assert.equal(adminDonation.payload.data.status, "Completed");

const dashboard = await call("GET", "/dashboard", { cookie: adminCookie, query: { masjidId } });
assert.equal(dashboard.status, 200);
assert.equal(dashboard.payload.data.stats.totalDonations, 250);

const donorRegistration = await call("POST", "/auth/register-donor", {
  body: {
    name: "QA Donor",
    email: donorEmail,
    phone: "+92 300 0000000",
    password: "StrongPass123!",
    masjidId,
  },
});
assert.equal(donorRegistration.status, 201);
assert.equal(donorRegistration.payload.data.user.role, "donor");

const donorCookie = donorRegistration.cookie.split(";")[0];
const donorDonation = await call("POST", "/donations", {
  cookie: donorCookie,
  body: { masjidId, fund: "Sadaqah", amount: 100, method: "Card" },
});
assert.equal(donorDonation.status, 201);
assert.equal(donorDonation.payload.data.status, "Pending");
assert.equal(donorDonation.payload.data.receiptId, "Pending");

const recurring = await call("POST", "/recurring-donations", {
  cookie: donorCookie,
  body: { masjidId, fund: "Sadaqah", amount: 100, frequency: "Monthly" },
});
assert.equal(recurring.status, 201);
assert.equal(recurring.payload.data.status, "Active");

const donorHistory = await call("GET", "/donations", { cookie: donorCookie, query: { masjidId } });
assert.equal(donorHistory.status, 200);
assert.equal(donorHistory.payload.data.length, 2);

const forbiddenDashboard = await call("GET", "/dashboard", { cookie: donorCookie, query: { masjidId } });
assert.equal(forbiddenDashboard.status, 403);

const forbiddenBilling = await call("GET", "/billing/status", { cookie: donorCookie });
assert.equal(forbiddenBilling.status, 403);

await call("POST", "/auth/logout", { cookie: donorCookie, body: {} });
const afterLogout = await call("GET", "/auth/me", { cookie: donorCookie });
assert.equal(afterLogout.status, 401);

console.log("MasjidPro API smoke tests passed.");
