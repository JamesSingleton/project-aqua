import {
  CalendarIcon,
  BarChartIcon,
  UserCircleIcon,
  MessageCircleIcon,
  LayersIcon,
  SmartphoneIcon,
} from "lucide-react";

const features = [
  {
    id: 1,
    title: "Intelligent Scheduling Engine",
    description:
      "Effortlessly optimize event timelines and athlete participation with our AI-powered scheduling, ensuring seamless meet organization.",
    icon: CalendarIcon,
  },
  {
    id: 2,
    title: "Dynamic Performance Analytics",
    description:
      "Gain deeper insights into team and athlete performance through real-time analytics, empowering data-driven decisions for success.",
    icon: BarChartIcon,
  },
  {
    id: 3,
    title: "Customizable Athlete Profiles",
    description:
      "Tailor athlete profiles with personalized metrics, achievements, and training regimens for focused performance enhancement.",
    icon: UserCircleIcon,
  },
  {
    id: 4,
    title: "Collaborative Team Communication",
    description:
      "Facilitate cohesive teamwork with integrated communication tools, fostering streamlined collaboration and coordination.",
    icon: MessageCircleIcon,
  },
  {
    id: 5,
    title: "Multi-Team Management",
    description:
      "Efficiently oversee multiple teams from one central hub, simplifying administration for coaches and organizers.",
    icon: LayersIcon,
  },
  {
    id: 6,
    title: "Mobile-Optimized Meet Entries",
    description:
      "Empower on-the-go event management with our mobile-friendly interface, enabling easy meet entries and updates anytime, anywhere.",
    icon: SmartphoneIcon,
  },
];

export default async function Home() {
  return (
    <>
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid items-center gap-6">
            <div className="flex flex-col justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-3xl font-bold tracking-tighter text-transparent sm:text-5xl xl:text-6xl">
                  Revolutionizing Team & Meet Management
                </h1>
                <p className="mx-auto max-w-2xl text-muted-foreground md:text-xl">
                  Empower your team&apos;s success with seamless management
                  tools. Elevate performance effortlessly from roster to event
                  organization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid items-center gap-6">
            <div className="flex flex-col justify-center space-y-8 text-center">
              <div className="space-y-2">
                <h2 className="bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-3xl font-bold tracking-tighter text-transparent sm:text-5xl xl:text-6xl/none">
                  Discover Our Unique Features
                </h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                  Our features are designed to enhance your productivity and
                  streamline your workflow.
                </p>
              </div>
              <div className="mx-auto w-full max-w-full space-y-4">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {features?.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex flex-col items-center space-y-2 rounded-lg border-gray-800 p-4"
                    >
                      <div className="rounded-full bg-opacity-50 p-2">
                        <feature.icon className="mb-2 h-6 w-6 opacity-75" />
                      </div>
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
