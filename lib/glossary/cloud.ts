import type { GlossaryModule } from "./types";

/** Cloud and Containers terms. See ./types.ts for the rules an entry must follow. */
export const CLOUD: GlossaryModule = {
  iaas: {
    term: "IaaS",
    definition:
      "Infrastructure as a service. A company rents out raw machines, disks, and networks by the hour, and the renter installs and runs everything on top. Amazon EC2 is the usual example: it hands over a bare Linux machine and nothing else.",
    seeAlso: ["paas", "saas", "shared-responsibility-model"],
  },
  paas: {
    term: "PaaS",
    definition:
      "Platform as a service. The provider runs the machines and the operating system, and the customer supplies only application code. Less to patch, less to control.",
    seeAlso: ["iaas", "saas", "serverless"],
  },
  saas: {
    term: "SaaS",
    definition:
      "Software as a service. Finished software someone else hosts and the customer just logs into, such as Gmail or Salesforce. The customer controls their accounts and their data, and nothing below that.",
    seeAlso: ["iaas", "paas", "shared-responsibility-model"],
  },
  "shared-responsibility-model": {
    term: "shared responsibility model",
    definition:
      "The split of security work between a cloud provider and its customer. The provider secures the buildings, hardware, and the software that runs the cloud itself; the customer secures what they put on it, including their accounts, permissions, and data. Most cloud breaches land on the customer half.",
    seeAlso: ["iaas", "paas", "saas", "iam"],
  },
  region: {
    term: "region",
    definition:
      "A geographic area where a cloud provider runs data centers, named like us-east-1 or eu-west-2. Resources in one region are separate from another region, so an account can hold machines in Ohio that are invisible to someone only looking at Ireland.",
    seeAlso: ["availability-zone"],
  },
  "availability-zone": {
    term: "availability zone",
    definition:
      "One isolated cluster of data centers inside a region, with its own power and cooling. Spreading copies of a service across zones keeps it running when one building fails.",
    seeAlso: ["region"],
  },
  vpc: {
    term: "VPC",
    definition:
      "Virtual private cloud. A private network a customer defines inside a provider's data centers, with its own address ranges and routing, walled off from every other customer. It is the cloud version of the office LAN.",
    seeAlso: ["lan", "subnet", "cidr", "security-group"],
  },
  "security-group": {
    term: "security group",
    definition:
      "A firewall attached to a cloud machine or service rather than to a network boundary. In AWS it holds allow rules only, and it is stateful, meaning a reply to an allowed request gets back out without its own rule. A group opening port 22 to 0.0.0.0/0 exposes SSH to the entire internet.",
    seeAlso: ["firewall", "vpc", "port", "ssh"],
  },
  "object-storage": {
    term: "object storage",
    definition:
      "Storage that holds whole files, each with a name and its own permissions, reached over HTTP instead of mounted like a disk. It is cheap, effectively unlimited, and where most companies keep backups, logs, and uploads.",
    seeAlso: ["s3-bucket"],
  },
  "s3-bucket": {
    term: "S3 bucket",
    definition:
      "A named container for files in Amazon's object storage service. Buckets are private by default, but a misconfigured one serves its contents to anyone who knows the URL, which is how customer databases keep turning up on the open web.",
    seeAlso: ["object-storage", "iam-policy", "enumeration"],
  },
  iam: {
    term: "IAM",
    definition:
      "Identity and access management. The system in a cloud account that decides who exists and what each one is allowed to do. In cloud work, permissions are the perimeter: an attacker with the right IAM permissions does not need to break anything.",
    seeAlso: ["iam-policy", "iam-role", "access-key"],
  },
  "iam-policy": {
    term: "IAM policy",
    definition:
      "A document listing which actions an identity may take on which resources, and whether each is allowed or denied. A policy granting the action s3:GetObject on one bucket is tight; one granting * on * is full account control.",
    seeAlso: ["iam", "iam-role", "s3-bucket"],
  },
  "iam-role": {
    term: "IAM role",
    definition:
      "A set of permissions nobody owns permanently. A machine, a function, or a person assumes the role and receives short-lived credentials that carry its permissions. Roles are the reason a stolen server can act as something far more powerful than itself.",
    seeAlso: ["iam", "iam-policy", "temporary-credentials", "metadata-service"],
  },
  "access-key": {
    term: "access key",
    definition:
      "A long-lived username and password pair for a cloud API, made of a key id and a secret, used by scripts and tools instead of a login screen. Keys do not expire on their own, so one committed to a public code repository stays usable until somebody notices.",
    seeAlso: ["iam", "temporary-credentials"],
  },
  "temporary-credentials": {
    term: "temporary credentials",
    definition:
      "Cloud keys that come with an expiry time and a session token, handed out when an identity assumes a role. They limit the damage of a leak, because a set stolen today is dead in a few hours.",
    seeAlso: ["iam-role", "access-key", "metadata-service"],
  },
  "metadata-service": {
    term: "instance metadata service",
    definition:
      "A small web server every cloud machine can reach at the address 169.254.169.254, which tells the machine about itself. It also hands out the credentials for any role attached to that machine, so anything able to make that one request can act as the server.",
    seeAlso: ["iam-role", "temporary-credentials", "ssrf-to-cloud", "imdsv2"],
  },
  imdsv2: {
    term: "IMDSv2",
    definition:
      "The hardened version of the AWS metadata service. A caller must first send a PUT request to get a short-lived token, then include that token as a header on every read. A plain GET, which is all most tricked servers can be made to send, gets nothing.",
    seeAlso: ["metadata-service", "ssrf-to-cloud", "header"],
  },
  "ssrf-to-cloud": {
    term: "SSRF to cloud takeover",
    definition:
      "Server-side request forgery is a bug where an application can be tricked into fetching a URL an attacker chooses. Point it at the metadata service and the application fetches its own machine's role credentials, then prints them back. It is the single most reliable path from one web bug to control of a cloud account.",
    seeAlso: ["metadata-service", "imdsv2", "iam-role", "exploit"],
  },
  container: {
    term: "container",
    definition:
      "A process that runs on a normal Linux machine but is fenced off so it sees its own files, its own processes, and its own network. It is not a separate computer: every container on a host shares that host's single kernel, which is why a container break is a host break.",
    seeAlso: ["image", "container-escape", "pod"],
  },
  image: {
    term: "image",
    noAutoWrap: true,
    definition:
      "The frozen filesystem a container starts from, holding the application and every library it needs. Images are built in stacked layers, and a secret written into an early layer stays inside the image even if a later step deletes the file.",
    seeAlso: ["container", "dockerfile", "registry"],
  },
  dockerfile: {
    term: "Dockerfile",
    definition:
      "A text recipe for building an image, one instruction per line: which base image to start from, which files to copy in, which command to run. Reading one tells an attacker what is inside a container before ever touching it.",
    seeAlso: ["image", "container"],
  },
  registry: {
    term: "registry",
    definition:
      "A server that stores and hands out container images, such as Docker Hub. A registry left open lets anyone pull a company's private images and read the source, config, and credentials baked into them.",
    seeAlso: ["image", "enumeration"],
  },
  "container-escape": {
    term: "container escape",
    definition:
      "Getting out of a container and onto the host machine underneath it. Because containers share the host kernel, an escape usually turns one compromised application into control of every other container on that machine.",
    seeAlso: ["container", "privileged-container", "root", "node"],
  },
  "privileged-container": {
    term: "privileged container",
    definition:
      "A container started with its safety fences dropped, giving it near-total access to the host's devices and kernel. It is one flag in a config file, teams set it to make something work, and it turns an escape from a real exploit into a couple of commands.",
    seeAlso: ["container-escape", "container", "root"],
  },
  kubernetes: {
    term: "Kubernetes",
    definition:
      "Software that runs containers across a fleet of machines, deciding where each one goes, restarting the dead, and wiring up their networking. Often shortened to k8s. It is a huge system with permissions of its own, so it is both the thing being defended and a target in itself.",
    seeAlso: ["cluster", "pod", "node", "control-plane"],
  },
  cluster: {
    term: "cluster",
    definition:
      "The full set of machines Kubernetes manages as one pool, plus the software steering them. An engineer asks the cluster to run an application and the cluster picks which machine actually runs it.",
    seeAlso: ["kubernetes", "node", "control-plane"],
  },
  node: {
    term: "node",
    definition:
      "One machine in a Kubernetes cluster that actually runs containers. Nodes are where the work happens, so an attacker who reaches a node reaches every container currently on it.",
    seeAlso: ["cluster", "kubelet", "pod", "container-escape"],
  },
  pod: {
    term: "pod",
    definition:
      "The smallest thing Kubernetes will run: one or more containers scheduled together on the same node, sharing an IP address and storage. Kubernetes never manages a container directly, only the pod wrapped around it.",
    seeAlso: ["container", "node", "kubernetes", "ip-address"],
  },
  namespace: {
    term: "namespace",
    definition:
      "A named partition inside a cluster that splits it into separate work areas, so one team's pods and secrets sit apart from another's. It is an organizational boundary with permissions attached, not a hard security wall: pods in different namespaces can still reach each other over the network unless something stops them.",
    seeAlso: ["cluster", "pod", "rbac", "secret"],
  },
  "control-plane": {
    term: "control plane",
    definition:
      "The brain of a Kubernetes cluster: the API server everything talks to, plus the components that decide what runs where and store the cluster's state. Whoever controls it controls every machine in the cluster.",
    seeAlso: ["kubernetes", "cluster", "kubelet", "rbac"],
  },
  kubelet: {
    term: "kubelet",
    definition:
      "The agent running on each node that takes orders from the control plane and starts, stops, and watches the containers on that machine. An unauthenticated kubelet API is a direct route to running commands inside any pod on that node.",
    seeAlso: ["node", "control-plane", "pod", "daemon"],
  },
  rbac: {
    term: "RBAC",
    definition:
      "Role-based access control. Permissions are attached to named roles, and identities get a role rather than a hand-written list of rights. It is how Kubernetes decides who may read secrets, create pods, or delete a namespace.",
    seeAlso: ["kubernetes", "service-account", "iam-policy", "namespace"],
  },
  "service-account": {
    term: "service account",
    definition:
      "An identity meant for software rather than a person, used by a pod to call the cluster's API. Kubernetes mounts its token straight into the pod's filesystem, so anything that can read files inside that pod inherits whatever the account is allowed to do.",
    seeAlso: ["rbac", "pod", "iam-role", "secret"],
  },
  secret: {
    term: "secret",
    definition:
      "A Kubernetes object for holding passwords, tokens, and keys apart from application code. The name oversells it: by default a secret is only base64 encoded, which is an encoding anyone can reverse, not encryption.",
    seeAlso: ["rbac", "namespace", "service-account"],
  },
  serverless: {
    term: "serverless",
    definition:
      "A model where code runs only when something triggers it and the provider handles every machine underneath. Servers still exist, the customer just never touches them. The trade is that permissions and the code itself become nearly the whole attack surface.",
    seeAlso: ["lambda", "paas", "iam-role"],
  },
  lambda: {
    term: "Lambda",
    definition:
      "Amazon's serverless service: upload a function, pick an event to trigger it, and it runs on demand. Each function assumes an IAM role, so a bug in a few lines of code can reach whatever that role is permitted to touch.",
    seeAlso: ["serverless", "iam-role", "ssrf-to-cloud"],
  },
};
