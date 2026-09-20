import { Badge } from "@project-aqua/ui/components/badge";
import { GITHUB_URL } from "@/lib/site";

export async function GithubStars() {
  const count = await fetchStarCount();
  const label =
    count === null
      ? "Star"
      : Intl.NumberFormat("en", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(count);

  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      className="press-scale inline-flex items-center overflow-hidden rounded-lg ring-1 ring-foreground/10"
    >
      <span className="bg-secondary px-2.5 py-1 text-sm font-medium">
        GitHub
      </span>
      <Badge variant="outline" className="rounded-none border-0 px-2.5 py-1">
        {label}
      </Badge>
    </a>
  );
}

async function fetchStarCount(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/JamesSingleton/project-aqua",
      {
        next: { revalidate: 3600 },
        headers: { Accept: "application/vnd.github+json" },
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number"
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}
