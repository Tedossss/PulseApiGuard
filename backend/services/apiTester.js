const axios = require("axios")
const dns = require("node:dns")
const http = require("node:http")
const https = require("node:https")
const net = require("node:net")
const ipaddr = require("ipaddr.js")

const ALLOWED_METHODS = new Set(["GET", "HEAD"])

const isPrivateAddress = (address) => {
  if (!net.isIP(address)) return true

  try {
    const parsed = ipaddr.parse(address)

    // Reject every mapped/translated representation. DNS A records still arrive
    // as regular IPv4 addresses, while mapped forms create SSRF ambiguity.
    if (parsed.kind() === "ipv6" && parsed.isIPv4MappedAddress()) return true

    // ipaddr.js classifies loopback, private, link-local, carrier-grade NAT,
    // documentation, benchmarking, multicast, reserved and translation ranges.
    return parsed.range() !== "unicast"
  } catch {
    return true
  }
}

const selectSafeLookupAddress = (addresses, lookupOptions = {}) => {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error("Target did not resolve to an address")
  }

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Target resolved to a private or unsupported address")
  }

  return addresses.find(({ family }) => !lookupOptions.family || family === lookupOptions.family) || addresses[0]
}

const normalizeTargetUrl = (value) => {
  let target

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

const normalizeMethod = (value) => {
  const method = String(value || "GET").toUpperCase()
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error("Only GET and HEAD checks are allowed")
  }
  return method
}

const safeLookup = (hostname, options, callback) => {
  const lookupOptions = typeof options === "object" ? options : { family: options }

  dns.lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) return callback(error)
    try {
      const selected = selectSafeLookupAddress(addresses, lookupOptions)
      if (lookupOptions.all) return callback(null, addresses)
      return callback(null, selected.address, selected.family)
    } catch (lookupError) {
      return callback(lookupError)
    }
  })
}

const httpAgent = new http.Agent({ lookup: safeLookup })
const httpsAgent = new https.Agent({ lookup: safeLookup })

const testApiEndpoint = async (monitor) => {
  const start = Date.now()

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

    const responseTime = Date.now() - start
    return {
      statusCode: response.status,
      success: response.status === monitor.expectedStatus,
      responseTime,
      message: "OK",
    }
  } catch (error) {
    return {
      statusCode: error.response?.status ?? null,
      success: false,
      responseTime: Date.now() - start,
      message: error.message,
    }
  }
}

module.exports = testApiEndpoint
module.exports.isPrivateAddress = isPrivateAddress
module.exports.normalizeTargetUrl = normalizeTargetUrl
module.exports.normalizeMethod = normalizeMethod
module.exports.selectSafeLookupAddress = selectSafeLookupAddress
