import {
  removeTeamLogo,
  removeUserAvatar,
  uploadTeamLogo,
  uploadUserAvatar,
} from "@project-aqua/storage";
import postgres from "postgres";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function downloadImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }

  return {
    data: await response.arrayBuffer(),
    mimeType: response.headers.get("content-type")?.split(";")[0] ?? "",
    fileName: new URL(url).pathname.split("/").pop(),
  };
}

async function main() {
  const sql = postgres(requiredEnv("DATABASE_URL_UNPOOLED"), {
    prepare: false,
    max: 1,
  });

  try {
    const teams = await sql<{ id: string; logo: string }[]>`
      select id, logo
      from organization
      where logo is not null
        and logo not like '/api/storage/%'
    `;
    for (const team of teams) {
      const uploaded = await uploadTeamLogo({
        teamId: team.id,
        file: await downloadImage(team.logo),
      });
      try {
        await sql`
          update organization
          set logo = ${uploaded.publicUrl}
          where id = ${team.id}
        `;
      } catch (error) {
        await removeTeamLogo({ pathOrUrl: uploaded.publicUrl });
        throw error;
      }
    }

    const users = await sql<{ id: string; image: string }[]>`
      select id, image
      from "user"
      where image is not null
        and image not like '/api/storage/%'
    `;
    for (const user of users) {
      const uploaded = await uploadUserAvatar({
        userId: user.id,
        file: await downloadImage(user.image),
      });
      try {
        await sql`
          update "user"
          set image = ${uploaded.publicUrl}
          where id = ${user.id}
        `;
      } catch (error) {
        await removeUserAvatar({ pathOrUrl: uploaded.publicUrl });
        throw error;
      }
    }

    console.log(
      `Migrated ${teams.length} team logos and ${users.length} user avatars.`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
