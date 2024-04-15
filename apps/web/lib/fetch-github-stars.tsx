"use server";

export async function fetchGithubStars() {
  const response = await fetch(
    "https://api.github.com/repos/jamessingleton/project-aqua",
    {
      next: {
        revalidate: 300,
      },
    },
  );

  return response.json();
}
