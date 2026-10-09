const dns = require('dns').promises;
const net = require('net');

/**
 * Validates if an IP address string belongs to private, loopback, link-local, or restricted ranges.
 * @param {string} ip 
 * @returns {boolean} True if private/restricted, False if public.
 */
function isPrivateIp(ip) {
  if (!net.isIP(ip)) return true;

  // Normalize IPv6 mapped IPv4 addresses (e.g. ::ffff:127.0.0.1)
  let normalizedIp = ip;
  if (ip.startsWith('::ffff:')) {
    normalizedIp = ip.substring(7);
  }

  // IPv4 checks
  if (net.isIPv4(normalizedIp)) {
    const parts = normalizedIp.split('.').map(Number);
    const [a, b, c, d] = parts;

    // 0.0.0.0/8 (Broadcast/Zero)
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud Metadata)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (TEST-NET documentation)
    if (a === 192 && b === 0 && c === 2) return true;
    if (a === 198 && b === 51 && c === 100) return true;
    if (a === 203 && b === 0 && c === 113) return true;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224) return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(normalizedIp)) {
    const lower = normalizedIp.toLowerCase();
    // ::1 (Loopback)
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // :: (Unspecified)
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
    // fe80::/10 (Link-local)
    if (lower.startsWith('fe80:')) return true;
    // fc00::/7 (Unique local address)
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // ff00::/8 (Multicast)
    if (lower.startsWith('ff')) return true;

    return false;
  }

  return true;
}

/**
 * Validates a URL syntax and resolves hostname to ensure it does not target restricted IPs.
 * @param {string} urlString 
 * @returns {Promise<{ isValid: boolean, error?: string, parsedUrl?: URL, resolvedIp?: string }>}
 */
async function validateUrlSecurity(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string.' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString.trim());
  } catch (err) {
    return { isValid: false, error: 'Invalid URL format.' };
  }

  // Protocol check
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { isValid: false, error: 'Only HTTP and HTTPS protocols are supported.' };
  }

  const hostname = parsedUrl.hostname;

  // Check if hostname itself is directly an IP
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { isValid: false, error: 'Access to internal/private IP addresses is forbidden.' };
    }
    return { isValid: true, parsedUrl, resolvedIp: hostname };
  }

  // Check common internal hostname strings
  const lowerHost = hostname.toLowerCase();
  if (lowerHost === 'localhost' || lowerHost.endsWith('.local') || lowerHost.endsWith('.internal')) {
    return { isValid: false, error: 'Access to internal hostnames is forbidden.' };
  }

  // Perform DNS resolution to check actual IP
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { isValid: false, error: 'Unable to resolve domain hostname.' };
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return { isValid: false, error: `Domain resolves to a restricted IP address (${record.address}). Access forbidden.` };
      }
    }

    return { isValid: true, parsedUrl, resolvedIp: addresses[0].address };
  } catch (err) {
    return { isValid: false, error: 'DNS resolution failed for the provided domain.' };
  }
}

module.exports = {
  isPrivateIp,
  validateUrlSecurity
};
