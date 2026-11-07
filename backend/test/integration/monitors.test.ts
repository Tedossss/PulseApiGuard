import { after, afterEach, before, describe, it } from "node:test"
import assert from "node:assert/strict"
import mongoose from "mongoose"
import EndpointMonitor from "../../src/models/EndpointMonitor"
import MonitoringLog from "../../src/models/MonitoringLog"
import {
  api,
  monitorBody,
  setupIntegration,
  signUp,
  skipReason,
  teardownIntegration,
} from "./helpers"

describe("monitor API", { skip: skipReason }, () => {
  before(setupIntegration)
  after(teardownIntegration)
  afterEach(() => {
    delete process.env.MAX_MONITORS_PER_USER
  })

  it("creates, lists, updates and deletes a monitor for its owner", async () => {
    const owner = await signUp()

    const created = await api()
      .post("/api/monitor/add")
      .set("Cookie", owner.cookie)
      .send(monitorBody({ user: "someone-else" }))
      .expect(201)
    const monitorId = created.body.endpoint._id
    assert.equal(created.body.endpoint.user, owner.id, "owner comes from the session, not the body")
    assert.equal(created.body.endpoint.status, "PENDING")

    const list = await api().get("/api/monitor").set("Cookie", owner.cookie).expect(200)
    assert.deepEqual(
      list.body.map((monitor: { _id: string }) => monitor._id),
      [monitorId],
    )

    const updated = await api()
      .put(`/api/monitor/${monitorId}`)
      .set("Cookie", owner.cookie)
      .send({ interval: 300, method: "head" })
      .expect(200)
    assert.equal(updated.body.endpoint.interval, 300)
    assert.equal(updated.body.endpoint.method, "HEAD")
    assert.equal(updated.body.endpoint.url, "https://example.com/health")

    await api().delete(`/api/monitor/${monitorId}`).set("Cookie", owner.cookie).expect(200)
    await api().get(`/api/monitor/${monitorId}`).set("Cookie", owner.cookie).expect(404)
  })

  it("hides and protects monitors from other users", async () => {
    const owner = await signUp()
    const intruder = await signUp()
    const created = await api()
      .post("/api/monitor/add")
      .set("Cookie", owner.cookie)
      .send(monitorBody())
      .expect(201)
    const path = `/api/monitor/${created.body.endpoint._id}`

    const list = await api().get("/api/monitor").set("Cookie", intruder.cookie).expect(200)
    assert.deepEqual(list.body, [])

    await api().get(path).set("Cookie", intruder.cookie).expect(403)
    await api().put(path).set("Cookie", intruder.cookie).send({ name: "Hijacked" }).expect(403)
    await api().delete(path).set("Cookie", intruder.cookie).expect(403)

    const stored = await EndpointMonitor.findById(created.body.endpoint._id).lean()
    assert.equal(stored?.name, "Example API")
  })

  it("rejects unsafe targets and malformed input", async () => {
    const owner = await signUp()
    const cases: Array<[Record<string, unknown>, RegExp]> = [
      [monitorBody({ url: "http://127.0.0.1:27017" }), /Private or local/],
      [monitorBody({ url: "http://metadata.internal/latest" }), /Private or local/],
      [monitorBody({ url: "file:///etc/passwd" }), /Only HTTP and HTTPS/],
      [monitorBody({ method: "POST" }), /Only GET and HEAD/],
      [monitorBody({ interval: 5 }), /30 to 86400/],
    ]

    for (const [body, message] of cases) {
      const response = await api()
        .post("/api/monitor/add")
        .set("Cookie", owner.cookie)
        .send(body)
        .expect(400)
      assert.match(response.body.error, message)
    }

    await api().put("/api/monitor/not-an-id").set("Cookie", owner.cookie).send({}).expect(400)
    const badJson = await api()
      .post("/api/monitor/add")
      .set("Cookie", owner.cookie)
      .set("Content-Type", "application/json")
      .send("{not json")
      .expect(400)
    assert.equal(badJson.body.error, "Request body must be valid JSON")
  })

  it("enforces the per-user monitor limit", async () => {
    process.env.MAX_MONITORS_PER_USER = "2"
    const owner = await signUp()

    for (let index = 0; index < 2; index += 1) {
      await api()
        .post("/api/monitor/add")
        .set("Cookie", owner.cookie)
        .send(monitorBody({ name: `API ${index}` }))
        .expect(201)
    }

    const rejected = await api()
      .post("/api/monitor/add")
      .set("Cookie", owner.cookie)
      .send(monitorBody())
      .expect(409)
    assert.equal(rejected.body.code, "MONITOR_LIMIT_REACHED")
  })

  it("keeps the monitor limit under concurrent creates", async () => {
    process.env.MAX_MONITORS_PER_USER = "3"
    const owner = await signUp()

    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        api()
          .post("/api/monitor/add")
          .set("Cookie", owner.cookie)
          .send(monitorBody({ name: `Parallel ${index}` })),
      ),
    )

    const statuses = responses.map((response) => response.status)
    assert.equal(statuses.filter((status) => status === 201).length, 3, statuses.join(","))
    assert.equal(statuses.filter((status) => status === 409).length, 5, statuses.join(","))
    assert.equal(await EndpointMonitor.countDocuments({ user: owner.id }), 3)
  })

  it("removes check history together with the monitor", async () => {
    const owner = await signUp()
    const created = await api()
      .post("/api/monitor/add")
      .set("Cookie", owner.cookie)
      .send(monitorBody())
      .expect(201)
    const monitorId = new mongoose.Types.ObjectId(String(created.body.endpoint._id))
    await MonitoringLog.create([
      { monitor: monitorId, statusCode: 200, success: true, responseTime: 40 },
      { monitor: monitorId, statusCode: 503, success: false, responseTime: 90 },
    ])

    await api().delete(`/api/monitor/${monitorId}`).set("Cookie", owner.cookie).expect(200)
    assert.equal(await MonitoringLog.countDocuments({ monitor: monitorId }), 0)
  })
})
