import { CONFIG } from '../config.js';

/**
 * Air-Gapped Zero-Trust IP Allowlist Middleware for AI Gateway
 * Ensures only authorized team IPs can access AI query endpoints.
 */
export function ipAllowlist(req, res, next) {
  // Normalize IPv6 mapped IPv4 addresses (e.g. ::ffff:192.168.1.100 -> 192.168.1.100)
  let clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  const allowedIps = CONFIG.ALLOWED_IPS || ['127.0.0.1', '::1', 'localhost'];

  // Check if allowlist includes wildcard '*' or exact IP match or subnet prefix match
  const isAllowed = allowedIps.some(allowed => {
    if (allowed === '*' || allowed === '0.0.0.0/0') return true;
    if (allowed === clientIp) return true;
    if (clientIp === '127.0.0.1' || clientIp === '::1') return true; // Always allow local host
    if (allowed.endsWith('*')) {
      const prefix = allowed.slice(0, -1);
      return clientIp.startsWith(prefix);
    }
    return false;
  });

  if (!isAllowed) {
    return res.status(403).json({
      error: 'AIR_GAP_IP_FORBIDDEN',
      message: `Access denied. Your IP (${clientIp}) is not in the SākshyaChain AI Gateway allowlist.`,
      clientIp,
      allowedIps
    });
  }

  req.clientIp = clientIp;
  next();
}
