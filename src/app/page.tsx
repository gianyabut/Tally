import { redirect } from "next/navigation";

// Auth-aware routing lands here later. For now, everyone starts at login.
export default function Home() {
  redirect("/login");
}
