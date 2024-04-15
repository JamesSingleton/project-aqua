import { InfiniteMovingCards } from "./infinite-moving-cards";

const testimonials = [
  {
    quote:
      "This new platform revolutionized how we manage our swim team. The features are outstanding and the interface is incredibly user-friendly.",
    name: "Sarah Johnson",
    organization: "Aquatic Aces Swim Club",
  },
  {
    quote:
      "As a coach, I've tried several swim team management tools, but none compare to this one. It's intuitive, efficient, and has everything we need to streamline our operations.",
    name: "Michael Thompson",
    organization: "Pacific Coast Aquatics",
  },
  {
    quote:
      "Our swimmers love the new platform! It's helped them stay organized, motivated, and connected with their teammates like never before.",
    name: "Emily Rodriguez",
    organization: "Golden Dolphins Swim Team",
  },
  {
    quote:
      "I've been using this software for months now, and I'm continually impressed by its capabilities. It's a game-changer for swim coaches and teams.",
    name: "David Lee",
    organization: "Central Valley Swim Academy",
  },
  {
    quote:
      "This platform has made managing our swim team a breeze. From scheduling practices to tracking performance metrics, it's all in one place and easy to access.",
    name: "Jessica Smith",
    organization: "Marine Marlins Swim Club",
  },
  {
    quote:
      "I highly recommend this software to any swim coach or team manager. It has saved us countless hours of administrative work and allowed us to focus more on coaching and training.",
    name: "Daniel Brown",
    organization: "Cascade Rapids Aquatics",
  },
];

export function Testimonials() {
  return (
    <section className="relative mt-16 md:mt-18">
      <h2 className="text-4xl mb-8">What people are saying</h2>
      <InfiniteMovingCards
        items={testimonials}
        direction="right"
        speed="slow"
      />
    </section>
  );
}
