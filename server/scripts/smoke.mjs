import 'dotenv/config';
import assert from 'node:assert/strict';
const base = `http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || '4000'}`;
const health = await fetch(`${base}/api/health`);
assert.equal(health.status, 200);
assert.equal((await health.json()).database, 'up');
console.log(`Live health verified: ${base}/api/health`);
for (const role of ['patient', 'doctor', 'admin']) {
  const response = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${role}@demo.ruralcare.test`, password: process.env[`DEMO_${role.toUpperCase()}_PASSWORD`] })
  });
  assert.equal(response.status, 200, `${role} login failed`);
  const login = await response.json();
  assert.equal(login.user.role, role);
  const headers = { Authorization: `Bearer ${login.token}` };
  const me = await fetch(`${base}/api/auth/me`, { headers }); assert.equal(me.status, 200);
  assert.equal((await me.json()).user.role, role);
  const logout = await fetch(`${base}/api/auth/logout`, { method: 'POST', headers }); assert.equal(logout.status, 204);
  const revoked = await fetch(`${base}/api/auth/me`, { headers }); assert.equal(revoked.status, 401);
  console.log(`Live ${role} authentication, /me, logout and revocation verified.`);
}
