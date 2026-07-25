# Writing guidelines

Every lesson, machine guide, and page follows this. The goal is simple: it
should read like a sharp practitioner wrote it for a colleague, not like a
model generated it or a blog stuffed it with keywords. If a sentence sounds like
it came from an AI, it doesn't ship.

## The one rule everything else serves

Write like you are sitting next to someone who is smart but newer than you, and
you are showing them how the thing actually works. You have opinions. You have
scars. You skip the fluff because their time matters.

## Hard rules (never break)

- No em-dashes and no en-dashes. Use commas, periods, colons, or plain hyphens.
- No emojis anywhere.
- Straight quotes only inside code.
- Do not open a lesson with "In this lesson we will," "Welcome to," "Let's dive
  in," or a definition. Open with the point or a real situation.
- Do not end with "In conclusion," "To summarize," or a recap paragraph. Stop
  when you are done.

## Banned words and phrases (dead giveaways)

Never use: delve, leverage (as a verb, just say use), utilize (use "use"),
seamless, robust, ever-evolving, cutting-edge, state-of-the-art, in today's
digital landscape, in the realm of, when it comes to, it is worth noting, it is
important to note, plays a crucial role, plays a vital role, a testament to,
navigate the complexities, unlock, empower, game-changer, deep dive (as filler),
at the end of the day, that being said, furthermore, moreover, in essence,
essentially (as filler), buckle up, the world of, rich tapestry, realm.

Also avoid starting sentences with transition crutches: Furthermore, Moreover,
Additionally, Consequently. Just start the next sentence.

## Voice

- Active voice with a real subject. Name the thing doing the work: "The client
  sends a SYN." Not "You send a SYN" (that is coaching one reader), and not "A
  SYN is sent" (that is passive mush). The actor is the client, the scanner,
  nmap, the kernel, the attacker. Say which.
- Write the lesson, not a tutoring session. The lesson explains a subject to
  anyone who opens it. It does not talk to one person over their shoulder.
- Never assume the reader's setup. No "your Kali box," "your terminal," "fire up
  your VM," "on your attacker machine." The reader may be on a train with a
  phone. Describe where a thing runs instead: "On a Linux host, `ss -tulpn`
  lists every listening socket."
- Second person and imperatives are allowed in exactly one place: inside an
  `<Exercise>` block, which is explicitly an instruction to go do something.
  Everywhere else, cut "you."
- Contractions are good. It's, don't, that's. They read human.
- Vary sentence length hard. Follow a long, winding explanation with three
  words. Short sentences hit.
- Be specific to a fault. Real commands, real ports, real tool names, real
  version numbers, real error text. Specifics feel written by a person.
  Generalities feel generated.
- Take a position. "Skip the UDP scan on the first pass, it is slow and rarely
  pays off early." A real voice makes calls and says why.
- One idea per paragraph. Keep paragraphs to two to four sentences.
- Cut hedging. Not "it can sometimes be the case that." Say the thing.

## Structure

- Lead with why it matters or a concrete moment, then define. Definitions land
  better after the reader wants them.
- Break the rule of three. Not every list has three items. Two is fine. Five is
  fine. Predictable triples read like a template.
- Do not restate the heading in the first sentence under it.
- Prose for reasoning, bullets only for things that are genuinely a list (ports,
  steps, options). A wall of bullets is a tell.
- No summary section at the end.

## Before and after

Bad: "In the ever-evolving landscape of cybersecurity, it is important to note
that port scanning plays a crucial role in the reconnaissance phase."
Good: "You cannot attack a port you do not know is open. Scanning is how you
find them, and it is usually the first useful thing you do to a target."

Bad: "Let's dive into the TCP handshake. Essentially, it is a three-way process
that seamlessly establishes a connection."
Good: "Before any TCP data moves, the two machines shake hands three times. Miss
one step and nothing connects. That is the whole trick behind a SYN scan."

Bad: "Utilize nmap to leverage its robust scanning capabilities."
Good: "nmap is the scanner most people reach for, so its flags are worth
learning cold."

Bad: "Open your Kali box and list the listening sockets."
Good: "On a Linux host, `ss -tulpn` lists every listening socket."

## Lesson shape (the depth contract)

Target 10 to 20 minutes, most landing around 12 to 15. That is roughly 1,400 to
2,200 words of body plus the interactive pieces below. Set `estimatedMinutes`
honestly, and count the quizzes and commands in it.

Length is earned, never padded. A long lesson earns it with more definitions, a
worked example, real output, and the failure modes nobody warns you about. If a
paragraph does not teach, cut it. A padded 2,000-word lesson is worse than a
tight 900-word one.

Every lesson carries:

- **Three checks.** Three `<Quiz>` blocks spread through the lesson, one after
  each major idea lands. Never bunched at the end. Two is the floor, three is
  the norm. A quiz tests understanding, not recall of a sentence.
- **Terms on first use.** The first time a lesson uses a term, wrap it:
  `<Term id="socket">socket</Term>`. If it is not in `lib/glossary/`, add it to
  the right category module. Never use a word the reader has no way to look up.
- **A callback.** The opening connects to what the previous lesson established,
  by name.
- **A forward hook.** The close says what the next lesson builds on this.
- **`prerequisites`** in frontmatter listing the lesson slugs it builds on. This
  is what makes the ordering real instead of implied.

## Assume nothing

The whole platform rests on this rule. Someone who starts at the first lesson
and reads in order must never hit a word they were not given.

- Define every term on first use. Wrap it in `<Term>` so the definition is one
  click away and the reader never leaves the page.
- If a lesson needs a concept an earlier lesson did not cover, define it properly
  or move it. Do not hand-wave and do not say "as you probably know."
- "Obvious" is a trap. Terminal, shell, sudo, root, daemon, port, packet: every
  one of these is new to someone. They all get defined.
- Prior knowledge is a routing decision, not a writing one. A reader who already
  knows a topic skips it via `prerequisites`. The text itself never assumes them.

## Accuracy is part of the voice

- Every command runs. Every flag is real. Do not invent output, CVE numbers, or
  version strings. If a value is illustrative, say so.
- When you show output, show what the tool actually prints, trimmed to what
  matters.

If a sentence does not teach or move the reader forward, delete it. Tight writing
is the strongest tell that a human who respects the reader wrote it.
