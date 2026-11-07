import { after, before, describe, it } from "node:test"
import assert from "node:assert/strict"
import mongoose from "mongoose"
import MonitoringLog from "../../src/models/MonitoringLog"
import {
  api,
  monitorBody,
  setupIntegration,
  signUp,
  skipReason,
  teardownIntegration,
} from "./helpers"

describe("dashboard API", { skip: skipReason }, () => {
  let owner: Awaited<ReturnType<typeof signUp>>
  let monitorId: mongoose.Types.ObjectId

  before(async () => {
    await setupIntegration()
    owner = await signUp()
    const created = await api()
      .post("/api/monitor/add")
      .set("Cookie", owner.cookie)
      .send(monitorBody())
      .expect(201)
    monitorId = new mongoose.Types.ObjectId(String(created.body.endpoint._id))

    // Two logs share a timestamp so pagination has to break the tie by _id.
    const base = Date.now() - 60_000
    const timestamps = [0, 1000, 1000, 2000, 3000].map((offset) => new Date(base + offset))
    await MonitoringLog.insertMany(
      timestamps.map((createdAt, index) => ({
        monitor: monitorId,
        statusCode: index === 4 ? 503 : 200,
        success: index !== 4,
        responseTime: 40 + index,
        createdAt,
        updatedAt: createdAt,
      })),
      { timestamps: false } as never,
    )
  })
  after(teardownIntegration)

  it("pages through check history without gaps or duplicates", async () => {
    const seen: string[] = []
    let cursor: string | null = null
    let pages = 0

    do {
      const query: Record<string, string | number> = { limit: 2 }
      if (cursor) query.cursor = cursor
      const page = await api()
        .get("/api/dashboard/logs")
        .query(query)
        .set("Cookie", owner.cookie)
        .expect(200)
      seen.push(...page.body.logs.map((log: { _id: string }) => log._id))
      cursor = page.body.nextCursor
      pages += 1
    } while (cursor && pages < 10)

    assert.equal(pages, 3)
    assert.equal(seen.length, 5)
    assert.equal(new Set(seen).size, 5)
  })

  it("summarizes uptime from stored checks", async () => {
    const summary = await api()
      .get("/api/dashboard/summary")
      .set("Cookie", owner.cookie)
      .expect(200)
    assert.equal(summary.body.length, 1)
    assert.equal(summary.body[0].uptimePercentage, 80)
  })

  it("rejects malformed cursors and foreign monitor ids", async () => {
    const badCursor = await api()
      .get("/api/dashboard/logs")
      .query({ cursor: "not-a-cursor" })
      .set("Cookie", owner.cookie)
      .expect(400)
    assert.equal(badCursor.body.error, "Invalid cursor")

    const stranger = await signUp()
    await api()
      .post("/api/monitor/add")
      .set("Cookie", stranger.cookie)
      .send(monitorBody())
      .expect(201)
    await api()
      .get("/api/dashboard/logs")
      .query({ monitorId: monitorId.toString() })
      .set("Cookie", stranger.cookie)
      .expect(404)
  })

  it("reports readiness when MongoDB and Redis are reachable", async () => {
    const ready = await api().get("/api/system/ready").expect(200)
    assert.deepEqual(ready.body.checks, { mongodb: "up", redis: "up" })
    assert.equal(ready.get("Cache-Control"), "no-store")
  })
})
