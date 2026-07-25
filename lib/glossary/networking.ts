import type { GlossaryModule } from "./types";

/** Networking terms. See ./types.ts for the rules an entry must follow. */
export const NETWORKING: GlossaryModule = {
  network: {
    term: "network",
    definition:
      "A set of machines that can send each other messages. The messages travel as small labeled chunks of data, and equipment in between forwards them until they arrive.",
    seeAlso: ["host", "packet"],
  },
  host: {
    term: "host",
    definition:
      "Any machine attached to a network that can send or receive data. A laptop, a phone, a server, and a router are all hosts.",
    seeAlso: ["ip-address"],
  },
  "ip-address": {
    term: "IP address",
    definition:
      "The numeric label that identifies a machine on a network, like 192.168.1.10. It answers 'which machine', the way a street address identifies a building.",
    seeAlso: ["host", "subnet", "ipv4"],
  },
  ipv4: {
    term: "IPv4",
    definition:
      "The older and still most common form of IP address, written as four numbers from 0 to 255 separated by dots, such as 10.0.0.5. There are about 4.3 billion of them, which is not enough, which is why IPv6 exists.",
    seeAlso: ["ip-address", "ipv6"],
  },
  ipv6: {
    term: "IPv6",
    definition:
      "The newer form of IP address, written as hexadecimal groups separated by colons, such as 2001:db8::1. It exists because the world ran out of IPv4 addresses.",
    seeAlso: ["ip-address", "ipv4"],
  },
  packet: {
    term: "packet",
    definition:
      "A small chunk of data with labels attached saying where it came from and where it is going. Data is chopped into packets because sending one giant block would hog the line and cannot be re-sent cheaply if it is damaged.",
    seeAlso: ["header", "encapsulation"],
  },
  header: {
    term: "header",
    definition:
      "The labels attached to the front of a packet: source, destination, and bookkeeping fields. Everything that is not the header is the payload, meaning the actual data being carried.",
    seeAlso: ["packet", "payload"],
  },
  payload: {
    term: "payload",
    definition:
      "The actual data a packet carries, as opposed to the labels wrapped around it. In an attack context the word also means the code an exploit delivers.",
    seeAlso: ["header", "packet"],
  },
  port: {
    term: "port",
    definition:
      "A number from 0 to 65535 that identifies one specific service on a machine. The IP address picks the machine; the port picks which program on it should get the data.",
    seeAlso: ["socket", "well-known-ports"],
  },
  "well-known-ports": {
    term: "well-known ports",
    definition:
      "Ports 0 through 1023, reserved by convention for common services so clients know where to look. Port 22 is SSH, 80 is HTTP, 443 is HTTPS.",
    seeAlso: ["port"],
  },
  socket: {
    term: "socket",
    definition:
      "One end of a network conversation, identified by an IP address plus a port together, such as 10.0.0.5:443. A connection is a pair of sockets talking.",
    seeAlso: ["port", "ip-address"],
  },
  protocol: {
    term: "protocol",
    definition:
      "An agreed set of rules for a conversation: what each side may say, in what order, and what each message means. Both sides must follow the same one or neither is understood.",
    seeAlso: ["tcp", "udp"],
  },
  tcp: {
    term: "TCP",
    definition:
      "A protocol that sets up a connection before sending data, then guarantees the data arrives in order and re-sends anything lost. The reliability costs speed.",
    seeAlso: ["udp", "three-way-handshake", "protocol"],
  },
  udp: {
    term: "UDP",
    definition:
      "A protocol that sends data without setting up a connection and without checking that it arrived. Faster and leaner than TCP, and used where a late packet is worse than a lost one, such as voice calls.",
    seeAlso: ["tcp", "protocol"],
  },
  "three-way-handshake": {
    term: "three-way handshake",
    definition:
      "The three messages TCP exchanges before any data moves: SYN, then SYN-ACK, then ACK. It is how both sides agree they can hear each other.",
    seeAlso: ["tcp", "syn"],
  },
  syn: {
    term: "SYN",
    definition:
      "The first message of a TCP connection, meaning 'I would like to talk'. A reply proves something is listening, which is exactly what a port scanner is looking for.",
    seeAlso: ["three-way-handshake", "tcp"],
  },
  lan: {
    term: "LAN",
    definition:
      "Local area network. The small network shared by machines in one place, such as a home or an office, where hosts can reach each other directly.",
    seeAlso: ["wan", "network"],
  },
  wan: {
    term: "WAN",
    definition:
      "Wide area network. A network that connects separate local networks across distance. The internet is the largest one.",
    seeAlso: ["lan", "network"],
  },
  client: {
    term: "client",
    definition:
      "The side of a conversation that asks. A browser asking for a web page is a client.",
    seeAlso: ["server"],
  },
  server: {
    term: "server",
    definition:
      "The side of a conversation that listens and answers. The word means both the software that answers and the machine it runs on.",
    seeAlso: ["client", "daemon"],
  },
  router: {
    term: "router",
    definition:
      "Equipment that forwards packets between different networks, choosing where to send each one next based on its destination address.",
    seeAlso: ["gateway", "switch"],
  },
  switch: {
    term: "switch",
    definition:
      "Equipment that forwards data between machines inside a single local network, using hardware addresses rather than IP addresses.",
    seeAlso: ["router", "mac-address"],
  },
  gateway: {
    term: "default gateway",
    definition:
      "The router a machine sends packets to when the destination is not on its own local network. It is the exit door out of the LAN.",
    seeAlso: ["router", "lan"],
  },
  "mac-address": {
    term: "MAC address",
    definition:
      "A hardware address burned into a network interface, written as six hex pairs like 00:1a:2b:3c:4d:5e. It identifies a machine on the local network only and does not travel across routers.",
    seeAlso: ["switch", "arp"],
  },
  arp: {
    term: "ARP",
    definition:
      "The protocol that finds which hardware address belongs to a given IP address on the local network. It works by shouting to everyone and waiting for the owner to answer.",
    seeAlso: ["mac-address", "ip-address"],
  },
  subnet: {
    term: "subnet",
    definition:
      "A slice of a larger network, defined by which leading bits of the address all its machines share. Machines in the same subnet can talk directly; anything else goes through a router.",
    seeAlso: ["cidr", "ip-address", "gateway"],
  },
  cidr: {
    term: "CIDR notation",
    definition:
      "The /24 in 192.168.1.0/24. The number counts how many leading bits of the address are fixed for the network, leaving the rest to number individual machines.",
    seeAlso: ["subnet"],
  },
  encapsulation: {
    term: "encapsulation",
    definition:
      "Wrapping data in a new header at each layer on the way down, and unwrapping it on the way up. It is why one packet carries several nested sets of labels.",
    seeAlso: ["packet", "header", "osi-model"],
  },
  "osi-model": {
    term: "OSI model",
    definition:
      "A seven-layer map of networking, from physical wires up to applications. It is a teaching and troubleshooting vocabulary rather than a description of how any real stack is built.",
    seeAlso: ["encapsulation"],
  },
  dns: {
    term: "DNS",
    definition:
      "The system that turns a name like example.com into an IP address. Nothing on the network routes by name, so this lookup happens before almost every connection.",
    seeAlso: ["ip-address"],
  },
  dhcp: {
    term: "DHCP",
    definition:
      "The protocol that hands a machine an IP address automatically when it joins a network, along with its gateway and DNS server.",
    seeAlso: ["ip-address", "gateway"],
  },
  nat: {
    term: "NAT",
    definition:
      "Network address translation. A router rewriting addresses so many machines on a private network can share one public address. It is why a home machine is not directly reachable from the internet by default.",
    seeAlso: ["router", "ip-address"],
  },
  icmp: {
    term: "ICMP",
    definition:
      "The protocol networks use for status and error messages rather than carrying user data. Ping uses it to ask a host whether it is alive.",
    seeAlso: ["protocol"],
  },
  loopback: {
    term: "loopback",
    definition:
      "The address 127.0.0.1, which always means 'this same machine'. A service bound only to loopback cannot be reached from any other host.",
    seeAlso: ["ip-address", "listening"],
  },
  listening: {
    term: "listening",
    definition:
      "A program's state when it has claimed a port and is waiting for connections. If nothing is listening on a port, connections to it are refused.",
    seeAlso: ["port", "daemon", "socket"],
  },
  firewall: {
    term: "firewall",
    definition:
      "Software or equipment that allows or blocks traffic against a set of rules. It explains why a port can be open on a host and still unreachable from elsewhere.",
    seeAlso: ["port"],
  },
};
