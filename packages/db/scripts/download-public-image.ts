import { lookup as dnsLookup } from "node:dns";
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { type ImageInput, MAX_IMAGE_BYTES } from "@project-aqua/storage";

const MAX_REDIRECTS = 5;

const blockedAddresses = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}

for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001:10::", 28],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

export function isPublicNetworkAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blockedAddresses.check(address, "ipv4");
  if (family === 6) return !blockedAddresses.check(address, "ipv6");
  return false;
}

const lookupPublicAddress: LookupFunction = (hostname, options, callback) => {
  dnsLookup(
    hostname,
    { ...options, all: true, verbatim: true },
    (error, addresses) => {
      if (error) {
        callback(error, "", 4);
        return;
      }

      const blocked = addresses.find(
        ({ address }) => !isPublicNetworkAddress(address),
      );
      if (blocked) {
        callback(
          new Error(`Refusing private image address for ${hostname}`),
          "",
          blocked.family,
        );
        return;
      }

      const selected = addresses[0];
      if (!selected) {
        callback(new Error(`No image address found for ${hostname}`), "", 4);
        return;
      }

      if (options.all) {
        callback(null, addresses);
        return;
      }
      callback(null, selected.address, selected.family);
    },
  );
};

function parsePublicImageUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Image URL must use HTTP or HTTPS: ${value}`);
  }
  if (url.username || url.password) {
    throw new Error(`Image URL must not include credentials: ${value}`);
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname) && !isPublicNetworkAddress(hostname)) {
    throw new Error(`Refusing private image address for ${hostname}`);
  }

  return url;
}

export async function downloadPublicImage(
  value: string,
  redirects = 0,
): Promise<ImageInput> {
  if (redirects > MAX_REDIRECTS) {
    throw new Error(`Too many redirects while downloading ${value}`);
  }

  const url = parsePublicImageUrl(value);
  const get = url.protocol === "https:" ? httpsGet : httpGet;

  return new Promise((resolve, reject) => {
    const request = get(
      url,
      {
        headers: { "user-agent": "Project-Aqua-Neon-Migration/1.0" },
        lookup: lookupPublicAddress,
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const location = response.headers.location;
        if (status >= 300 && status < 400 && location) {
          response.resume();
          downloadPublicImage(new URL(location, url).toString(), redirects + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (status < 200 || status >= 300) {
          response.resume();
          reject(new Error(`Failed to download ${value}: HTTP ${status}`));
          return;
        }

        const contentLength = Number(response.headers["content-length"] ?? 0);
        if (contentLength > MAX_IMAGE_BYTES) {
          response.resume();
          reject(new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes: ${value}`));
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.byteLength;
          if (size > MAX_IMAGE_BYTES) {
            response.destroy(
              new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes: ${value}`),
            );
            return;
          }
          chunks.push(chunk);
        });
        response.on("error", reject);
        response.on("end", () => {
          resolve({
            data: Buffer.concat(chunks, size),
            mimeType: response.headers["content-type"]?.split(";")[0] ?? "",
            fileName: url.pathname.split("/").pop(),
          });
        });
      },
    );

    request.on("error", reject);
  });
}
