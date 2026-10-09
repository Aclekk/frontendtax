import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/landing-page?mode=self-service");
}
