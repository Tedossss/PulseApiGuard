const test = require("node:test")
const assert = require("node:assert/strict")

const {
  isPrivateAddress,
  normalizeMethod,
  normalizeTargetUrl,
} = require("../services/apiTester")
const { normalizeInterval, normalizeMonitorFields } = require("../controllers/monitorController")

test("private and local IP ranges are rejected", () => {
  for (const address of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "::1", "fd00::1"]) {
    assert.equal(isPrivateAddress(address), true, address)
  }

  assert.equal(isPrivateAddress("8.8.8.8"), false)
  assert.throws(() => normalizeTargetUrl("http://localhost:3000"), /Private or local/)
  assert.throws(() => normalizeTargetUrl("http://127.0.0.1"), /Private or local/)
  assert.throws(() => normalizeTargetUrl("http://[::1]"), /Private or local/)
})

test("monitor targets allow public HTTP URLs without credentials", () => {
  assert.equal(normalizeTargetUrl("https://example.com/health"), "https://example.com/health")
  assert.throws(() => normalizeTargetUrl("file:///etc/passwd"), /Only HTTP and HTTPS/)
  assert.throws(() => normalizeTargetUrl("https://user:pass@example.com"), /Credentials/)
})

test("monitor methods and intervals are constrained", () => {
  assert.equal(normalizeMethod("head"), "HEAD")
  assert.throws(() => normalizeMethod("POST"), /Only GET and HEAD/)
  assert.equal(normalizeInterval(-1), 1)
  assert.equal(normalizeInterval(999999), 86400)
})

test("monitor input is normalized and unknown fields are dropped", () => {
  assert.deepEqual(
    normalizeMonitorFields({
      name: "  Main API  ",
      url: "https://example.com/health",
      method: "get",
      expectedStatus: "204",
      interval: "30",
      user: "not-accepted",
    }),
    {
      url: "https://example.com/health",
      method: "GET",
      expectedStatus: 204,
      interval: 30,
      name: "Main API",
    },
  )
})
