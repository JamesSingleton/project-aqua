export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://admin.lane4hq.com");

export const DOCS_URL =
  process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3004";

export const SIGN_IN_URL = `${APP_URL}/sign-in`;
export const SIGN_UP_URL = `${APP_URL}/sign-up`;
export const GITHUB_URL = "https://github.com/JamesSingleton/lane4-hq";
export const GITHUB_ISSUES_URL = `${GITHUB_URL}/issues`;

export const SITE_NAME = "Lane4 HQ";

export const SITE_TAGLINE =
  "Roster, entries, and results for club and high school coaches.";

export const SITE_TITLE = `${SITE_NAME} · swim team software for coaches`;

export const SITE_DESCRIPTION =
  "Roster, meet entries, and results for club and high school swim coaches. Seed times from best times, HY3, CL2, and SDIF export, and the cuts you enter. We don't run the meet.";

export const PRIMARY_CTA = "Create your free team";

export const productLinks = [
  {
    href: "/product/roster",
    title: "Roster",
    description:
      "Swimmers, training groups, and the season fields for a club or a high school.",
    shot: "roster" as const,
  },
  {
    href: "/product/meets",
    title: "Meets and entries",
    description:
      "Who is going, the file the host asked for, then results next to previous best.",
    shot: "entries" as const,
  },
  {
    href: "/product/workouts",
    title: "Workouts",
    description:
      "Write the set. Practice stays on the same calendar as the meets.",
    shot: "workouts" as const,
  },
  {
    href: "/product/calendar",
    title: "Calendar",
    description:
      "Practices, duals, invitationals, attendance, and a calendar feed.",
    shot: "calendar" as const,
  },
  {
    href: "/product/progression",
    title: "Progression",
    description: "Best times and season charts, kept with this team.",
    shot: "progression" as const,
  },
  {
    href: "/product/analytics",
    title: "Analytics",
    description:
      "Yardage, attendance, and top times. Pro adds a roster-wide cut list.",
    shot: "analytics" as const,
  },
] as const;

export const audienceLinks = [
  {
    href: "/for/club",
    title: "Club teams",
    description:
      "Invitational meet weeks, a USA Swimming ID on the roster, and cuts such as JO or sectionals.",
  },
  {
    href: "/for/high-school",
    title: "High school",
    description:
      "Duals and invitationals, class year, JV and Varsity, and association event limits.",
  },
] as const;

export const formats = [
  {
    code: "HY3",
    use: "Entries and results for Hy-Tek Meet Manager.",
  },
  {
    code: "CL2",
    use: "Older entry and result packs, including CL2-only files.",
  },
  {
    code: "EV3",
    use: "Event files with sessions, events, and qualifying times.",
  },
  {
    code: "HYV",
    use: "Event files from Meet Manager invitational setups.",
  },
  {
    code: "SDIF / SD3",
    use: "Interchange when the host asked for SDIF, including TeamUnify and SwimTopia.",
  },
  {
    code: "XLS",
    use: "Meet Manager event reports, when you do not have a binary pack.",
  },
  {
    code: "ZIP",
    use: "Event, entry, or result files bundled in one download.",
  },
] as const;

export const weekLoad = [
  {
    waste: "Seed times",
    from: "Re-typing them from a printout, last season, or memory.",
    to: "The swimmer's best time fills the seed. You can still change it.",
  },
  {
    waste: "Who is going",
    from: "The host's events in one place, the lineup in another.",
    to: "One meet. Read it in event order, or by swimmer when you check entry limits.",
  },
  {
    waste: "After the meet",
    from: "Results in a file, best times in a spreadsheet, cuts in your head.",
    to: "Import the results. The new time sits next to previous best, and next to a cut you entered.",
  },
] as const;

export const meetWeek = [
  {
    title: "Bring in the event file",
    body: "Import EV3, HYV, XLS, or a ZIP. Sessions, events, divisions, and qualifying times land on the meet. Dive events in a combined file stay off the swim entry board.",
  },
  {
    title: "Mark who is going",
    body: "Enter individuals with seed times from best times, staff relays, and scratch without deleting the row. A Saturday invitational and a Tuesday dual use the same lineup.",
  },
  {
    title: "Send the file they asked for",
    body: "Export HY3 or CL2 for Meet Manager, or SDIF when that is what the host asked for. Print the entries and a split sheet before you send it.",
  },
  {
    title: "Bring results back",
    body: "Import HY3, CL2, SDIF, or a ZIP. Previous best sits next to the new time. Turn on a time standard you entered — JO, sectionals, or a high school cut — to see who went under. Faster swims update best times. Unmatched rows stay visible.",
  },
] as const;

