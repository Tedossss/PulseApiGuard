const axios = require("axios")
const dns = require("node:dns")
const http = require("node:http")
const https = require("node:https")
const net = require("node:net")

const ALLOWED_METHODS = new Set(["GET", "HEAD"])

const isPrivateAddress = (address) => {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }

  if (net.isIP(address) === 6) {
    const normalized = address.toLowerCase()
    if (normalized === "::" || normalized === "::1") return true
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true
    if (/^fe[89ab]/.test(normalized)) return true
    if (normalized.startsWith("ff")) return true

    const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]
    return mappedIpv4 ? isPrivateAddress(mappedIpv4) : false
  }

  return true
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
    if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
      return callback(new Error("Target resolved to a private or unsupported address"))
    }

    if (lookupOptions.all) return callback(null, addresses)

    const selected = addresses.find(({ family }) => !lookupOptions.family || family === lookupOptions.family) || addresses[0]
    return callback(null, selected.address, selected.family)
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
