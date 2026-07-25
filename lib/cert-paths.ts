/**
 * Certification-prep learning paths. Each maps a cert to an ordered sequence of
 * existing lesson slugs that cover its objectives. The seed builds a Path (slug
 * `<certSlug>-path`) linked to the cert, so a cert page can offer "follow the
 * path" alongside exams and quick practice. Unknown slugs are skipped at seed
 * with a warning.
 */
export interface CertPath {
  certSlug: string;
  title: string;
  description: string;
  lessonSlugs: string[];
}

export const CERT_PATHS: CertPath[] = [
  {
    certSlug: "security-plus",
    title: "Security+ Prep Path",
    description: "Everything the SY0-701 covers, in a build order that actually teaches it, not just memorization.",
    lessonSlugs: [
      "what-is-a-network", "the-osi-model", "tcp-udp-and-ports", "filesystem-and-permissions",
      "cves-and-cvss", "injection-and-xss", "hashing-and-integrity", "symmetric-vs-asymmetric",
      "pki-and-certificates", "authn-vs-authz", "mfa-done-right", "the-identity-lifecycle",
      "firewalls-and-rulesets", "ids-and-ips", "network-segmentation", "what-a-siem-does",
      "ir-lifecycle", "spf-dkim-dmarc", "phishing-and-pretexting", "risk-management", "security-frameworks",
    ],
  },
  {
    certSlug: "network-plus",
    title: "Network+ Prep Path",
    description: "The wired and wireless networking the N10-009 tests, front to back.",
    lessonSlugs: [
      "what-is-a-network", "ip-addressing-and-subnetting", "the-osi-model", "tcp-udp-and-ports",
      "how-dns-really-works", "cli-networking", "how-wifi-works", "firewalls-and-rulesets",
      "network-segmentation", "ids-and-ips", "vpns-and-zero-trust", "dhcp-and-ntp-risks",
      "monitoring-network-services", "detecting-lateral-movement",
    ],
  },
  {
    certSlug: "pentest-plus",
    title: "PenTest+ Prep Path",
    description: "Plan, recon, exploit, escalate, report. The full engagement the PT0-002 expects.",
    lessonSlugs: [
      "recon-methodology", "osint-fundamentals", "host-discovery", "port-scanning-deep-dive",
      "service-and-version-detection", "subdomain-enumeration", "sql-injection", "cross-site-scripting",
      "command-injection", "metasploit-fundamentals", "privesc-methodology", "suid-and-sudo",
      "windows-privesc-methodology", "the-report-is-the-product", "writing-a-finding",
    ],
  },
  {
    certSlug: "cysa-plus",
    title: "CySA+ Prep Path",
    description: "The analyst workflow the CS0-003 lives in: monitor, detect, hunt, respond.",
    lessonSlugs: [
      "what-a-soc-does", "alerts-and-triage", "mitre-attack-framework", "what-a-siem-does",
      "log-sources-that-matter", "writing-detection-queries", "the-hunting-mindset",
      "what-detection-engineering-is", "iocs-and-ttps", "building-a-vm-program",
      "scanning-and-authenticated-scans", "prioritizing-with-context", "ir-lifecycle",
      "detection-and-triage", "containment-and-recovery",
    ],
  },
  {
    certSlug: "isc2-cc",
    title: "Certified in Cybersecurity Prep Path",
    description: "The vendor-neutral foundations, in the order a newcomer should meet them.",
    lessonSlugs: [
      "what-is-a-network", "the-osi-model", "tcp-udp-and-ports", "filesystem-and-permissions",
      "hashing-and-integrity", "symmetric-vs-asymmetric", "authn-vs-authz", "single-sign-on-and-federation",
      "mfa-done-right", "firewalls-and-rulesets", "network-segmentation", "risk-management",
      "ir-lifecycle", "security-frameworks",
    ],
  },
  {
    certSlug: "ceh",
    title: "CEH Prep Path",
    description: "A wide sweep of the attacker's toolkit the 312-50 quizzes you on.",
    lessonSlugs: [
      "recon-methodology", "osint-fundamentals", "host-discovery", "port-scanning-deep-dive",
      "service-and-version-detection", "sql-injection", "cross-site-scripting", "metasploit-fundamentals",
      "how-passwords-are-stored", "cracking-with-hashcat", "how-wifi-works", "capturing-and-cracking",
      "privesc-methodology", "hashing-and-integrity", "ids-and-ips",
    ],
  },
  {
    certSlug: "linux-plus",
    title: "Linux+ Prep Path",
    description: "The hands-on Linux administration the XK0-005 is built on.",
    lessonSlugs: [
      "filesystem-and-permissions", "processes-and-services", "text-processing", "cli-networking",
      "bash-recon-script", "what-containers-are", "images-and-dockerfiles", "docker-compose",
      "container-security", "privesc-methodology", "suid-and-sudo", "cron-and-path",
    ],
  },
  {
    certSlug: "aws-security-specialty",
    title: "AWS Security Specialty Prep Path",
    description: "AWS identity, data protection, and detection for the SCS-C02.",
    lessonSlugs: [
      "cloud-models-and-shared-responsibility", "identity-in-the-cloud", "common-cloud-misconfigurations",
      "storage-exposure", "logging-and-monitoring", "aws-building-blocks", "aws-iam-deep-dive",
      "s3-security", "enumerating-aws-with-keys", "detection-in-aws", "encryption-at-rest-and-in-transit",
      "key-management",
    ],
  },
  {
    certSlug: "azure-az500",
    title: "Azure AZ-500 Prep Path",
    description: "Cloud identity, networking, and security operations that map to the AZ-500.",
    lessonSlugs: [
      "cloud-models-and-shared-responsibility", "identity-in-the-cloud", "common-cloud-misconfigurations",
      "logging-and-monitoring", "authn-vs-authz", "single-sign-on-and-federation", "mfa-done-right",
      "privileged-access-management", "network-segmentation", "vpns-and-zero-trust",
      "what-zero-trust-really-means", "encryption-at-rest-and-in-transit", "key-management",
    ],
  },
  {
    certSlug: "cissp",
    title: "CISSP Prep Path",
    description: "The manager's-eye view across all eight domains. Think risk and design, not keyboard.",
    lessonSlugs: [
      "risk-management", "security-frameworks", "what-grc-actually-is", "audits-and-compliance",
      "classifying-data", "data-loss-prevention", "symmetric-vs-asymmetric", "pki-and-certificates",
      "authn-vs-authz", "single-sign-on-and-federation", "privileged-access-management",
      "what-zero-trust-really-means", "the-osi-model", "firewalls-and-rulesets", "network-segmentation",
      "ir-lifecycle", "why-code-becomes-vulnerable", "security-code-review", "stride",
    ],
  },
  {
    certSlug: "casp-plus",
    title: "CASP+ Prep Path",
    description: "Senior architecture, engineering, and operations for the CAS-004.",
    lessonSlugs: [
      "what-zero-trust-really-means", "the-pillars-of-zero-trust", "microsegmentation",
      "identity-as-the-perimeter", "privileged-access-management", "symmetric-vs-asymmetric",
      "pki-and-certificates", "key-management", "firewalls-and-rulesets", "network-segmentation",
      "ir-lifecycle", "building-a-vm-program", "prioritizing-with-context", "risk-management",
      "security-frameworks", "security-code-review", "the-supply-chain-attack-surface",
    ],
  },
];
