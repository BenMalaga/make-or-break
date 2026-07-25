import type { GlossaryModule } from "./types";

/** Windows and Active Directory terms. See ./types.ts for the rules an entry must follow. */
export const WINDOWS: GlossaryModule = {
  "windows-process": {
    term: "process",
    noAutoWrap: true,
    definition:
      "One running program, with its own memory and its own number, the PID. Windows lists them in Task Manager, and the command `tasklist` prints the same set as text.",
    seeAlso: ["windows-service", "access-token", "lsass"],
  },
  "windows-service": {
    term: "Windows service",
    definition:
      "A program that starts with the machine and keeps running in the background with no window, the Windows version of a daemon. Services usually run as a powerful built-in account, so a service whose files an ordinary user can overwrite is a straight path to full control of the host.",
    seeAlso: ["windows-process", "system-account", "privilege-escalation", "daemon"],
  },
  "windows-registry": {
    term: "registry",
    definition:
      "The tree of settings Windows and its programs read from, in place of the config files a Linux host keeps in /etc. Keys are folders and values are the settings inside them, browsed with regedit or read from a command line with `reg query`.",
    seeAlso: ["registry-hive", "sam"],
  },
  "registry-hive": {
    term: "hive",
    definition:
      "One of the top-level branches of the registry, each backed by its own file on disk. The two that matter most are HKEY_LOCAL_MACHINE (HKLM), which holds machine-wide settings, and HKEY_CURRENT_USER (HKCU), which holds settings for whoever is logged in.",
    seeAlso: ["windows-registry", "sam"],
  },
  cmd: {
    term: "cmd",
    definition:
      "The old Windows command prompt, cmd.exe. It is clumsy compared to PowerShell, but it is on every Windows machine ever shipped, which is why attack write-ups still use it.",
    seeAlso: ["powershell", "shell"],
  },
  powershell: {
    term: "PowerShell",
    definition:
      "The modern Windows shell. Unlike cmd or bash it passes real objects between commands instead of lines of text, so `Get-Process | Where-Object CPU -gt 10` filters on an actual number rather than by chopping up a string.",
    seeAlso: ["cmd", "cmdlet", "execution-policy", "shell"],
  },
  cmdlet: {
    term: "cmdlet",
    definition:
      "A PowerShell command, always named Verb-Noun: Get-Process, Get-Service, New-Item, Invoke-WebRequest. The naming is rigid on purpose, so a command's name tells the reader what it does before they run it.",
    seeAlso: ["powershell"],
  },
  "execution-policy": {
    term: "execution policy",
    definition:
      "The PowerShell setting that decides which script files are allowed to run, set to Restricted on Windows desktops by default. It is not a security control, it is a guardrail against accidents, and Microsoft says so: anyone can bypass it by pasting the script's contents straight into the shell.",
    seeAlso: ["powershell"],
  },
  uac: {
    term: "UAC",
    definition:
      "User Account Control, the prompt that dims the screen and asks for approval before a program does something administrative. An admin's session actually runs with a stripped-down token most of the time, and clicking that prompt is what swaps in the full one.",
    seeAlso: ["administrator", "access-token", "privilege-escalation"],
  },
  administrator: {
    term: "Administrator",
    definition:
      "The Windows account with full control of a machine, the equivalent of root on Linux. Membership of the local Administrators group grants the same power, and the built-in account always ends in -500 no matter what it has been renamed to.",
    seeAlso: ["uac", "sid", "system-account", "root"],
  },
  "system-account": {
    term: "SYSTEM",
    definition:
      "The built-in account NT AUTHORITY\\SYSTEM, which the operating system's own components run as. It outranks Administrator on the local machine, has no password to steal, and is the usual finish line for a privilege escalation on a Windows host.",
    seeAlso: ["administrator", "windows-service", "privilege-escalation", "lsass"],
  },
  sam: {
    term: "SAM",
    definition:
      "Security Account Manager, the database holding the local accounts of one Windows machine and their password hashes. It lives in C:\\Windows\\System32\\config\\SAM and is locked while Windows runs, so attackers copy it from a shadow copy or dump it out of memory instead.",
    seeAlso: ["ntlm-hash", "lsass", "registry-hive", "mimikatz"],
  },
  lsass: {
    term: "LSASS",
    definition:
      "Local Security Authority Subsystem Service, the process (lsass.exe) that checks logons and enforces security policy. It keeps password hashes and Kerberos tickets for signed-in users in its memory, which makes it the single most valuable target on a Windows host.",
    seeAlso: ["mimikatz", "ntlm-hash", "kerberos", "windows-process"],
  },
  ntlm: {
    term: "NTLM",
    definition:
      "The old Windows authentication protocol, still enabled almost everywhere for compatibility. The server sends a random challenge, the client answers with a value computed from the password hash, and the password itself never crosses the wire, which is exactly the flaw that makes pass-the-hash work.",
    seeAlso: ["ntlm-hash", "pass-the-hash", "kerberos", "smb"],
  },
  "ntlm-hash": {
    term: "NT hash",
    definition:
      "The scrambled form of a Windows password, an MD4 digest of it, stored in the SAM on a workstation and in Active Directory on a domain controller. It is unsalted and fast to compute, so identical passwords produce identical hashes and cracking rigs chew through billions of guesses a second.",
    seeAlso: ["ntlm", "pass-the-hash", "sam", "mimikatz"],
  },
  kerberos: {
    term: "Kerberos",
    definition:
      "The authentication protocol Active Directory uses by default. Instead of proving who they are to every server, a user proves it once to the domain controller and then presents time-limited tickets, which is why badly skewed clocks break Kerberos and nothing else.",
    seeAlso: ["tgt", "tgs", "domain-controller", "ntlm"],
  },
  tgt: {
    term: "TGT",
    definition:
      "Ticket Granting Ticket. The master ticket a domain controller issues after a user's first successful logon, proving the user is who they claim to be. Holding one lets its owner request tickets for individual services without typing a password again.",
    seeAlso: ["kerberos", "tgs", "krbtgt", "golden-ticket"],
  },
  tgs: {
    term: "service ticket",
    definition:
      "The ticket a user trades their TGT for when they want to reach one specific service, such as a file share on one named server. Also called a TGS. The target server checks the ticket's signature and never talks to the domain controller to do it.",
    seeAlso: ["tgt", "kerberos", "silver-ticket", "kerberoasting"],
  },
  krbtgt: {
    term: "krbtgt",
    definition:
      "The hidden domain account whose password key signs every Kerberos ticket a domain controller issues. Steal its hash and tickets can be forged for anyone, which is why that one account's compromise means rebuilding trust in the whole domain.",
    seeAlso: ["golden-ticket", "tgt", "domain-controller", "kerberos"],
  },
  domain: {
    term: "domain",
    definition:
      "A group of Windows machines and users administered together, with one shared account database rather than separate local accounts on every box. One login works everywhere in it, which is convenient for staff and just as convenient for anyone who steals that login.",
    seeAlso: ["active-directory", "domain-controller", "gpo"],
  },
  "domain-controller": {
    term: "domain controller",
    definition:
      "The server that holds a copy of the domain's account database and answers logon requests, usually abbreviated DC. Its database file, NTDS.dit, contains the password hash of every account in the domain, so owning a DC is owning the domain.",
    seeAlso: ["active-directory", "domain", "kerberos", "krbtgt"],
  },
  "active-directory": {
    term: "Active Directory",
    definition:
      "Microsoft's directory service, abbreviated AD: the database of every user, computer, and group in a domain, plus the rules about who can do what. Most corporate networks run on it, so most corporate attacks are really attacks on it.",
    seeAlso: ["domain", "domain-controller", "ldap", "gpo", "bloodhound"],
  },
  ldap: {
    term: "LDAP",
    definition:
      "The protocol used to search and read a directory, listening on TCP port 389 in the clear and 636 encrypted. Any domain account can query Active Directory over LDAP and read the list of users, groups, and computers, which is why a single low-privilege login gives an attacker the whole map.",
    seeAlso: ["active-directory", "enumeration", "port", "bloodhound"],
  },
  gpo: {
    term: "GPO",
    definition:
      "Group Policy Object. A bundle of settings a domain pushes down to machines and users, covering everything from password rules to which scripts run at startup. Anyone who can edit a GPO that applies to a machine can run code on that machine.",
    seeAlso: ["domain", "active-directory", "privilege-escalation"],
  },
  sid: {
    term: "SID",
    definition:
      "Security identifier. The long unique string, like S-1-5-21-1004336348-1177238915-682003330-500, that Windows actually uses to identify an account or group. Names are just labels on top of it, so renaming an account changes nothing about its access.",
    seeAlso: ["access-token", "administrator", "active-directory"],
  },
  smb: {
    term: "SMB",
    definition:
      "Server Message Block, the Windows protocol for file and printer sharing, on TCP port 445. It also carries authentication and remote administration traffic, which is why it turns up in almost every Windows attack path and why port 445 exposed to the internet is a five-alarm finding.",
    seeAlso: ["share", "ntlm", "pass-the-hash", "port"],
  },
  share: {
    term: "share",
    definition:
      "A folder on one machine that other machines can open across the network, reached by a path like \\\\fileserver01\\finance. Windows also creates hidden administrative shares named C$ and ADMIN$ that only administrators can open, and reaching those remotely is as good as a shell.",
    seeAlso: ["smb", "enumeration", "administrator"],
  },
  "access-token": {
    term: "access token",
    definition:
      "The badge Windows attaches to every process, listing the account's SID, its group memberships, and its special privileges. Every permission check reads that token, not the account name, so stealing a token from another process means inheriting that account's access without ever knowing its password.",
    seeAlso: ["sid", "uac", "windows-process", "privilege-escalation"],
  },
  "privilege-escalation": {
    term: "privilege escalation",
    definition:
      "Turning the limited access already obtained into more of it. Local escalation goes from an ordinary account to SYSTEM on the same machine; domain escalation goes from one machine's user to control of the whole domain.",
    seeAlso: ["system-account", "uac", "access-token", "exploit", "bloodhound"],
  },
  "pass-the-hash": {
    term: "pass-the-hash",
    definition:
      "Authenticating as a user with their NT hash instead of their password, because NTLM only ever asks for a value derived from the hash. Cracking is unnecessary: the hash itself is the credential, which is why dumping hashes is as good as stealing passwords.",
    seeAlso: ["ntlm-hash", "ntlm", "mimikatz", "lsass", "smb"],
  },
  "pass-the-ticket": {
    term: "pass-the-ticket",
    definition:
      "The Kerberos version of pass-the-hash: lift a live ticket out of a machine's memory and replay it from somewhere else. The ticket is proof on its own, so the thief becomes its owner until it expires, typically after about ten hours.",
    seeAlso: ["kerberos", "tgt", "mimikatz", "pass-the-hash"],
  },
  "golden-ticket": {
    term: "golden ticket",
    definition:
      "A forged TGT built with the stolen krbtgt key, claiming to be any user in any group, including Domain Admins. Domain controllers accept it because the signature checks out, and it survives password resets, so the only real fix is resetting krbtgt twice.",
    seeAlso: ["krbtgt", "tgt", "silver-ticket", "domain-controller", "mimikatz"],
  },
  "silver-ticket": {
    term: "silver ticket",
    definition:
      "A forged service ticket built with a single service account's hash, granting access to that one service only. It is quieter than a golden ticket because the target server validates it alone and the domain controller never sees the request.",
    seeAlso: ["tgs", "golden-ticket", "kerberos"],
  },
  kerberoasting: {
    term: "Kerberoasting",
    definition:
      "Asking a domain controller for service tickets, which any domain user may do, then cracking them offline because each one is encrypted with the service account's password hash. It turns one weak service password into a domain account, and the cracking happens on the attacker's own hardware where nothing logs it.",
    seeAlso: ["tgs", "kerberos", "active-directory", "ntlm-hash"],
  },
  bloodhound: {
    term: "BloodHound",
    definition:
      "A tool that pulls users, groups, sessions, and permissions out of Active Directory and draws them as a graph, then answers questions like 'what is the shortest path from this account to Domain Admin'. Defenders find their own broken paths with it; attackers find the same ones faster.",
    seeAlso: ["active-directory", "ldap", "privilege-escalation", "enumeration"],
  },
  mimikatz: {
    term: "mimikatz",
    definition:
      "The tool, written by Benjamin Delpy, that made dumping credentials out of LSASS memory ordinary. It reads hashes and Kerberos tickets from a live machine and forges tickets, and every endpoint product on earth flags it by name, so real operators use rebuilt or renamed versions.",
    seeAlso: ["lsass", "ntlm-hash", "pass-the-hash", "golden-ticket", "sam"],
  },
  "event-viewer": {
    term: "Event Viewer",
    definition:
      "The Windows app (eventvwr.msc) for reading the machine's logs. It splits them into channels, and the ones that matter for security are Security, System, and Application.",
    seeAlso: ["windows-event-log"],
  },
  "windows-event-log": {
    term: "event log",
    definition:
      "The record Windows keeps of what happened, stored as .evtx files under C:\\Windows\\System32\\winevt\\Logs and identified by numeric event IDs. Two worth memorising: 4624 is a successful logon and 4625 is a failed one, and a burst of 4625s from one source is what a password-guessing attack looks like from the defender's chair.",
    seeAlso: ["event-viewer", "kill-chain"],
  },
};
