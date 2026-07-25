import { redirect } from "next/navigation";

// Paths were consolidated into the Learn tab (the Learning Paths view), which
// keeps the Make/Break switch over both paths and modules. Old links land there.
export default function PathsIndexRedirect() {
  redirect("/learn?view=paths");
}
