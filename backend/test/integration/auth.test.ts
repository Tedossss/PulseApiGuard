import { after, before, beforeEach, describe, it } from "node:test"
import assert from "node:assert/strict"
import { api, resetRateLimits, setupIntegration, skipReason, teardownIntegration } from "./helpers"

describe("auth API", { skip: skipReason }, () => {
  before(setupIntegration)
  after(teardownIntegration)
  beforeEach(resetRateLimits)

  const credentials = { email: "Owner@Example.com", password: "correct-horse-battery" }

  it("registers a user once and rejects duplicates", async () => {
    const created = await api().post("/api/auth/register").send(credentials).expect(201)
    assert.equal(created.body.email, "owner@example.com")
    assert.equal(created.body.password, undefined)

    const duplicate = await api().post("/api/auth/register").send(credentials).expect(409)
    assert.deepEqual(duplicate.body, { error: "An account already exists for this email" })
  })

  it("validates registration input", async () => {
    const response = await api()
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "short" })
      .expect(400)
    assert.equal(response.body.error, "A valid email is required")
  })

  it("rejects a wrong password without revealing which field was wrong", async () => {
    const response = await api()
      .post("/api/auth/login")
      .send({ ...credentials, password: "wrong-password" })
      .expect(400)
    assert.equal(response.body.error, "Invalid credentials")
    assert.equal(response.get("Set-Cookie"), undefined)
  })

  it("signs in with an HttpOnly session cookie and signs out", async () => {
    const login = await api().post("/api/auth/login").send(credentials).expect(200)
    const setCookie = login.get("Set-Cookie")?.[0] ?? ""
    assert.match(setCookie, /^pulseguard_session=/)
    assert.match(setCookie, /HttpOnly/)
    assert.match(setCookie, /SameSite=Strict/)

    const cookie = setCookie.split(";")[0]!
    const session = await api().get("/api/auth/session").set("Cookie", cookie).expect(200)
    assert.equal(session.body.email, "owner@example.com")

    const logout = await api().post("/api/auth/logout").set("Cookie", cookie).expect(204)
    assert.match(logout.get("Set-Cookie")?.[0] ?? "", /Max-Age=0/)
  })

  it("requires a valid session for protected routes", async () => {
    await api().get("/api/auth/session").expect(401)
    const forged = await api()
      .get("/api/monitor")
      .set("Cookie", "pulseguard_session=not-a-jwt")
      .expect(401)
    assert.equal(forged.body.error, "Invalid or expired session")
  })

  it("rate limits repeated authentication attempts", async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await api()
        .post("/api/auth/login")
        .send({ ...credentials, password: "wrong-password" })
    }
    const limited = await api().post("/api/auth/login").send(credentials).expect(429)
    assert.equal(limited.body.code, "RATE_LIMITED")
  })
})
