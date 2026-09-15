import {
  removeTeamLogo,
  removeUserAvatar,
  uploadTeamLogo,
  uploadUserAvatar,
} from "@project-aqua/storage";
import postgres from "postgres";
import { downloadPublicImage } from "./download-public-image";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function allowedPrivateImageOrigins(): ReadonlySet<string> {
  const origins = new Set<string>();
  for (const value of (process.env.IMAGE_IMPORT_ALLOWED_ORIGINS ?? "").split(
    ",",
  )) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    const url = new URL(trimmed);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        `IMAGE_IMPORT_ALLOWED_ORIGINS must contain HTTP(S) origins: ${trimmed}`,
      );
    }
    origins.add(url.origin);
  }
  return origins;
}

async function main() {
  const allowedOrigins = allowedPrivateImageOrigins();
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
        file: await downloadPublicImage(team.logo, allowedOrigins),
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
        file: await downloadPublicImage(user.image, allowedOrigins),
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