export const coachEasier = [
  {
    title: "Sunday results next to previous best",
    body: "Import the file. Previous best sits on the row. Compare a cut you entered without leaving the meet.",
    href: "/product/meets",
  },
  {
    title: "Cuts you already know by name",
    body: "Enter JO, sectionals, or a high school standard. Pro lists who is already at or under it, by event.",
    href: "/product/analytics",
  },
  {
    title: "Who was on deck last week",
    body: "Attendance and yardage come from practices you already ran, before you name a relay.",
    href: "/product/analytics",
  },
  {
    title: "Times that stay with this team",
    body: "A swimmer on both your club and your high school does not rewrite one team's times with the other's.",
    href: "/product/progression",
  },
] as const;

export const faqs = [
  {
    question: "Do you host meets or merge other teams' entries?",
    answer:
      "No. You manage your roster, your entries, and your results for meets your team attends, whether that is a club invitational or a high school dual. If you are putting the meet on, you still use Meet Manager, SwimTopia, SwimCloud, or TeamUnify to receive files and run the pool. We don't merge other teams' entries or replace a timing console.",
  },
  {
    question: "Will the host be able to open the file?",
    answer:
      "You export the interchange those programs already use: HY3 or CL2 for Meet Manager, SDIF when the host asked for it. We don't operate their import. A host can still reject a file under their own rules.",
  },
  {
    question: "What is free, and what is Pro?",
    answer:
      "Free includes one coach seat, unlimited swimmers, unlimited meets, meet import and export, seed times from best times, progression, SWIMS roster sync for club teams, and high school class year and association event limits. Practice drafts and relay-order suggestions share one pool: 5 a month on Free. Pro adds more coach seats, lineup suggestions for open individual spots, a roster-wide cut list, and 20 drafts a month, with overage allowed after that.",
  },
  {
    question: "Can one login cover a club team and a high school team?",
    answer:
      "Yes. Switch teams without signing out. Roster, meets, and times stay with each team. High school uses class year, JV and Varsity, and association event limits. Club uses a USA Swimming ID, SWIMS roster sync, and SafeSport checks. Lane4 HQ is not certified or approved by USA Swimming.",
  },
  {
    question: "Is there a parent portal or dues?",
    answer:
      "No. No family accounts, messaging, or dues. This is for the coach.",
  },
  {
    question: "Do I still need Team Manager?",
    answer:
      "If you are putting the meet on, you still use Meet Manager or whatever runs the pool. For your own roster, entries, paper, and times — club or high school — that work can live here.",
  },
] as const;

export const plans = [
  {
    id: "free",
    name: "Free",
    seats: "1 coach seat",
    summary:
      "Seed times, entries, and progression for one coach. Club or high school.",
    cta: PRIMARY_CTA,
    href: SIGN_UP_URL,
    featured: true,
    features: [
      "Unlimited swimmers and meets",
      "Meet import and HY3, CL2, and SDIF export",
      "Seed times from best times",
      "Progression by course",
      "SWIMS roster sync for club teams",
      "High school class year and association event limits",
      "5 practice drafts or relay suggestions / month",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    seats: "Up to 5 coach seats",
    summary: "Extra coaches, a suggested lineup, and a roster-wide cut list.",
    cta: "Start Pro from the app",
    href: SIGN_UP_URL,
    featured: false,
    features: [
      "Everything on Free",
      "Lineup suggestions for open individual spots",
      "Roster-wide cut tracking",
      "20 practice drafts or relay suggestions / month, then overage",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    seats: "Unlimited coach seats",
    summary: "For a staff larger than five coaches.",
    cta: "Talk with us",
    href: "/support",
    featured: false,
    features: [
      "Everything on Pro",
      "Unlimited coach seats",
      "100 practice drafts or relay suggestions / month, then overage",
    ],
  },
] as const;
