import type { Context, JSONObj, Payload, ResponseProps } from "../main.ts";
import { findRef } from "@jakeave/scripture-ref/server";
import type { BookName } from "@jakeave/scripture-ref/types";
import { makeCacheHeaders } from "../lib/makeCacheHeaders.ts";
import {
  doesResultExist,
  getResults,
  storeResults,
} from "../data/findCache.ts";

const MAX_RESULTS = 50;

export default async function find(
  context: Context,
  resp: ResponseProps
): Promise<Payload> {
  const searchParams = context.url.searchParams;

  const ref = searchParams.get("ref");
  if (!ref) {
    return resp.respond({ results: [], input: "" });
  }

  const books = searchParams.getAll("book") as BookName[];
  const volumes = searchParams.getAll("volume") as (
    | "ot"
    | "nt"
    | "bom"
    | "dc"
    | "pgp"
  )[];

  const rawStart = searchParams.get("start");
  const start = Number(rawStart) || 0;

  const rawEnd = searchParams.get("end");
  const end = Number(rawEnd) || 5;

  if (start > end) {
    return resp.respond(
      {
        error: `start must be less than end. Received start ${start} and end ${end}.`,
      },
      { status: 400 }
    );
  }

  if (end - start > MAX_RESULTS) {
    return resp.respond(
      {
        error: `Max allowance is ${MAX_RESULTS} results. Received ${
          end - start
        }.`,
      },
      { status: 400 }
    );
  }

  const keyParams = new URLSearchParams();

  keyParams.append("ref", ref);
  books.sort().forEach((book) => keyParams.append("book", book));
  volumes.sort().forEach((volume) => keyParams.append("volume", volume));

  const key = keyParams.toString();

  const isCached = await doesResultExist(key);

  if (isCached) {
    const results = await getResults(key, { start, end });

    return resp.respond(
      { results: results as unknown as JSONObj, input: ref },
      { headers: makeCacheHeaders() }
    );
  } else {
    const matches = findRef(ref, {
      books,
      volumes,
      maxResults: MAX_RESULTS,
    });

    storeResults(key, matches);

    const results = matches.slice(start, end);

    return resp.respond(
      { results: results as unknown as JSONObj, input: ref },
      { headers: makeCacheHeaders() }
    );
  }
}
