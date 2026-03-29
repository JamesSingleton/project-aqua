import Features from "@/components/features";
import { Hero } from "@/components/hero";
import { Testimonials } from "@/components/testimonials";

export default async function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Testimonials />
    </>
  );
}
