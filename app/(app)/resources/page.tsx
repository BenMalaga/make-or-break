import type { Metadata } from "next";
import { ExternalLink, Swords, Video, Wrench, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Resources",
  description: "Recommended external resources: practice sites, creators, tools, and reading.",
};

interface Resource {
  name: string;
  url: string;
  blurb: string;
}

interface Section {
  title: string;
  icon: typeof Swords;
  blurb: string;
  items: Resource[];
}

// Recommendations, not affiliations. Curated to be reputable and mostly free.
// Edit this list freely.
const SECTIONS: Section[] = [
  {
    title: "Practice platforms",
    icon: Swords,
    blurb: "Where to keep learning by doing, once you want more than this site.",
    items: [
      { name: "HackTheBox", url: "https://www.hackthebox.com", blurb: "Hands-on hacking labs and machines, free and paid tiers." },
      { name: "TryHackMe", url: "https://tryhackme.com", blurb: "Guided, beginner-friendly security rooms and paths." },
      { name: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security", blurb: "The best free web-app hacking labs, by the makers of Burp." },
      { name: "OverTheWire", url: "https://overthewire.org/wargames/", blurb: "Classic Linux and networking wargames over SSH." },
      { name: "picoCTF", url: "https://picoctf.org", blurb: "Beginner capture-the-flag challenges from Carnegie Mellon." },
      { name: "Cryptopals", url: "https://cryptopals.com", blurb: "Learn crypto by breaking it, one challenge at a time." },
      { name: "Project Euler", url: "https://projecteuler.net", blurb: "Math and logic problems you solve by writing code." },
      { name: "Exercism", url: "https://exercism.org", blurb: "Free coding practice with mentorship in 70+ languages." },
    ],
  },
  {
    title: "Security creators",
    icon: Video,
    blurb: "Channels worth your time on the Break side. Not affiliated.",
    items: [
      { name: "LiveOverflow", url: "https://www.youtube.com/@LiveOverflow", blurb: "Deep, honest explanations of how exploitation actually works." },
      { name: "IppSec", url: "https://www.youtube.com/@ippsec", blurb: "Detailed HackTheBox walkthroughs, a masterclass in methodology." },
      { name: "John Hammond", url: "https://www.youtube.com/@_JohnHammond", blurb: "Malware analysis, CTFs, and practical security." },
      { name: "NetworkChuck", url: "https://www.youtube.com/@NetworkChuck", blurb: "Energetic networking and hacking intros for beginners." },
      { name: "David Bombal", url: "https://www.youtube.com/@davidbombal", blurb: "Networking, certifications, and interviews with pros." },
      { name: "Computerphile", url: "https://www.youtube.com/@Computerphile", blurb: "Clear explainers on how computers and security work." },
    ],
  },
  {
    title: "Building creators",
    icon: Video,
    blurb: "Channels for the Make side: code, hardware, and math.",
    items: [
      { name: "freeCodeCamp", url: "https://www.youtube.com/@freecodecamp", blurb: "Full-length free courses on nearly every dev topic." },
      { name: "Fireship", url: "https://www.youtube.com/@Fireship", blurb: "Fast, sharp coverage of tools and web development." },
      { name: "Ben Eater", url: "https://www.youtube.com/@BenEater", blurb: "Builds a computer from scratch on breadboards. Elite electronics." },
      { name: "The Coding Train", url: "https://www.youtube.com/@TheCodingTrain", blurb: "Joyful creative coding, great for beginners." },
      { name: "3Blue1Brown", url: "https://www.youtube.com/@3blue1brown", blurb: "The most beautiful math explanations on the internet." },
      { name: "Sebastian Lague", url: "https://www.youtube.com/@SebastianLague", blurb: "Gorgeous deep dives into algorithms and simulations." },
    ],
  },
  {
    title: "Tools and reference",
    icon: Wrench,
    blurb: "Free tools and references worth a bookmark.",
    items: [
      { name: "CyberChef", url: "https://gchq.github.io/CyberChef/", blurb: "The Swiss-army knife for encoding, decoding, and data." },
      { name: "Have I Been Pwned", url: "https://haveibeenpwned.com", blurb: "Check whether your email turned up in a breach." },
      { name: "OWASP", url: "https://owasp.org", blurb: "The reference for web security risks and defenses." },
      { name: "MITRE ATT&CK", url: "https://attack.mitre.org", blurb: "The map of real attacker tactics and techniques." },
      { name: "MDN Web Docs", url: "https://developer.mozilla.org", blurb: "The definitive reference for the web platform." },
    ],
  },
  {
    title: "Reading",
    icon: BookOpen,
    blurb: "Longer-form learning.",
    items: [
      { name: "Roppers Academy", url: "https://www.hoppersroppers.org", blurb: "A free, structured beginner path into security fundamentals." },
      { name: "The Linux Command Line (book)", url: "https://linuxcommand.org/tlcl.php", blurb: "A free, excellent book for getting comfortable in a shell." },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader
        title="Resources"
        subtitle="A hand-picked list of places to keep learning beyond this site: practice platforms, creators, and tools. These are recommendations, not affiliations, and most are free."
      />

      {SECTIONS.map((section) => (
        <section key={section.title} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <section.icon className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold leading-tight">{section.title}</h2>
              <p className="text-xs text-muted-foreground">{section.blurb}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.items.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-medium group-hover:text-primary">
                    {r.name}
                    <ExternalLink className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.blurb}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}

      <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
        Know a resource that belongs here? Suggest it in the Community tab.
      </p>
    </div>
  );
}
