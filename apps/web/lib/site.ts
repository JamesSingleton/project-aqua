export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://project-aqua-admin.vercel.app");

export const SIGN_IN_URL = `${APP_URL}/sign-in`;
export const SIGN_UP_URL = `${APP_URL}/sign-up`;
export const GITHUB_URL = "https://github.com/JamesSingleton/project-aqua";
export const GITHUB_ISSUES_URL = `${GITHUB_URL}/issues`;

export const SITE_NAME = "Project Aqua";

export const SITE_TAGLINE =
  "Roster, entries, and results for the team you coach.";

export const SITE_TITLE = `${SITE_NAME} · swim team software for coaches`;

export const SITE_DESCRIPTION =
  "Software for swim coaches. Roster, meet entries, results, practices, and times for club and high school. We don't run the meet.";

export const PRIMARY_CTA = "Create Your Free Team";

export const productLinks = [
  {
    href: "/product/roster",
    title: "Roster",
    description: "Swimmers, groups, coaches, and season enrollment.",
    shot: "roster" as const,
  },
  {
    href: "/product/meets",
    title: "Meets and entries",
    description:
      "Who's going, the file they asked for, then results next to last best.",
    shot: "entries" as const,
  },
  {
    href: "/product/workouts",
    title: "Workouts",
    description: "Write sets and keep practice on the team calendar.",
    shot: "workouts" as const,
  },
  {
    href: "/product/calendar",
    title: "Calendar",
    description: "Practices, meets, attendance, and calendar sync.",
    shot: "calendar" as const,
  },
  {
    href: "/product/progression",
    title: "Progression",
    description: "Best times, season charts, and the cut for this team only.",
    shot: "progression" as const,
  },
  {
    href: "/product/analytics",
    title: "Analytics",
    description: "Volume, attendance, top times, and who already made the cut.",
    shot: "analytics" as const,
  },
] as const;

export const audienceLinks = [
  {
    href: "/for/club",
    title: "Club teams",
    description: "SWIMS roster sync and SafeSport checks on the free plan.",
  },
  {
    href: "/for/high-school",
    title: "High school",
    description:
      "Class year, JV/Varsity divisions, and association event caps.",
  },
] as const;

export const formats = [
  {
    code: "HY3",
    use: "Meet entries and results for Hy-Tek Meet Manager.",
  },
  {
    code: "CL2",
    use: "Legacy entry and result packs, including CL2-only files.",
  },
  {
    code: "EV3",
    use: "Event files with sessions, events, and qualifying times.",
  },
  {
    code: "HYV",
    use: "Event files used by Meet Manager invitational setups.",
  },
  {
    code: "SDIF / SD3",
    use: "Interchange for TeamUnify, SwimTopia, and other SDIF meet software.",
  },
  {
    code: "XLS",
    use: "Meet Manager event reports when a binary pack is not available.",
  },
  {
    code: "ZIP",
    use: "Zipped event, entry, or result files in one download.",
  },
] as const;

export const weekLoad = [
  {
    waste: "Seed times",
    from: "Typing them again from a printout, last season, or memory.",
    to: "Best times on the roster fill the entry. You can still change them.",
  },
  {
    waste: "Who's going",
    from: "The event list in one place. The lineup in another.",
    to: "One meet. Look at it by event or by swimmer.",
  },
  {
    waste: "After the meet",
    from: "Results in a file. Best times in a spreadsheet. Cuts in your head.",
    to: "Import results. New time sits next to last best and the cut.",
  },
] as const;

