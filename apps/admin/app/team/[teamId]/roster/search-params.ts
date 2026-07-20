import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { getSortingStateParser } from "@/lib/parsers";

export const rosterSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser().withDefault([{ id: "lastName", desc: false }]),
  firstName: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsString, ",").withDefault([]),
  gender: parseAsArrayOf(parseAsString, ",").withDefault([]),
  groupId: parseAsArrayOf(parseAsString, ",").withDefault([]),
  classYear: parseAsArrayOf(parseAsString, ",").withDefault([]),
  tab: parseAsString.withDefault("swimmers"),
});

export type RosterSearchParams = Awaited<
  ReturnType<typeof rosterSearchParamsCache.parse>
>;
