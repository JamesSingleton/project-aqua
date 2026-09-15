import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import {
  downloadPublicImage,
  isPublicNetworkAddress,
} from "../scripts/download-public-image";

describe("public image downloads", () => {
  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.0.1",
    "198.51.100.1",
    "::",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
  ])("rejects non-public address %s", (address) => {
    expect(isPublicNetworkAddress(address)).toBe(false);
  });

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "accepts public address %s",
    (address) => {
      expect(isPublicNetworkAddress(address)).toBe(true);
    },
  );

  it("rejects a private IP before making a request", async () => {
    await expect(
      downloadPublicImage("http://169.254.169.254/latest/meta-data"),
    ).rejects.toThrow("Refusing private image address");
  });

  it("rejects a hostname that resolves to a private IP", async () => {
    await expect(
      downloadPublicImage("http://localhost/image.png"),
    ).rejects.toThrow("Refusing private image address");
  });

  it("downloads from an explicitly allowed private origin", async () => {
    const server = createServer((_request, response) => {
      response.setHeader("content-type", "image/png");
      response.end(Buffer.from([1, 2, 3]));
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Test server did not bind to a TCP port");
      }
      const origin = `http://127.0.0.1:${address.port}`;
      const image = await downloadPublicImage(
        `${origin}/image.png`,
        new Set([origin]),
      );

      expect(image.mimeType).toBe("image/png");
      expect(image.data.byteLength).toBe(3);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("rejects non-HTTP URLs and embedded credentials", async () => {
    await expect(
      downloadPublicImage("data:image/png;base64,AA=="),
    ).rejects.toThrow("must use HTTP or HTTPS");
    await expect(
      downloadPublicImage("https://user:password@example.com/image.png"),
    ).rejects.toThrow("must not include credentials");
  });
});
