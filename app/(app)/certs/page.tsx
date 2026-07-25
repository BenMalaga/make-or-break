import { redirect } from "next/navigation";

// Certifications were folded into the Learn tab (the Certifications view), which
// keeps the Make/Break switch over paths, modules, and certs. Old links land there.
export default function CertsIndexRedirect() {
  redirect("/learn?view=certs");
}
