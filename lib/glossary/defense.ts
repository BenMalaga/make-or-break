import type { GlossaryModule } from "./types";

/** Blue Team and Defense terms. See ./types.ts for the rules an entry must follow. */
export const DEFENSE: GlossaryModule = {
  "blue-team": {
    term: "blue team",
    definition:
      "The people defending an organization's systems: watching for attacks, responding to the ones that land, and closing the holes that let them in. The name comes from military exercises where one side attacks and the other defends.",
    seeAlso: ["soc", "incident-response"],
  },
  soc: {
    term: "SOC",
    definition:
      "Security operations center. The team, and often the room, that watches an organization's alerts and decides which ones are real attacks. Most SOCs run in shifts, because attackers do not keep office hours.",
    seeAlso: ["siem", "alert", "triage"],
  },
  siem: {
    term: "SIEM",
    definition:
      "Security information and event management. A system that pulls logs from every machine, application, and network device into one place, then runs rules against them to raise alerts. It is the screen a SOC analyst stares at all day.",
    seeAlso: ["log", "alert", "soc", "detection-rule"],
  },
  log: {
    term: "log",
    definition:
      "A file or stream where software records what happened: who signed in, which file was opened, which connection was refused. Logs are the raw material of defense, because an attack nothing recorded is an attack nobody can prove.",
    seeAlso: ["siem", "telemetry"],
  },
  telemetry: {
    term: "telemetry",
    definition:
      "The stream of events a defensive tool reports about what a machine is doing: processes started, files written, connections opened. It goes wider than ordinary logs, because much of it is collected purely for detection rather than being a byproduct of normal work.",
    seeAlso: ["edr", "log", "siem"],
  },
  alert: {
    term: "alert",
    definition:
      "A notification raised when activity matches a detection rule. An alert is a claim that something might be wrong, not proof. A human still has to look.",
    seeAlso: ["siem", "triage", "false-positive", "detection-rule"],
  },
  "alert-fatigue": {
    term: "alert fatigue",
    definition:
      "What happens when a team gets so many alerts, most of them wrong, that people stop reading them carefully. It is how real attacks get closed as noise. Cutting false positives is defensive work, not housekeeping.",
    seeAlso: ["false-positive", "alert", "tuning"],
  },
  "true-positive": {
    term: "true positive",
    definition:
      "An alert that fired and was right: something bad really did happen. It is what every detection rule is aiming for, and the count a team reports on.",
    seeAlso: ["false-positive", "alert"],
  },
  "false-positive": {
    term: "false positive",
    definition:
      "An alert that fired when nothing bad happened. A backup tool reading thousands of files looks a lot like ransomware, and an admin's cleanup script looks a lot like an attacker's. Enough of these and people stop trusting the alerts.",
    seeAlso: ["true-positive", "alert-fatigue", "tuning"],
  },
  "false-negative": {
    term: "false negative",
    definition:
      "An attack that happened and raised no alert at all. It is the most expensive kind of miss, because nobody knows to go looking.",
    seeAlso: ["false-positive", "detection-engineering", "threat-hunting"],
  },
  tuning: {
    term: "tuning",
    definition:
      "Adjusting a detection rule so it keeps catching the bad thing and stops firing on the harmless one, usually by excluding known-good software or narrowing the conditions. Rules that never get tuned get muted, and a muted rule catches nothing.",
    seeAlso: ["false-positive", "detection-rule", "alert-fatigue"],
  },
  ids: {
    term: "IDS",
    definition:
      "Intrusion detection system. Software that inspects traffic or activity and raises an alert when it matches something known to be bad. It watches and reports. It does not stop anything.",
    seeAlso: ["ips", "alert", "signature-detection"],
  },
  ips: {
    term: "IPS",
    definition:
      "Intrusion prevention system. It inspects the same things an IDS does, but it sits in the traffic path and can drop the connection instead of just reporting it. The tradeoff is that a wrong block breaks real work, so teams usually run it in report-only mode first.",
    seeAlso: ["ids", "firewall"],
  },
  "signature-detection": {
    term: "signature detection",
    definition:
      "Matching activity against a stored pattern of something already known to be malicious, such as a byte sequence inside a file or a specific request to a web server. Fast and precise on known threats, and completely blind to anything new.",
    seeAlso: ["ids", "yara", "ioc", "anomaly"],
  },
  edr: {
    term: "EDR",
    definition:
      "Endpoint detection and response. An agent installed on laptops and servers that records what programs do, flags suspicious behavior, and lets a responder cut the machine off the network remotely. It sees things the network never shows, like a document spawning a command shell.",
    seeAlso: ["xdr", "telemetry", "containment", "shell"],
  },
  xdr: {
    term: "XDR",
    definition:
      "Extended detection and response. EDR data joined with email, cloud, identity, and network data so one alert can tell a story across all of them. The point is that a phishing email, a strange sign-in, and a new process on a laptop are one incident, not three.",
    seeAlso: ["edr", "siem", "incident"],
  },
  "threat-hunting": {
    term: "threat hunting",
    definition:
      "Searching through collected data for attackers nobody alerted on, starting from a theory instead of a notification. A hunt begins with something like \"if someone were using stolen credentials, we would see sign-ins from two countries an hour apart\", then goes looking. It assumes the detections missed something, because they always do.",
    seeAlso: ["false-negative", "detection-engineering", "ttps", "baseline"],
  },
  "detection-engineering": {
    term: "detection engineering",
    definition:
      "Building, testing, and maintaining the rules that turn raw data into alerts. Good teams treat it like software: rules get version control, tests against real attack samples, and retirement when they stop earning the noise they make.",
    seeAlso: ["detection-rule", "sigma", "tuning", "mitre-attack"],
  },
  "detection-rule": {
    term: "detection rule",
    definition:
      "The written logic that decides when to raise an alert, such as \"flag any command shell launched by a Word document\". Rules live in the SIEM or the EDR and run against data as it arrives.",
    seeAlso: ["sigma", "siem", "alert", "tuning"],
  },
  sigma: {
    term: "Sigma",
    definition:
      "An open format for writing detection rules in plain YAML text, tied to no particular product. A rule written once in Sigma can be converted into the query language of whichever SIEM a team runs, which is how detections get shared publicly instead of locked inside one vendor.",
    seeAlso: ["detection-rule", "yara", "siem"],
  },
  yara: {
    term: "YARA",
    definition:
      "A tool and rule language for identifying files by what is inside them: text strings, byte patterns, and file size, combined with and/or logic. Malware analysts write YARA rules so they can still recognize a family of samples after the attacker recompiles and every file hash changes.",
    seeAlso: ["signature-detection", "file-hash", "ioc"],
  },
  "mitre-attack": {
    term: "MITRE ATT&CK",
    definition:
      "A free public catalog of what attackers actually do once they are inside, organized into tactics (the goal, such as stealing credentials) and techniques (the specific method, such as reading passwords out of memory). Defenders use it as shared vocabulary and as a checklist of what they can and cannot currently detect.",
    seeAlso: ["ttps", "kill-chain", "detection-engineering"],
  },
  ttps: {
    term: "TTPs",
    definition:
      "Tactics, techniques, and procedures. The way a particular attacker works: what they go after, the methods they use, and their habits right down to file names and timing. TTPs are far harder to change than an IP address or a file hash, which makes them the more durable thing to detect on.",
    seeAlso: ["mitre-attack", "ioc", "threat-intelligence"],
  },
  ioc: {
    term: "IOC",
    definition:
      "Indicator of compromise. A concrete artifact showing an attack touched a machine: a file hash, an IP address, a domain name, a registry key. Cheap to share and check, and cheap for the attacker to change, so a hit is a starting point rather than the whole story.",
    seeAlso: ["file-hash", "ttps", "threat-intelligence"],
  },
  "file-hash": {
    term: "file hash",
    definition:
      "A short fixed-length fingerprint calculated from a file's contents, such as a SHA-256 value. Change one byte and the hash changes completely, which is why a hash identifies one exact file, and why it is useless the moment an attacker rebuilds their tool.",
    seeAlso: ["ioc", "yara", "disk-image"],
  },
  incident: {
    term: "incident",
    definition:
      "A confirmed security event that needs a response: an attacker got in, data left, ransomware ran. The word marks the promotion from \"an alert someone is looking at\" to \"we have a problem\", and it usually pulls in more people.",
    seeAlso: ["alert", "incident-response", "triage"],
  },
  "incident-response": {
    term: "incident response",
    definition:
      "The organized work of handling a confirmed attack: working out what happened, cutting the attacker off, cleaning up, and getting back to normal. It runs under time pressure with incomplete information, which is exactly why the steps get written down in advance.",
    seeAlso: ["incident", "ir-lifecycle", "playbook"],
  },
  "ir-lifecycle": {
    term: "incident response phases",
    definition:
      "The standard stages of handling an incident, as NIST lays them out: preparation, detection and analysis, containment, eradication and recovery, then post-incident review. The order is the point, because eradicating before containing lets the attacker walk straight back in.",
    seeAlso: ["triage", "containment", "eradication", "recovery"],
  },
  triage: {
    term: "triage",
    definition:
      "The first pass over an alert: is it real, how bad is it, and does someone need to act now. Triage exists because a team gets far more alerts than it can investigate deeply, so someone has to sort fast and be right most of the time.",
    seeAlso: ["alert", "false-positive", "incident"],
  },
  containment: {
    term: "containment",
    definition:
      "Stopping an attack from spreading while the investigation is still running: pulling a machine off the network, disabling an account, blocking a domain. It buys time. It is deliberately not cleanup, because the evidence still has to survive.",
    seeAlso: ["eradication", "edr", "forensics", "ir-lifecycle"],
  },
  eradication: {
    term: "eradication",
    definition:
      "Removing the attacker's foothold for good: deleting the malware, killing the accounts they made, and closing the hole they came in through. Skipping that last part is why organizations get hit twice by the same person.",
    seeAlso: ["containment", "recovery", "vulnerability"],
  },
  recovery: {
    term: "recovery",
    definition:
      "Putting systems back into normal service after an incident and watching them closely to be sure the attacker is really gone. It often means rebuilding a machine from a known-good image rather than trusting one that was owned.",
    seeAlso: ["eradication", "ir-lifecycle"],
  },
  "post-incident-review": {
    term: "post-incident review",
    definition:
      "The session after an incident is closed where the team records what happened, what worked, and what changes. Done properly it is blameless: the goal is fixing the system that let the attack succeed, not finding a person to punish.",
    seeAlso: ["ir-lifecycle", "incident-response"],
  },
  playbook: {
    term: "playbook",
    definition:
      "A written procedure for one specific kind of incident, step by step: who to call, what to collect, what to shut off, in what order. It exists because judgment gets worse at 3 a.m. with an executive standing behind the desk.",
    seeAlso: ["incident-response", "ir-lifecycle"],
  },
  forensics: {
    term: "digital forensics",
    definition:
      "Examining machines and data to reconstruct what happened, in a way that holds up if someone challenges it later. The evidence includes deleted files, browser history, leftover traces of programs that ran, and timestamps. The whole discipline is in not changing the evidence while reading it.",
    seeAlso: ["chain-of-custody", "disk-image", "memory-dump"],
  },
  "chain-of-custody": {
    term: "chain of custody",
    definition:
      "The unbroken record of who handled a piece of evidence, when, and what they did with it. A gap in that record is the first thing an opposing lawyer attacks, and it can make otherwise solid findings worthless in court.",
    seeAlso: ["forensics", "disk-image", "write-blocker"],
  },
  "disk-image": {
    term: "disk image",
    definition:
      "A bit-for-bit copy of an entire drive, including deleted files and the unused space a normal file copy skips. Investigators work on the image and never the original, and they hash both to prove the copy matches.",
    seeAlso: ["forensics", "file-hash", "write-blocker"],
  },
  "write-blocker": {
    term: "write blocker",
    definition:
      "A hardware device or software driver that lets a computer read a drive while physically refusing any write to it. Without one, simply plugging in a suspect drive can let the operating system touch timestamps and quietly damage the evidence.",
    seeAlso: ["disk-image", "forensics", "chain-of-custody"],
  },
  "memory-dump": {
    term: "memory dump",
    definition:
      "A copy of everything in a machine's RAM at one moment. It holds what never reaches the disk: encryption keys, passwords in plain text, malware that only ever ran in memory. Power the machine off and it is gone, which is why responders grab it first.",
    seeAlso: ["order-of-volatility", "forensics", "disk-image"],
  },
  "order-of-volatility": {
    term: "order of volatility",
    definition:
      "The rule that evidence gets collected most-perishable-first: memory before live network connections, those before the disk, the disk before backups. Reboot a machine to check something and the most valuable evidence is already gone.",
    seeAlso: ["memory-dump", "forensics", "disk-image"],
  },
  "timeline-analysis": {
    term: "timeline analysis",
    definition:
      "Putting every timestamped artifact from an investigation into one ordered list so the attack reads front to back. It is how a sign-in at 02:14 and a file written at 02:16 turn into a story instead of two loose facts.",
    seeAlso: ["forensics", "incident-response"],
  },
  baseline: {
    term: "baseline",
    definition:
      "A record of what normal looks like for a system: which programs run, which machines talk to which, how much traffic moves at 3 a.m. on a Sunday. Without one nothing can be called unusual, because there is nothing to be unusual against.",
    seeAlso: ["anomaly", "threat-hunting"],
  },
  anomaly: {
    term: "anomaly",
    definition:
      "Activity that departs from the baseline: a workstation suddenly talking to a server in another country, an account signing in at an hour it never has before. An anomaly is not the same as an attack. Plenty of them are just someone on vacation.",
    seeAlso: ["baseline", "false-positive", "threat-hunting"],
  },
  "threat-intelligence": {
    term: "threat intelligence",
    definition:
      "Information about who is attacking, what they want, and how they operate, gathered from other people's incidents so a team can prepare before its turn comes. It ranges from a raw list of bad IP addresses to a written report on one group's habits.",
    seeAlso: ["ioc", "ttps", "mitre-attack"],
  },
  honeypot: {
    term: "honeypot",
    definition:
      "A system left out to be attacked: valuable-looking, and holding nothing real. Any connection to it is suspicious by definition, since no legitimate user has a reason to touch it, which makes it a very quiet detection with almost no false positives.",
    seeAlso: ["false-positive", "alert", "threat-intelligence"],
  },
  "dwell-time": {
    term: "dwell time",
    definition:
      "How long an attacker was inside before anyone noticed, measured from first access to detection. It is the number defenders care about most, because everything an attacker wants to accomplish costs them time.",
    seeAlso: ["threat-hunting", "incident", "false-negative"],
  },
};
