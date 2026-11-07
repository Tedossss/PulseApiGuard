import axios from "axios"
import dns, { type LookupAddress, type LookupOptions } from "node:dns"
import http from "node:http"
import https from "node:https"
import net from "node:net"
import ipaddr from "ipaddr.js"
import { MONITOR_METHODS, type MonitorMethod } from "../models/EndpointMonitor"
import { errorMessage } from "../utils/errors"

export interface CheckTarget {
  url: string
  method?: string | null
  expectedStatus?: number | null
}

export interface CheckResult {
  statusCode: number | null
  success: boolean
  responseTime: number
  message: string
}

const ALLOWED_METHODS = new Set<string>(MONITOR_METHODS)

export const isPrivateAddress = (address: string) => {
  if (!net.isIP(address)) return true

  try {
    const parsed = ipaddr.parse(address)

    // Reject every mapped/translated representation. DNS A records still arrive
    // as regular IPv4 addresses, while mapped forms create SSRF ambiguity.
    if (parsed.kind() === "ipv6" && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) return true

    // ipaddr.js classifies loopback, private, link-local, carrier-grade NAT,
    // documentation, benchmarking, multicast, reserved and translation ranges.
    return parsed.range() !== "unicast"
  } catch {
    return true
  }
}

export const selectSafeLookupAddress = (
  addresses: LookupAddress[],
  lookupOptions: { family?: number | string } = {},
) => {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error("Target did not resolve to an address")
  }

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Target resolved to a private or unsupported address")
  }

  return (
    addresses.find(({ family }) => !lookupOptions.family || family === lookupOptions.family) ??
    addresses[0]!
  )
}

export const normalizeTargetUrl = (value: unknown) => {
  let target: URL

  try {
    target = new URL(String(value || ""))
  } catch {
    throw new Error("A valid absolute URL is required")
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    throw new Error("Only HTTP and HTTPS targets are allowed")
  }

  if (target.username || target.password) {
    throw new Error("Credentials in target URLs are not allowed")
  }

  const hostname = target.hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    (net.isIP(hostname) && isPrivateAddress(hostname))
  ) {
    throw new Error("Private or local network targets are not allowed")
  }

  return target.toString()
}

export const normalizeMethod = (value: unknown): MonitorMethod => {
  const method = String(value || "GET").toUpperCase()
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error("Only GET and HEAD checks are allowed")
  }
  return method as MonitorMethod
}

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void

const safeLookup = (
  hostname: string,
  options: LookupOptions | number,
  callback: LookupCallback,
) => {
  const lookupOptions: LookupOptions = typeof options === "object" ? options : { family: options }

  dns.lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) return callback(error, "")
    try {
      const selected = selectSafeLookupAddress(addresses, lookupOptions)
      if (lookupOptions.all) return callback(null, addresses)
      return callback(null, selected.address, selected.family)
    } catch (lookupError) {
      return callback(lookupError as NodeJS.ErrnoException, "")
    }
  })
}

const httpAgent = new http.Agent({ lookup: safeLookup as net.LookupFunction })
const httpsAgent = new https.Agent({ lookup: safeLookup as net.LookupFunction })

const testApiEndpoint = async (monitor: CheckTarget): Promise<CheckResult> => {
  const start = Date.now()
  const expectedStatus = monitor.expectedStatus ?? 200

  try {
    const url = normalizeTargetUrl(monitor.url)
    const method = normalizeMethod(monitor.method)
    const response = await axios({
      method,
      url,
      timeout: 10000,
      maxRedirects: 0,
      maxContentLength: 1024 * 1024,
      maxBodyLength: 1024 * 1024,
      proxy: false,
      httpAgent,
      httpsAgent,
      validateStatus: () => true,
    })

    return {
      statusCode: response.status,
      success: response.status === expectedStatus,
      responseTime: Date.now() - start,
      message: "OK",
    }
  } catch (error) {
    return {
      statusCode: axios.isAxiosError(error) ? (error.response?.status ?? null) : null,
      success: false,
      responseTime: Date.now() - start,
      message: errorMessage(error),
    }
  }
}

export default testApiEndpoint
