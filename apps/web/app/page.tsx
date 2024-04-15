import Link from "next/link";

import { buttonVariants } from "@repo/ui/button";
import { Icons } from "@/components/icons";
import { Testimonials } from "@/components/testimonials";
import { Hero } from "@/components/hero";
import Features from "@/components/features";

export default async function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Testimonials />
    </>
  );
}
