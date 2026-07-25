import type { GlossaryModule } from "./types";

/** Identity and Access terms. See ./types.ts for the rules an entry must follow. */
export const IDENTITY: GlossaryModule = {
  identity: {
    term: "identity",
    definition:
      "The record of who or what an actor is, as far as a system is concerned: a username, an employee, a script, a machine. A system only knows the identity it has been shown proof of, which is why stealing that proof is the point of most attacks.",
    seeAlso: ["authentication", "credential", "directory"],
  },
  authentication: {
    term: "authentication",
    definition:
      "Proving who an actor is. A login form checking a password is authentication, and nothing else in the system means anything until this step succeeds.",
    seeAlso: ["authorization", "credential", "identity"],
  },
  authorization: {
    term: "authorization",
    definition:
      "Deciding what an already-identified actor is allowed to do. Authentication asks 'who are you'; authorization asks 'may you delete this file'. Mixing the two up is one of the most common design bugs in web applications.",
    seeAlso: ["authentication", "rbac", "least-privilege"],
  },
  credential: {
    term: "credential",
    definition:
      "Anything an actor presents to prove an identity: a password, a key file, a certificate, a fingerprint. Whoever holds a credential is treated as the person it belongs to, so a stolen one is as good as the real thing.",
    seeAlso: ["password", "authentication", "token"],
  },
  password: {
    term: "password",
    definition:
      "A secret string a person memorizes and types to prove who they are. It is the weakest common credential because people reuse it, pick guessable ones, and can be tricked into typing it into the wrong box.",
    seeAlso: ["credential", "password-hash", "mfa"],
  },
  "password-hash": {
    term: "password hash",
    definition:
      "A scrambled version of a password, produced by a one-way function so the original cannot be worked back out. Systems store the hash instead of the password so a stolen database does not hand over everyone's login directly.",
    seeAlso: ["password", "salt", "credential"],
  },
  salt: {
    term: "salt",
    definition:
      "A random value mixed into a password before it is hashed, stored alongside the result. Two people with the same password then get different hashes, so an attacker has to crack each one separately instead of all at once.",
    seeAlso: ["password-hash", "password"],
  },
  mfa: {
    term: "MFA",
    definition:
      "Multi-factor authentication. Requiring proof of more than one kind before a login succeeds: something known such as a password, something held such as a phone, something a person is such as a fingerprint. Stealing a password alone is then not enough.",
    seeAlso: ["password", "totp", "biometrics", "authentication"],
  },
  totp: {
    term: "TOTP",
    definition:
      "Time-based one-time password. The six-digit code an authenticator app shows that changes every 30 seconds. The app and the server share a secret and both compute the same code from that secret plus the current clock, so the code itself never has to travel to the phone.",
    seeAlso: ["mfa", "authentication"],
  },
  biometrics: {
    term: "biometrics",
    definition:
      "Authentication using a physical trait: fingerprint, face, iris. It is convenient and hard to guess, but a leaked fingerprint cannot be changed the way a password can, so it works best as one factor rather than the only one.",
    seeAlso: ["mfa", "authentication"],
  },
  sso: {
    term: "SSO",
    definition:
      "Single sign-on. Logging in once with one provider, then reaching many separate applications without typing a password again. It cuts password sprawl, and it also means one compromised login opens every app behind it.",
    seeAlso: ["saml", "oidc", "federation", "identity-provider"],
  },
  "identity-provider": {
    term: "identity provider",
    definition:
      "The system that holds accounts and does the actual login, then vouches for the user to other applications. Okta, Microsoft Entra ID, and Google are common ones. The applications that trust it are called service providers or relying parties.",
    seeAlso: ["sso", "saml", "oidc", "federation"],
  },
  saml: {
    term: "SAML",
    definition:
      "An older single sign-on standard where the login provider hands the application a signed XML document saying who the user is. It is common in corporate apps, and the signature checking is where the bugs usually live.",
    seeAlso: ["sso", "identity-provider", "oidc"],
  },
  oauth: {
    term: "OAuth 2.0",
    definition:
      "A standard for letting one application act on a user's behalf in another without ever seeing their password. The 'allow this app to read your calendar' screen is OAuth. It grants permission to act, not proof of who the user is.",
    seeAlso: ["oidc", "token", "access-token", "scope"],
  },
  oidc: {
    term: "OpenID Connect",
    definition:
      "A thin layer on top of OAuth 2.0 that adds proof of identity, since OAuth alone only grants permission. It is what 'Sign in with Google' actually uses, and what it returns is a signed token describing the user.",
    seeAlso: ["oauth", "jwt", "sso", "identity-provider"],
  },
  scope: {
    term: "scope",
    definition:
      "The specific list of things an OAuth permission covers, such as read a calendar but not delete from it. An app asking for wider scopes than its job needs is a red flag, and a token with wide scopes is a bigger prize when stolen.",
    seeAlso: ["oauth", "access-token", "least-privilege"],
  },
  token: {
    term: "token",
    definition:
      "A string that stands in for a login the user already did, presented on later requests so they do not re-authenticate every time. Anyone holding it is treated as that user, which is why tokens leaking into logs, URLs, and browser storage is such a problem.",
    seeAlso: ["access-token", "refresh-token", "jwt", "session"],
  },
  "access-token": {
    term: "access token",
    definition:
      "The short-lived token an application sends with each request to prove it is allowed to do something. The short lifetime is deliberate: a stolen one expires in minutes rather than staying useful forever.",
    seeAlso: ["token", "refresh-token", "oauth", "bearer-token"],
  },
  "refresh-token": {
    term: "refresh token",
    definition:
      "A long-lived token whose only job is getting fresh access tokens without making the user log in again. It is worth far more to an attacker than an access token, so it gets stored more carefully and is usually revocable.",
    seeAlso: ["access-token", "token", "oauth"],
  },
  "bearer-token": {
    term: "bearer token",
    definition:
      "A token with no extra proof attached, meaning whoever bears it gets in. It rides in an HTTP header as `Authorization: Bearer <token>`. Nothing checks that the sender is the person it was issued to, so protecting it in transit and at rest is the entire defense.",
    seeAlso: ["token", "access-token", "header"],
  },
  jwt: {
    term: "JWT",
    definition:
      "JSON Web Token. A token made of three base64 chunks separated by dots: a header, a set of statements about the user, and a signature. Those statements are encoded, not encrypted, so anyone holding the token can read what is inside it.",
    seeAlso: ["token", "claim", "oidc", "signature"],
  },
  claim: {
    term: "claim",
    definition:
      "One statement inside a token, such as the user id, an expiry time, or a role. A claim is only worth as much as the signature over it, since an unverified token is just a string the sender chose.",
    seeAlso: ["jwt", "signature", "token"],
  },
  signature: {
    term: "signature",
    definition:
      "A cryptographic stamp on a token or message that proves who issued it and that nobody edited it since. If the receiving application skips checking it, an attacker can rewrite the contents freely. That is the classic JWT flaw.",
    seeAlso: ["jwt", "claim", "saml"],
  },
  session: {
    term: "session",
    noAutoWrap: true,
    definition:
      "The server-side memory that a particular user is currently logged in, tied to an id the browser sends back on every request. It exists because HTTP forgets everything between requests, so without a session every click would need a fresh login.",
    seeAlso: ["cookie", "session-hijacking", "token"],
  },
  cookie: {
    term: "cookie",
    definition:
      "A small piece of data a website stores in the browser, which the browser sends back on every later request to that site. It is the usual carrier for a session id, which is why cookie theft and session theft are mostly the same attack.",
    seeAlso: ["session", "session-hijacking"],
  },
  "session-hijacking": {
    term: "session hijacking",
    definition:
      "Stealing a live session id or token and using it to act as that user, skipping the password entirely. MFA does not help here, because the login already happened before the theft.",
    seeAlso: ["session", "cookie", "token"],
  },
  rbac: {
    term: "RBAC",
    definition:
      "Role-based access control. Permissions attach to named roles such as viewer, editor, or admin, and people get roles instead of individual grants. It is simple to audit, and it goes wrong when everybody quietly ends up an admin.",
    seeAlso: ["authorization", "abac", "least-privilege"],
  },
  abac: {
    term: "ABAC",
    definition:
      "Attribute-based access control. Instead of fixed roles, each request is decided from attributes: the user's department, the file's sensitivity, the time of day, the device. More precise than roles and much harder to reason about when something gets wrongly denied.",
    seeAlso: ["rbac", "authorization"],
  },
  "least-privilege": {
    term: "least privilege",
    definition:
      "Giving every account only the access it needs to do its job, and nothing spare. It does not stop a break-in, it limits how far the intruder gets, which is usually the difference between an incident and a disaster.",
    seeAlso: ["authorization", "rbac", "privilege-escalation"],
  },
  "separation-of-duties": {
    term: "separation of duties",
    definition:
      "Splitting a sensitive action so no single person can finish it alone, such as one person requesting a payment and a second approving it. Fraud and quiet mistakes then need a conspiracy rather than one bad day.",
    seeAlso: ["least-privilege", "authorization"],
  },
  "privilege-escalation": {
    term: "privilege escalation",
    definition:
      "Getting more access than an account was given. Vertical escalation climbs to a more powerful account such as an administrator; horizontal escalation reaches another user's data at the same level. It is what an attacker does right after getting in.",
    seeAlso: ["least-privilege", "root", "exploit"],
  },
  "service-account": {
    term: "service account",
    definition:
      "An account used by a program rather than a person, so a script or server can log in and do its work. These are dangerous in practice: nobody watches them, their passwords rarely change, and they often hold far more access than the job needs.",
    seeAlso: ["identity", "least-privilege", "daemon"],
  },
  "zero-trust": {
    term: "zero trust",
    definition:
      "A design approach that stops treating the internal network as safe. Every request gets authenticated and authorized on its own, no matter where it came from, because being inside the office network proves nothing about who is asking.",
    seeAlso: ["authentication", "authorization", "least-privilege", "network"],
  },
  federation: {
    term: "federation",
    definition:
      "An arrangement where one organization accepts logins vouched for by another, so a contractor can use their own employer's account instead of getting a new one. It saves account sprawl, and it means trusting the other side's security as much as your own.",
    seeAlso: ["sso", "saml", "oidc", "identity-provider"],
  },
  directory: {
    term: "directory",
    definition:
      "The central database of accounts, groups, and machines an organization runs, queried whenever something needs to check who a user is or what group they belong to. Active Directory is the common one, and taking it over means owning everything that trusts it.",
    seeAlso: ["identity", "identity-provider", "ldap"],
  },
  ldap: {
    term: "LDAP",
    definition:
      "The protocol applications use to query and update a directory of users and groups, running on port 389, or 636 when wrapped in TLS. An application asking 'is this password right, and which groups is this person in' is usually asking over LDAP.",
    seeAlso: ["directory", "protocol", "port"],
  },
};
