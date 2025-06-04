import type { Context, Payload, JSONObj, ResponseProps } from "../main.ts";
import { findRef } from "@jakeave/scripture-ref/server";
import type { BookName } from "@jakeave/scripture-ref/types";

export default function find(context: Context, resp: ResponseProps): Payload {
  const ref = context.url.searchParams.get("ref");
  if (!ref) {
    return resp.respond({ results: [], input: "" });
  }

  const books = context.url.searchParams.getAll("book") as BookName[];
  const volumes = context.url.searchParams.getAll("volume") as (
    | "ot"
    | "nt"
    | "bom"
    | "dc"
    | "pgp"
  )[];
  const max = context.url.searchParams.get("max");

  const maxResults = (max as unknown as number) ?? undefined;

  if (maxResults > 100) {
    return resp.respond(
      { error: `Max allowance is 100 results. Received ${maxResults}.` },
      { status: 400 }
    );
  }

  const results = findRef(ref, {
    books,
    volumes,
    maxResults,
  }) as unknown as JSONObj;

  return resp.respond({ results, input: ref });
}
