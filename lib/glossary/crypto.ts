import type { GlossaryModule } from "./types";

/** Cryptography terms. See ./types.ts for the rules an entry must follow. */
export const CRYPTO: GlossaryModule = {
  encryption: {
    term: "encryption",
    definition:
      "Scrambling data with a secret so only someone holding the right secret can read it back. The point is confidentiality, and it is reversible by design: whoever has the key gets the original data back exactly.",
    seeAlso: ["encoding", "hashing", "key", "ciphertext"],
  },
  encoding: {
    term: "encoding",
    definition:
      "Rewriting data into a different format so a system can carry it safely, such as turning raw bytes into letters an email can survive. There is no secret involved and anyone can reverse it, so encoding protects nothing.",
    seeAlso: ["base64", "encryption", "hashing"],
  },
  base64: {
    term: "Base64",
    definition:
      "An encoding that rewrites any bytes using 64 printable characters, which is why it often ends in one or two equals signs. Attackers use it to move binary through text-only channels, and beginners mistake it for encryption constantly. It is not encryption.",
    seeAlso: ["encoding", "encryption"],
  },
  hashing: {
    term: "hashing",
    definition:
      "Running data through a one-way function that produces a fixed-length fingerprint of it. Unlike encryption there is no key and no way back: the fingerprint proves data has not changed, but it cannot rebuild the data.",
    seeAlso: ["hash-function", "encryption", "encoding"],
  },
  plaintext: {
    term: "plaintext",
    definition:
      "The readable data before encryption, or after it has been decrypted. The word does not mean text specifically: an image or a database file is plaintext until it is encrypted.",
    seeAlso: ["ciphertext", "encryption"],
  },
  ciphertext: {
    term: "ciphertext",
    definition:
      "The scrambled output of encryption. It should look like random noise, and any pattern visible in it, such as identical chunks repeating, is a sign the encryption is being used badly.",
    seeAlso: ["plaintext", "encryption", "block-cipher"],
  },
  key: {
    term: "key",
    noAutoWrap: true,
    definition:
      "The secret value that decides how data gets scrambled and unscrambled. The algorithm is usually public knowledge, so the key is the only thing standing between an attacker and the data.",
    seeAlso: [
      "encryption",
      "symmetric-encryption",
      "asymmetric-encryption",
      "entropy",
    ],
  },
  "symmetric-encryption": {
    term: "symmetric encryption",
    definition:
      "Encryption where the same key both locks and unlocks the data, like a house key that opens the door it locked. It is fast and handles bulk data well, but both sides must already share the secret, which is the hard part.",
    seeAlso: ["asymmetric-encryption", "aes", "key-exchange", "key"],
  },
  "asymmetric-encryption": {
    term: "asymmetric encryption",
    definition:
      "Encryption using a matched pair of keys, where whatever one key locks only the other can unlock. It solves the problem of talking secretly to someone met for the first time, at the cost of being far slower than symmetric encryption.",
    seeAlso: ["symmetric-encryption", "public-key", "private-key", "rsa"],
  },
  "public-key": {
    term: "public key",
    definition:
      "Half of an asymmetric key pair, meant to be handed out to anyone. People use it to encrypt messages that only the matching private key can open, and to check signatures made by that private key.",
    seeAlso: [
      "private-key",
      "asymmetric-encryption",
      "digital-signature",
      "certificate",
    ],
  },
  "private-key": {
    term: "private key",
    definition:
      "The half of an asymmetric key pair that never leaves its owner. It decrypts what the public key encrypted and produces signatures nobody else can forge, so stealing one is usually game over for that identity.",
    seeAlso: ["public-key", "asymmetric-encryption", "digital-signature"],
  },
  aes: {
    term: "AES",
    definition:
      "The Advanced Encryption Standard, the symmetric cipher behind almost all bulk encryption today: disk encryption, Wi-Fi, and the data phase of most secure connections. Common key sizes are 128 and 256 bits, and no practical break of the algorithm itself is known.",
    seeAlso: ["symmetric-encryption", "block-cipher", "iv"],
  },
  rsa: {
    term: "RSA",
    definition:
      "The classic asymmetric algorithm, built on the fact that multiplying two huge prime numbers is easy while splitting the result back apart is not. It shows up in certificates and SSH keys, though newer elliptic-curve algorithms are replacing it because they get the same strength from much smaller keys.",
    seeAlso: ["asymmetric-encryption", "public-key", "digital-signature", "ssh"],
  },
  "key-exchange": {
    term: "key exchange",
    definition:
      "The problem of getting two parties to share one secret key while an eavesdropper watches every message they send. Solving it is what lets a browser and a server that have never met start encrypting within a fraction of a second.",
    seeAlso: ["diffie-hellman", "symmetric-encryption", "tls-handshake"],
  },
  "diffie-hellman": {
    term: "Diffie-Hellman",
    definition:
      "A method where two parties each mix a private number with public values, swap the results, and independently arrive at the same shared secret. An eavesdropper sees the whole exchange and still cannot compute that secret, because the key itself never crosses the wire.",
    seeAlso: ["key-exchange", "tls-handshake", "symmetric-encryption"],
  },
  tls: {
    term: "TLS",
    definition:
      "Transport Layer Security, the protocol that wraps an ordinary connection in encryption and an identity check. It is the S in HTTPS and the reason traffic on port 443 is unreadable to anyone sitting in the middle. SSL is its dead predecessor, though people still say SSL out of habit.",
    seeAlso: ["tls-handshake", "certificate", "protocol", "port"],
  },
  "tls-handshake": {
    term: "TLS handshake",
    definition:
      "The opening negotiation of a secure connection: both sides agree on which algorithms to use, the server proves who it is with a certificate, and the two derive a shared key. Only after that does real data move, and it moves under fast symmetric encryption.",
    seeAlso: [
      "tls",
      "certificate",
      "diffie-hellman",
      "key-exchange",
      "three-way-handshake",
    ],
  },
  certificate: {
    term: "certificate",
    definition:
      "A file that binds a public key to a name, such as example.com, and carries a signature from someone vouching for that pairing. Without it, encryption alone would happily protect a conversation with an impostor.",
    seeAlso: ["certificate-authority", "public-key", "digital-signature", "tls"],
  },
  "certificate-authority": {
    term: "certificate authority",
    definition:
      "An organization that checks who someone is and then signs their certificate, so software that trusts the authority also trusts the certificate. Browsers ship with a built-in list of them, which means a few dozen companies decide what the whole web treats as genuine.",
    seeAlso: ["certificate", "pki", "digital-signature"],
  },
  pki: {
    term: "PKI",
    definition:
      "Public key infrastructure: the machinery around keys, meaning who issues certificates, who trusts whom, and how a stolen key gets revoked. The math is the easy part. PKI is the part that fails in practice.",
    seeAlso: ["certificate-authority", "certificate", "public-key"],
  },
  "digital-signature": {
    term: "digital signature",
    definition:
      "A value produced from data plus a private key that anyone can verify with the matching public key. It proves two things at once: the data came from the key's owner, and nobody changed a byte of it along the way.",
    seeAlso: ["private-key", "public-key", "hash-function", "certificate"],
  },
  "hash-function": {
    term: "hash function",
    definition:
      "A function that turns any input, one byte or one gigabyte, into a fixed-length value such as a 64-character SHA-256 fingerprint. Change one bit of the input and the output changes completely, which is what makes it a tamper check.",
    seeAlso: ["hashing", "sha", "md5", "collision"],
  },
  md5: {
    term: "MD5",
    definition:
      "An old 128-bit hash function that is broken: two different files can be crafted to produce the same MD5 value, on a laptop, in seconds. It survives as a quick file checksum, and finding it used for passwords or signatures is a finding worth writing up.",
    seeAlso: ["hash-function", "collision", "sha"],
  },
  sha: {
    term: "SHA",
    definition:
      "A family of hash functions published by NIST. SHA-1 is broken and being retired, SHA-256 and SHA-512 are the current workhorses, and SHA-3 is a newer design built on different math in case the others fall.",
    seeAlso: ["hash-function", "md5", "collision"],
  },
  collision: {
    term: "collision",
    definition:
      "Two different inputs that produce the same hash value. Collisions always exist because inputs are unlimited and outputs are not, so the real question is whether an attacker can produce one on demand. For MD5 and SHA-1 the answer is yes.",
    seeAlso: ["hash-function", "md5", "sha"],
  },
  salt: {
    term: "salt",
    definition:
      "A random value stored next to a password and mixed in before hashing, so two people who picked the same password end up with different stored hashes. It does not need to be secret. It exists to make precomputed attack tables useless.",
    seeAlso: ["rainbow-table", "hashing", "hash-function", "nonce"],
  },
  "rainbow-table": {
    term: "rainbow table",
    definition:
      "A precomputed lookup from hash values back to the passwords that made them, which turns cracking into a search instead of a computation. A salt kills the whole approach, since the attacker would need a separate table for every salt value.",
    seeAlso: ["salt", "hashing", "brute-force"],
  },
  hmac: {
    term: "HMAC",
    definition:
      "A hash of a message combined with a shared secret key, attached so the receiver can confirm the message is untouched and came from someone holding that key. A plain hash cannot do this: an attacker who rewrites the message simply recomputes the hash.",
    seeAlso: ["hash-function", "digital-signature", "key"],
  },
  entropy: {
    term: "entropy",
    definition:
      "How much genuine unpredictability a value has, counted in bits. Keys, passwords, and session tokens are only as strong as their entropy, which is why software that seeds its random numbers from the clock gets broken fast.",
    seeAlso: ["key", "nonce", "brute-force"],
  },
  nonce: {
    term: "nonce",
    definition:
      "A number used once. Protocols mix a fresh nonce into each message so an attacker cannot record a valid message and replay it later, and reusing one usually breaks whatever it was protecting.",
    seeAlso: ["iv", "salt", "entropy"],
  },
  iv: {
    term: "initialization vector",
    definition:
      "A random starting value fed into a cipher so encrypting the same data twice produces different output. It travels in the clear beside the ciphertext, and reusing an IV with the same key leaks patterns that can unravel the messages.",
    seeAlso: ["nonce", "block-cipher", "aes", "ciphertext"],
  },
  "block-cipher": {
    term: "block cipher",
    definition:
      "A cipher that encrypts fixed-size chunks at a time, such as the 16-byte blocks AES uses. Data that does not divide evenly into blocks gets padded, and how the blocks are chained together matters as much as the cipher itself.",
    seeAlso: ["stream-cipher", "aes", "padding", "iv"],
  },
  "stream-cipher": {
    term: "stream cipher",
    definition:
      "A cipher that generates a keystream and combines it with the data one byte at a time, so nothing needs padding and the output is exactly as long as the input. It suits continuous traffic like voice, and it fails badly if the same keystream is ever used twice.",
    seeAlso: ["block-cipher", "nonce", "padding"],
  },
  padding: {
    term: "padding",
    definition:
      "Extra bytes added to data so it fills a whole cipher block, following a scheme that says how to strip them off again. It sounds like bookkeeping, but a server that reveals whether padding was valid can be pushed into decrypting messages for an attacker.",
    seeAlso: ["block-cipher", "ciphertext"],
  },
  "brute-force": {
    term: "brute force",
    definition:
      "Trying every possible key or password until one works. It always works eventually, so security rests on making eventually longer than the attacker's lifetime: guessing a 256-bit key is not a matter of buying faster hardware.",
    seeAlso: ["key", "entropy", "rainbow-table"],
  },
};
