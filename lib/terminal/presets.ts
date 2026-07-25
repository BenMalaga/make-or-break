import type { DirNode } from "./shell";

/**
 * Filesystem presets a lesson can drop a <Terminal> onto. A lesson picks one by
 * name so the files match what it is teaching. Keep these small and readable.
 */

function dir(children: Record<string, DirNode["children"][string]>): DirNode {
  return { type: "dir", children };
}
function file(content: string, mode?: string) {
  return { type: "file" as const, content, mode };
}

// A small, friendly home directory for Linux-basics lessons.
const linuxBasics: DirNode = dir({
  home: dir({
    hacker: dir({
      "welcome.txt": file(
        "Welcome to the Make or Break practice shell.\n" +
          "This is a safe sandbox. Try: ls, cd notes, cat welcome.txt, whoami.\n" +
          "Type help to see every command.",
      ),
      ".bashrc": file("export PS1='\\u@\\h:\\w$ '\nalias ll='ls -la'"),
      notes: dir({
        "recon.md": file(
          "# Recon notes\n\n- always start by mapping the target\n- ports before exploits\n- enumerate, then attack",
        ),
        "todo.txt": file("finish networking foundations\ntry a first box\nwrite a recon script"),
      }),
      tools: dir({
        "scan.sh": file("#!/bin/bash\n# a tiny placeholder scanner\necho \"scanning $1 ...\"", "rwxr-xr-x"),
      }),
    }),
  }),
  etc: dir({
    hostname: file("makeorbreak"),
    passwd: file(
      "root:x:0:0:root:/root:/bin/bash\n" +
        "hacker:x:1000:1000:hacker:/home/hacker:/bin/bash\n" +
        "www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin",
    ),
  }),
  var: dir({
    log: dir({
      "auth.log": file(
        "May 10 09:12:01 makeorbreak sshd[1420]: Accepted password for hacker from 10.10.14.7\n" +
          "May 10 09:13:44 makeorbreak sudo:   hacker : command=/usr/bin/cat /etc/shadow\n" +
          "May 10 09:20:10 makeorbreak sshd[1509]: Failed password for root from 45.9.1.2",
      ),
    }),
  }),
});

export const TERMINAL_PRESETS: Record<string, DirNode> = {
  "linux-basics": linuxBasics,
};

export const DEFAULT_PRESET = "linux-basics";
