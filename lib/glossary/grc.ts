import type { GlossaryModule } from "./types";

/** Governance and Risk terms. See ./types.ts for the rules an entry must follow. */
export const GRC: GlossaryModule = {
  governance: {
    term: "governance",
    definition:
      "The part of an organization that decides who is allowed to make security decisions, what the rules are, and who answers when something goes wrong. It is the layer above the tools: budgets, written rules, and named owners.",
    seeAlso: ["policy", "compliance", "risk"],
  },
  risk: {
    term: "risk",
    definition:
      "The chance that something bad happens combined with how much it would hurt if it did. A weakness nobody can reach, in a system nobody depends on, is a low risk even though it is real.",
    seeAlso: ["threat", "vulnerability", "likelihood", "impact"],
  },
  compliance: {
    term: "compliance",
    definition:
      "Proving to an outside party that the organization follows a specific set of required rules, whether those come from a law, a contract, or a card network. Compliance is about evidence someone else accepts, which is why a compliant company can still be insecure.",
    seeAlso: ["audit", "framework", "governance"],
  },
  "risk-assessment": {
    term: "risk assessment",
    definition:
      "The exercise of listing what could go wrong, estimating how likely each one is and how bad it would be, then ranking the list. The output is an ordered list of problems to work through, not a pass or fail verdict.",
    seeAlso: ["risk", "likelihood", "impact", "asset"],
  },
  likelihood: {
    term: "likelihood",
    definition:
      "How probable it is that a given bad event actually happens, usually scored on a plain scale such as rare, possible, or likely. Most teams estimate it from past incidents and how easy the attack is, not from real math.",
    seeAlso: ["risk", "impact", "risk-assessment"],
  },
  impact: {
    term: "impact",
    definition:
      "How much damage an event causes if it happens: money lost, hours of downtime, records exposed, customers gone. Impact is the half of risk that stays large no matter how unlikely the event is.",
    seeAlso: ["risk", "likelihood", "bia"],
  },
  "inherent-risk": {
    term: "inherent risk",
    definition:
      "How bad a situation would be with no protections in place at all. It is the starting number, counted before anyone credits the locks, backups, and alerts already installed.",
    seeAlso: ["residual-risk", "control", "risk"],
  },
  "residual-risk": {
    term: "residual risk",
    definition:
      "What is left over once the protections are applied. It never reaches zero, so the real question is whether the leftover is small enough that the organization agrees to live with it.",
    seeAlso: ["inherent-risk", "risk-appetite", "control"],
  },
  "risk-appetite": {
    term: "risk appetite",
    definition:
      "How much risk an organization has decided in advance it will accept in exchange for getting work done. Writing it down settles arguments early, and a bank and a two-person startup draw that line in very different places.",
    seeAlso: ["residual-risk", "risk", "governance"],
  },
  threat: {
    term: "threat",
    definition:
      "Something or someone that could cause harm: a criminal group, a careless employee, a flood, a power cut. A threat exists whether or not the organization has any weakness for it to land on.",
    seeAlso: ["vulnerability", "risk", "threat-actor"],
  },
  "threat-actor": {
    term: "threat actor",
    definition:
      "The person or group behind an attack. Naming the actor changes the defense, because a bored teenager, a competitor, and a government-funded team bring very different budgets and patience.",
    seeAlso: ["threat", "risk"],
  },
  asset: {
    term: "asset",
    definition:
      "Anything the organization owns and would miss: a customer database, a laptop, a domain name, a payroll system. Security work starts by listing assets, because a control with no asset behind it is protecting nothing.",
    seeAlso: ["data-classification", "risk-assessment", "bia"],
  },
  control: {
    term: "control",
    definition:
      "Any deliberate measure put in place to reduce risk: a lock, a password rule, a nightly backup, a background check. Controls are what turn inherent risk into residual risk.",
    seeAlso: [
      "preventive-control",
      "detective-control",
      "corrective-control",
      "residual-risk",
    ],
  },
  "preventive-control": {
    term: "preventive control",
    definition:
      "A control that stops the bad thing from happening in the first place, such as a locked door, a firewall rule, or requiring two people to approve a payment. Prevention is the cheapest kind when it works and useless once the event is already underway.",
    seeAlso: ["control", "detective-control", "firewall"],
  },
  "detective-control": {
    term: "detective control",
    definition:
      "A control that notices a bad thing is happening or already happened, such as an alarm, a log review, or a monthly check of who still has accounts. It stops nothing by itself, it just makes sure someone finds out.",
    seeAlso: ["control", "preventive-control", "audit"],
  },
  "corrective-control": {
    term: "corrective control",
    definition:
      "A control that limits the damage and gets things working again after something went wrong: restoring from backup, revoking a stolen password, rebuilding a server. It assumes the other kinds already failed.",
    seeAlso: ["control", "detective-control", "rto", "rpo"],
  },
  framework: {
    term: "framework",
    definition:
      "A published, organized list of security practices an organization can adopt instead of inventing its own from scratch. A framework gives shared vocabulary and a checklist. It does not make any decision for the business.",
    seeAlso: ["nist-csf", "iso-27001", "compliance", "standard"],
  },
  "nist-csf": {
    term: "NIST CSF",
    definition:
      "The Cybersecurity Framework published by the US National Institute of Standards and Technology, organized around six functions: Govern, Identify, Protect, Detect, Respond, Recover. Version 2.0 landed in 2024 and added Govern. It is voluntary and free to read, which is why small teams reach for it first.",
    seeAlso: ["framework", "iso-27001"],
  },
  "iso-27001": {
    term: "ISO 27001",
    definition:
      "An international standard for running an information security management system: how an organization sets scope, assesses risk, picks controls, and keeps reviewing them. An accredited body can certify a company against it, and the current version is ISO/IEC 27001:2022.",
    seeAlso: ["framework", "audit", "nist-csf"],
  },
  "soc-2": {
    term: "SOC 2",
    definition:
      "A report an outside accounting firm writes about whether a service company's controls actually work, measured against criteria from the AICPA covering security, availability, processing integrity, confidentiality, and privacy. Type I checks the design on a single date, Type II watches the controls operate over a period, commonly three to twelve months. Enterprise buyers ask for it before signing.",
    seeAlso: ["audit", "compliance", "framework"],
  },
  "pci-dss": {
    term: "PCI DSS",
    definition:
      "The Payment Card Industry Data Security Standard, the rules any organization must follow if it stores, processes, or transmits payment card data. It comes from the card brands rather than a government, so failing it means fines and losing the ability to take cards.",
    seeAlso: ["compliance", "standard", "data-classification"],
  },
  hipaa: {
    term: "HIPAA",
    definition:
      "A US law from 1996 that sets rules for protecting patient health information. Its Privacy Rule covers who may see that data and its Security Rule covers how electronic copies must be protected, and both bind healthcare providers and the vendors handling data on their behalf.",
    seeAlso: ["compliance", "data-classification", "gdpr"],
  },
  gdpr: {
    term: "GDPR",
    definition:
      "The European Union's General Data Protection Regulation, in force since 25 May 2018, governing how personal data about people in the EU is collected, used, and stored. It reaches companies outside the EU that handle that data, and fines can reach 20 million euros or 4 percent of worldwide annual revenue, whichever is higher.",
    seeAlso: ["compliance", "hipaa", "data-classification"],
  },
  audit: {
    term: "audit",
    definition:
      "A structured check by someone other than the team being checked, testing whether the written rules are actually followed and demanding proof. Auditors want evidence like logs, tickets, and screenshots, so \"we always do that\" is not an answer.",
    seeAlso: ["compliance", "detective-control", "soc-2"],
  },
  policy: {
    term: "policy",
    definition:
      "A short, high-level document saying what the organization requires and why, signed off by leadership. A policy states the rule, for example that every company laptop must have its disk encrypted, and skips products and steps on purpose so it does not go stale.",
    seeAlso: ["standard", "procedure", "governance"],
  },
  standard: {
    term: "standard",
    definition:
      "The specific, mandatory requirement that makes a policy measurable: which tool, which setting, which minimum. If the policy says laptop disks must be encrypted, the standard names the encryption and the key length.",
    seeAlso: ["policy", "procedure", "framework"],
  },
  procedure: {
    term: "procedure",
    definition:
      "The numbered steps someone follows to actually do the thing, written so a new hire can run them without asking. Policy says what, standard says how strong, procedure says click here and then here.",
    seeAlso: ["policy", "standard"],
  },
  "cia-triad": {
    term: "CIA triad",
    definition:
      "The three goals every security control serves: confidentiality, meaning only the right people can read it; integrity, meaning nobody changed it without permission; and availability, meaning it works when it is needed. The letters have nothing to do with the intelligence agency.",
    seeAlso: ["control", "asset", "sla"],
  },
  "data-classification": {
    term: "data classification",
    definition:
      "Sorting data into a few labeled tiers by how much harm its exposure would cause, such as public, internal, confidential, and restricted. The label carries the handling rules, so nobody has to argue file by file about what can be emailed out.",
    seeAlso: ["asset", "cia-triad", "policy"],
  },
  bia: {
    term: "business impact analysis",
    definition:
      "A study of what actually breaks, and how fast, when a given system goes down: which work stops, how much money leaks per hour, whose phone rings. It is the input that makes recovery targets honest instead of wishful.",
    seeAlso: ["impact", "rto", "rpo", "asset"],
  },
  rto: {
    term: "RTO",
    definition:
      "Recovery time objective. The longest a system is allowed to stay down before the damage is unacceptable, so a four-hour RTO means the team has four hours to get it back.",
    seeAlso: ["rpo", "bia", "corrective-control"],
  },
  rpo: {
    term: "RPO",
    definition:
      "Recovery point objective. The most recent data the organization can afford to lose, measured in time. A one-hour RPO means backups run at least hourly, because everything newer than the last backup is gone.",
    seeAlso: ["rto", "bia", "corrective-control"],
  },
  sla: {
    term: "SLA",
    definition:
      "Service level agreement. A contract promise about a measurable level of service, such as 99.9 percent uptime or a one-hour response to critical tickets, usually with a credit or penalty attached when it is missed.",
    seeAlso: ["rto", "cia-triad", "due-diligence"],
  },
  "due-diligence": {
    term: "due diligence",
    definition:
      "Checking, before signing or buying, that the other party is what it claims: reading their audit reports, their answers to a security questionnaire, their breach history. It matters because a vendor's breach lands on the customers whose data they were holding.",
    seeAlso: ["audit", "soc-2", "compliance", "risk-assessment"],
  },
};
