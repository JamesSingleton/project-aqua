import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: {
    buckets: {
      "team-logos": {
        access: "public_read",
      },
      "user-avatars": {
        access: "public_read",
      },
    },
  },
});
