export const productShots = {
  dashboard: {
    file: "dashboard.png",
    alt: "Team dashboard for Harbor City Aquatics with 16 swimmers, volume and attendance charts, upcoming Harbor Invitational, and recent season best times.",
    caption: "Next meet, entry deadline, recent best times.",
  },
  roster: {
    file: "roster.png",
    alt: "Roster of 16 Harbor City Aquatics swimmers grouped into Senior and Age Group for the current season.",
    caption:
      "One roster per program. Groups live on the season, not on the person.",
  },
  meets: {
    file: "meets.png",
    alt: "Meets hub showing Fall Kickoff and Harbor Invitational with entry progress for Harbor City Aquatics.",
    caption: "Every meet is your team’s lineup.",
  },
  entries: {
    file: "entries.png",
    alt: "Meet entries in program order for the women’s 100 freestyle at Harbor Invitational, with seed times filled from best times.",
    caption:
      "Program view in event order. Seed times from best times. Scratches stay on the page.",
  },
  workouts: {
    file: "workouts.png",
    alt: "Workout list with aerobic, threshold, and race-pace practices for Harbor City Aquatics.",
    caption: "Practice sets stay with the team you are coaching today.",
  },
  calendar: {
    file: "calendar.png",
    alt: "September team calendar with weekday practices and Fall Kickoff on the same board.",
    caption: "Practices, meets, and attendance on one calendar.",
  },
  progression: {
    file: "progression.png",
    alt: "Season best times by course for Harbor City Aquatics swimmers after Fall Kickoff.",
    caption:
      "Times stay attached to this team, including after a results import.",
  },
  analytics: {
    file: "analytics.png",
    alt: "Analytics for Harbor City Aquatics with 7-day and 30-day volume, attendance rate, training charts, and team top times.",
    caption:
      "Volume and attendance from practices you already ran. Team top times from the same week.",
  },
  cutTracker: {
    file: "cut-tracker.png",
    alt: "Pro cut tracker listing Harbor City swimmers already at or faster than Pacific JO, with each best time next to the standard.",
    caption:
      "Pro: who is already under the standard you imported, without rebuilding top times.",
  },
  results: {
    file: "results.png",
    alt: "Fall Kickoff results with previous bests and Pacific JO time standards toggled on, showing who went under or over the cut.",
    caption:
      "New time, last best, and the cut on one row. Toggle the standard set without leaving the meet.",
  },
} as const;

export type ProductShotId = keyof typeof productShots;
