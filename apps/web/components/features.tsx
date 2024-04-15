import {
  GaugeIcon,
  MergeIcon,
  TrendingUpIcon,
  SearchIcon,
  BarChartIcon,
  FileTextIcon,
  ComponentIcon,
  FlagIcon,
  CreativeCommonsIcon,
} from "lucide-react";

export default function Features() {
  return (
    <section className="mt-16 md:mt-18">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 grid-rows-6 gap-4">
        <div className="col-span-1 lg:col-span-2 xl:col-span-4 row-span-2 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <GaugeIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Quick Registration</h2>
          <p className="text-secondary-foreground">
            Sign up your swim team in minutes and get back to the pool.
          </p>
        </div>
        <div className="col-span-1 lg:col-span-3 xl:col-span-6 row-span-2 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <MergeIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            Swim Meet Integrations
          </h2>
          <p className="text-secondary-foreground">
            Seamlessly integrate with major swim meet software.
          </p>
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-5 row-span-1 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <TrendingUpIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Performance Tracking</h2>
          <p className="text-secondary-foreground">
            Monitor your team's progress with advanced analytics.
          </p>
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2 row-span-2 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <SearchIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Athlete Search</h2>
          <p className="text-secondary-foreground">
            Find athletes by name, age, or event within seconds.
          </p>
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-3 row-span-2 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <BarChartIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Team Analytics</h2>
          <p className="text-secondary-foreground">
            Dive deep into your team's performance with detailed analytics.
          </p>
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-3 row-span-3 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <SearchIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Advanced Event Search</h2>
          <p className="text-secondary-foreground">
            Quickly find upcoming swim meets and events with our powerful search
            tool.
          </p>
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2 row-span-1 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <FileTextIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Customizable Profiles</h2>
          <p className="text-secondary-foreground">
            Create and customize profiles for each team member.
          </p>
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-5 row-span-2 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <ComponentIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Drill Library</h2>
          <p className="text-secondary-foreground">
            Access a vast library of swim drills and training exercises.
          </p>
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2 row-span-1 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <FlagIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Easy Updates</h2>
          <p className="text-secondary-foreground">
            Stay up-to-date with the latest features effortlessly.
          </p>
        </div>
        <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-2 row-span-1 flex flex-col items-center justify-center bg-secondary p-6 rounded-lg text-center">
          <CreativeCommonsIcon className=" h-10 w-10 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Community Driven</h2>
          <p className="text-secondary-foreground">
            Built with feedback from swim coaches and teams.
          </p>
        </div>
      </div>
    </section>
  );
}
