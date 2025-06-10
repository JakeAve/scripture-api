import type { Context, JSONObj, Payload, ResponseProps } from "../main.ts";
import { parseRef as parseRefServer } from "@jakeave/scripture-ref/server";
import { parseRef } from "@jakeave/scripture-ref/client";
import { makeCacheHeaders } from "../lib/makeCacheHeaders.ts";

export default function parse(context: Context, resp: ResponseProps): Payload {
  const ref = context.url.searchParams.get("ref");
  const content = context.url.searchParams.get("content");

  if (!ref) {
    return resp.respond({ results: [], input: "" }, {
      headers: makeCacheHeaders(),
    });
  }

  if (content === "true") {
    const result = parseRefServer(ref) as unknown as JSONObj;
    return resp.respond({ result, input: ref }, {
      headers: makeCacheHeaders(),
    });
  }

  const result = parseRef(ref) as unknown as JSONObj;
  return resp.respond({ result, input: ref }, { headers: makeCacheHeaders() });
}