export const meetWeek = [
  {
    title: "Bring in the event file",
    body: "Import EV3, HYV, XLS, or a ZIP. Events, sessions, divisions, and qualifying times land on the meet. Dive events are skipped so a swim-only team is not blocked.",
  },
  {
    title: "Mark who's going",
    body: "Enter individuals with seed times from your best times, staff relays, and scratch without deleting the row.",
  },
  {
    title: "Send the file they asked for",
    body: "Export HY3 or CL2 for Meet Manager, or SDIF if that's what they asked for. Print entries and a split sheet before you send it.",
  },
  {
    title: "Bring results back",
    body: "Import HY3, CL2, or ZIP. Previous best sits next to the new time. Toggle JO or sectionals to see who went under. Faster swims update best times. Unmatched rows stay visible.",
  },
] as const;

export const coachEasier = [
  {
    title: "Sunday results without a spreadsheet",
    body: "Import the file. Last best sits next to the new time. Toggle JO or sectionals without opening a second sheet.",
    href: "/product/meets",
  },
  {
    title: "Cuts without reconstructing top times",
    body: "Pro lists who is already under the standard you imported, by event, not from memory.",
    href: "/product/analytics",
  },
  {
    title: "Who was on deck last week",
    body: "Attendance and yardage come from practices you already ran, not a second tracking app.",
    href: "/product/analytics",
  },
  {
    title: "Times that stay with this team",
    body: "Club and high school do not rewrite each other when the same athlete swims both.",
    href: "/product/progression",
  },
] as const;

export const faqs = [
  {
    question: "Do you host meets or merge other clubs’ entries?",
    answer:
      "No. You manage your roster, your entries, and your results. If you're putting the meet on, you still use Meet Manager, SwimTopia, SwimCloud, or TeamUnify to receive files and run the pool. We don't merge other clubs' entries or replace a timing console.",
  },
  {
    question: "Will they actually be able to import the file?",
    answer:
      "They can import what you send into Meet Manager, SwimTopia, SwimCloud, or TeamUnify. HY3 or CL2 for Meet Manager, SDIF when that's what they asked for.",
  },
  {
    question: "What is free, and what is Pro?",
    answer:
      "Free includes one coach seat, unlimited swimmers, unlimited meets, meet import/export, seed times from best times, SWIMS roster sync for club teams, and progression. Pro adds more coach seats, lineup and relay suggestions, advanced analytics, and a larger shared AI draft quota.",
  },
  {
    question: "Can one login cover a club team and a high school team?",
    answer:
      "Yes. Switch teams without signing out. Roster, meets, and times stay with each team. High school uses class year and event limits; club uses USA Swimming ID, SWIMS, and SafeSport.",
  },
  {
    question: "Is there a parent portal or dues?",
    answer:
      "No. No family accounts, messaging, or dues. This is for the coach.",
  },
  {
    question: "Do I still need Team Manager?",
    answer:
      "If you're putting the meet on, you still use Meet Manager or whatever you use to run the pool. For your own team — roster, entries, paper, times — you don't need a second copy of the team in Team Manager.",
  },
] as const;

export const plans = [
  {
    id: "free",
    name: "Free",
    seats: "1 coach seat",
    summary:
      "Keep seed times, entries, and progression without paying per swimmer.",
    cta: PRIMARY_CTA,
    href: SIGN_UP_URL,
    featured: true,
    features: [
      "Unlimited swimmers and meets",
      "Meet import and HY3/CL2/SDIF export",
      "Seed times from best times",
      "Progression by course",
      "SWIMS roster sync for club teams",
      "5 shared AI draft generations / month",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    seats: "Up to 5 coach seats",
    summary: "Extra coaches, lineup help, and cut tracking.",
    cta: "Start Pro from the app",
    href: SIGN_UP_URL,
    featured: false,
    features: [
      "Everything on Free",
      "Lineup suggestions",
      "Relay suggestions",
      "Advanced analytics and cut tracking",
      "20 AI drafts / month, overage allowed",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    seats: "Unlimited coach seats",
    summary: "For programs that need more than five coaches.",
    cta: "Talk with us",
    href: "/support",
    featured: false,
    features: [
      "Everything on Pro",
      "Unlimited coach seats",
      "100 AI drafts / month, overage allowed",
    ],
  },
] as const;
