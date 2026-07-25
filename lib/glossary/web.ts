import type { GlossaryModule } from "./types";

/** Web and HTTP terms. See ./types.ts for the rules an entry must follow. */
export const WEB: GlossaryModule = {
  http: {
    term: "HTTP",
    definition:
      "The rules a browser and a web server follow to trade pages, images, and data. The browser sends a request describing what it wants, the server sends back a response, and the exchange ends there. Runs on port 80 by default.",
    seeAlso: ["https", "http-request", "http-response", "protocol", "port"],
  },
  https: {
    term: "HTTPS",
    definition:
      "HTTP with the traffic encrypted, so anyone sitting on the wire sees scrambled bytes instead of the page. Same requests and responses underneath, wrapped in TLS, on port 443 by default.",
    seeAlso: ["http", "tls", "certificate", "port"],
  },
  url: {
    term: "URL",
    definition:
      "The full address of a thing on the web, like https://shop.example.com:443/products/42?sort=price. It names the protocol, the host, an optional port, a path to the resource, and an optional query string.",
    seeAlso: ["query-string", "http", "dns", "port"],
  },
  "query-string": {
    term: "query string",
    definition:
      "Everything after the ? in a URL, written as name=value pairs joined by &, such as ?sort=price&page=2. It carries input to the server, which makes it the first place an attacker tries changing values to see what breaks.",
    seeAlso: ["url", "parameter", "get"],
  },
  parameter: {
    term: "parameter",
    definition:
      "One named piece of input a request carries, like id=42. Parameters ride in the query string, in the request body, in cookies, and in headers, and every one of them is a spot where a server might trust data it should not.",
    seeAlso: ["query-string", "request-body", "sql-injection", "idor"],
  },
  "http-request": {
    term: "HTTP request",
    definition:
      "The message a browser or tool sends to a web server. Its first line names a method and a path, then come the headers, then an optional body. Every attack against a web app is some version of a request the developer did not expect.",
    seeAlso: ["http-response", "http-method", "http-header", "request-body"],
  },
  "http-response": {
    term: "HTTP response",
    definition:
      "The message a web server sends back. It starts with a status code saying how it went, then headers, then usually the content itself, such as HTML or JSON.",
    seeAlso: ["http-request", "status-code", "http-header"],
  },
  "http-method": {
    term: "HTTP method",
    definition:
      "The verb at the start of a request that says what the client wants done: GET to fetch, POST to submit, PUT to replace, DELETE to remove, HEAD for headers only, OPTIONS to ask what is allowed. Some servers guard POST carefully and leave the same action wide open over GET.",
    seeAlso: ["get", "post", "http-request", "rest"],
  },
  get: {
    term: "GET",
    definition:
      "The method that asks for a resource without changing anything. Its input rides in the URL, so it lands in browser history, server logs, and proxy logs, which is why passwords should never travel in a GET.",
    seeAlso: ["http-method", "post", "query-string"],
  },
  post: {
    term: "POST",
    definition:
      "The method that sends data to a server to be acted on, such as a login form or a new comment. The data rides in the request body rather than the URL, so it stays out of logs and history.",
    seeAlso: ["http-method", "get", "request-body", "csrf"],
  },
  "status-code": {
    term: "status code",
    definition:
      "The three-digit number that starts every response and says how it went: 200 OK, 301 moved, 401 not authenticated, 403 forbidden, 404 not found, 500 server error. Watching how the code changes as inputs change is how testers find behavior the developer never meant to expose.",
    seeAlso: ["http-response", "redirect", "authentication"],
  },
  "http-header": {
    term: "HTTP header",
    definition:
      "A Name: value line carrying information about a request or response rather than the content itself, such as Host: example.com or Content-Type: application/json. Headers are ordinary text sent by the client, so a server that trusts one without checking it is trusting whoever sent it.",
    seeAlso: [
      "http-request",
      "http-response",
      "user-agent",
      "content-type",
      "header",
    ],
  },
  "user-agent": {
    term: "User-Agent",
    definition:
      "The request header where a browser or tool names itself, such as Mozilla/5.0 or curl/8.4.0. It is self-reported and trivially faked, and any app that logs it and prints it back into a page has handed an attacker an input.",
    seeAlso: ["http-header", "xss"],
  },
  "content-type": {
    term: "Content-Type",
    definition:
      "The header that says what format the data is in, like text/html, application/json, or image/png. Get it wrong and a browser may render an uploaded file as a page instead of downloading it.",
    seeAlso: ["http-header", "json", "file-upload-vulnerability"],
  },
  "request-body": {
    term: "request body",
    definition:
      "The chunk of data that comes after the headers in a request, used by methods like POST and PUT. Form fields and JSON documents travel here. It is invisible in the URL bar, which fools people into thinking it is protected.",
    seeAlso: ["http-request", "post", "json", "parameter"],
  },
  cookie: {
    term: "cookie",
    definition:
      "A small piece of text a server tells the browser to store and send back on every later request to that site. It is how a site remembers who is logged in. Steal a cookie and you are that user, no password needed.",
    seeAlso: ["session", "session-id", "xss", "csrf"],
  },
  session: {
    term: "session",
    noAutoWrap: true,
    definition:
      "The server's memory of one logged-in user across many requests. HTTP forgets everything between requests, so the server keeps the state on its own side and hands the browser an identifier that points at it.",
    seeAlso: ["cookie", "session-id", "authentication", "http"],
  },
  "session-id": {
    term: "session ID",
    definition:
      "The random string that identifies one user's session, usually carried in a cookie. It has to be long and unpredictable, because anyone holding a valid one is treated as that user until it expires.",
    seeAlso: ["session", "cookie", "authentication"],
  },
  authentication: {
    term: "authentication",
    definition:
      "Proving who someone is, usually with a password, a key, or a code from a phone. It answers 'who are you', and nothing else about access makes sense until that is settled.",
    seeAlso: ["authorization", "session", "status-code"],
  },
  authorization: {
    term: "authorization",
    definition:
      "Deciding what an identified user is allowed to do. It answers 'may you'. Plenty of apps authenticate perfectly and then never check authorization, which is the hole IDOR walks through.",
    seeAlso: ["authentication", "idor"],
  },
  tls: {
    term: "TLS",
    definition:
      "The layer that encrypts a connection so eavesdroppers see nothing useful and tampering is detectable. The client and server agree on keys first, then everything after that is scrambled. HTTPS is plain HTTP running over it.",
    seeAlso: ["https", "certificate", "tcp"],
  },
  certificate: {
    term: "certificate",
    definition:
      "A signed file a server presents that ties its name to a public key, vouched for by an authority the browser already trusts. It is what stops an attacker from impersonating example.com. A browser warning means this check failed, and clicking through hands the connection to whoever is on the other end.",
    seeAlso: ["tls", "https", "intercepting-proxy"],
  },
  rest: {
    term: "REST",
    definition:
      "A common style for building web APIs where each URL names a thing and the HTTP method says what to do with it: GET /users/42 reads that user, DELETE /users/42 removes them. Predictable by design, which also makes the URLs easy for an attacker to guess.",
    seeAlso: ["api", "http-method", "endpoint", "idor"],
  },
  api: {
    term: "API",
    definition:
      "A doorway one program uses to ask another for data or actions, usually over HTTP and usually answering in JSON. APIs are built for machines, so they often skip the guardrails the human-facing site has.",
    seeAlso: ["rest", "endpoint", "json"],
  },
  endpoint: {
    term: "endpoint",
    definition:
      "One specific URL an API answers on, such as /api/v1/orders. Finding endpoints nobody linked to, like an old /api/v1/admin left in place, is a large part of testing a web app.",
    seeAlso: ["api", "rest", "url", "enumeration"],
  },
  json: {
    term: "JSON",
    definition:
      "A plain-text format for structured data, written as {\"id\": 42, \"name\": \"ada\"}. Nearly every modern API speaks it because a person can read it and a program can parse it in one line.",
    seeAlso: ["api", "content-type", "request-body"],
  },
  "web-server": {
    term: "web server",
    definition:
      "The program that listens for HTTP requests and answers them, such as nginx, Apache, or IIS. It either serves files straight off disk or hands the request to application code. Its version banner and error pages leak useful details about what is running.",
    seeAlso: ["server", "http", "reverse-proxy", "listening"],
  },
  "reverse-proxy": {
    term: "reverse proxy",
    definition:
      "A server that sits in front of other servers, takes requests from the internet, and passes them on to whichever machine should handle them. It hides the real servers, handles TLS, and spreads load. It also means the app behind it sees the proxy's address instead of the client's, unless a header carries the real one.",
    seeAlso: ["web-server", "http-header", "waf", "ssrf"],
  },
  redirect: {
    term: "redirect",
    definition:
      "A response, usually 301 or 302, telling the browser to go somewhere else, with the new address in a Location header. If an app builds that address out of user input without checking it, it will happily send visitors to an attacker's site.",
    seeAlso: ["status-code", "http-response", "url"],
  },
  html: {
    term: "HTML",
    definition:
      "The markup that describes a web page: tags like <p> and <script> wrapped around content to say what each part is. The browser reads it and builds the page from it. Anything an app drops in unescaped becomes part of the page structure instead of text.",
    seeAlso: ["dom", "javascript", "xss"],
  },
  dom: {
    term: "DOM",
    definition:
      "The live in-memory tree a browser builds from a page's HTML, which scripts can read and rewrite while the page is open. Cookies, form values, and page text all hang off it, which is why a script an attacker injects can reach every one of them.",
    seeAlso: ["html", "javascript", "xss", "same-origin-policy"],
  },
  javascript: {
    term: "JavaScript",
    definition:
      "The programming language browsers run. It handles clicks, fetches data in the background, and rewrites the page in place. It runs with the full privileges of whatever site served it, which is the entire reason XSS hurts.",
    seeAlso: ["dom", "xss", "same-origin-policy"],
  },
  "same-origin-policy": {
    term: "same-origin policy",
    definition:
      "The browser rule that a script from one site cannot read data belonging to another site. Origin means the scheme, host, and port together, so https://a.example.com and https://b.example.com count as different origins. Without this rule any page could quietly read your mail.",
    seeAlso: ["cors", "javascript", "dom", "csrf"],
  },
  cors: {
    term: "CORS",
    definition:
      "The mechanism a server uses to grant specific other origins permission to read its responses, through Access-Control-Allow-Origin headers. It is a controlled hole in the same-origin policy. A server that reflects any origin back and allows credentials has opened its data to every site on the internet.",
    seeAlso: ["same-origin-policy", "http-header", "api"],
  },
  xss: {
    term: "XSS",
    definition:
      "Cross-site scripting. An app takes attacker-supplied text and drops it into a page without escaping it, so the browser runs it as code coming from that site. The injected script can read cookies, rewrite the page, and act as the logged-in user.",
    seeAlso: ["reflected-xss", "stored-xss", "javascript", "dom", "cookie"],
  },
  "reflected-xss": {
    term: "reflected XSS",
    definition:
      "The kind of XSS where the malicious input rides in the request and comes straight back in that same response, typically from a search box echoing the query. Nothing is stored, so it needs a victim to click a crafted link.",
    seeAlso: ["xss", "stored-xss", "query-string"],
  },
  "stored-xss": {
    term: "stored XSS",
    definition:
      "The kind of XSS where the malicious input gets saved, in a comment or a profile field, and fires for everyone who later views that page. No link to send and no click to engineer, which makes it the worse of the two.",
    seeAlso: ["xss", "reflected-xss"],
  },
  "sql-injection": {
    term: "SQL injection",
    definition:
      "An app pastes user input straight into a database query, so input like ' OR '1'='1 changes what the query means instead of being treated as a value. A working one can read every row in the database and sometimes write files or run commands. The fix is parameterized queries, not filtering quotes.",
    seeAlso: ["parameter", "vulnerability", "waf"],
  },
  csrf: {
    term: "CSRF",
    definition:
      "Cross-site request forgery. An attacker's page makes a victim's browser send a request to a site the victim is logged into, and the browser attaches the cookies automatically, so the request looks legitimate. The defense is a secret token in each form that the attacker's page has no way to read.",
    seeAlso: ["cookie", "same-origin-policy", "post", "session"],
  },
  ssrf: {
    term: "SSRF",
    definition:
      "Server-side request forgery. An app fetches a URL the user supplied, so an attacker points it at addresses only the server can reach, like 127.0.0.1 or an internal admin panel. The request comes from inside the network, so the firewall never sees anything wrong.",
    seeAlso: ["url", "reverse-proxy", "loopback", "firewall"],
  },
  idor: {
    term: "IDOR",
    definition:
      "Insecure direct object reference. A request names a record by id, like /invoices/1041, and the server hands it over without checking whether this user owns it. Change the number, read someone else's data. It is one of the most common real bugs in web apps because nothing looks broken from the outside.",
    seeAlso: ["authorization", "parameter", "rest", "endpoint"],
  },
  "path-traversal": {
    term: "path traversal",
    definition:
      "An app builds a file path out of user input, so input like ../../../../etc/passwd climbs out of the intended folder and reads files elsewhere on the server. The ../ means 'go up one directory', repeated until it hits the top.",
    seeAlso: ["parameter", "web-server", "file-upload-vulnerability"],
  },
  "file-upload-vulnerability": {
    term: "file upload vulnerability",
    definition:
      "An upload feature that accepts a file it should not, then stores it somewhere the server will execute it. Upload a script, request its URL, and a photo form becomes code execution. Checking the file extension alone is not a defense.",
    seeAlso: ["web-shell", "content-type", "path-traversal"],
  },
  "web-shell": {
    term: "web shell",
    definition:
      "A small script an attacker plants on a web server that takes commands over HTTP and runs them on the host. It turns an ordinary URL into a command prompt, and it keeps working as long as the file sits there.",
    seeAlso: ["file-upload-vulnerability", "shell", "web-server"],
  },
  waf: {
    term: "WAF",
    definition:
      "Web application firewall. Software in front of an app that inspects requests and blocks the ones matching known attack patterns, like a parameter containing UNION SELECT. It buys time against sloppy attacks and gets bypassed routinely by encoding or rewording the same payload.",
    seeAlso: ["firewall", "reverse-proxy", "sql-injection"],
  },
  "burp-suite": {
    term: "Burp Suite",
    definition:
      "The tool most web testers live in. It proxies browser traffic so every request can be paused, read, edited, and replayed, and it bundles a repeater, a request fuzzer, and a scanner. The free Community edition covers the core of it.",
    seeAlso: ["intercepting-proxy", "http-request", "kali"],
  },
  "intercepting-proxy": {
    term: "intercepting proxy",
    definition:
      "A tool that sits between a browser and a server so every request stops there first and can be inspected or changed before it goes on. To do this over HTTPS it presents its own certificate, which is why the tester installs the proxy's CA certificate in the browser first. Validation done in the browser means nothing once one of these is in the path.",
    seeAlso: ["burp-suite", "certificate", "https", "http-request"],
  },
};
