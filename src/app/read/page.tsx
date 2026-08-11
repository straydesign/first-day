import type { Metadata } from "next";
import TheRead from "@/components/TheRead";

export const metadata: Metadata = {
  title: "The Read — First Day",
  description:
    "Forty questions, about seven minutes. Where you actually are, before you say what you want.",
  robots: { index: false, follow: false },
};

export default function ReadPage() {
  return <TheRead />;
}
