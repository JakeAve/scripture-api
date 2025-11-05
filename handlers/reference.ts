import type { Context, Payload, ResponseProps } from "../main.ts";
import { books, contents, parseRef } from "@jakeave/scripture-ref/server";
import type { Book, BookName } from "@jakeave/scripture-ref/types";
import { makeCacheHeaders } from "../lib/makeCacheHeaders.ts";

class VerseOutOfRange extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export default function reference(
  context: Context,
  resp: ResponseProps
): Payload {
  try {
    const slug = context.params.book as keyof typeof books;

    const book = books[slug] as Book;

    if (!book) {
      return resp.respond(
        { error: `${slug} is not a valid book` },
        { status: 404 }
      );
    }

    const chapter = context.params.chapter as number;

    if (!chapter) {
      return resp.respond(
        { error: `Invalid chapter ${context.params.chapter}` },
        { status: 400 }
      );
    }

    if (chapter < 1 || chapter > book.chapters.length) {
      return resp.respond(
        {
          error: `Invalid ${slug === "dc" ? "section" : "chapter"} for ${
            book.name
          } ${context.params.chapter}`,
        },
        { status: 400 }
      );
    }

    const content = contents[book.name as BookName][chapter - 1];

    const verses = context.params.verses as string;

    if (!verses) {
      return resp.respond({ content });
    }

    if (typeof verses === "number") {
      if (verses < 1 || verses > content.length) {
        throw new VerseOutOfRange(
          `Verse out of range ${book.name} ${chapter}:${verses}`
        );
      }

      return resp.respond(
        { content: [content[verses - 1]] },
        { headers: makeCacheHeaders() }
      );
    }

    const ranges = verses.split("/");

    const stringRef = `${book.name} ${chapter}:${ranges.join(",")}`;

    const reference = parseRef(stringRef);

    return resp.respond(
      { content: reference.content as string },
      {
        headers: makeCacheHeaders(),
      }
    );
  } catch (e) {
    if (e instanceof VerseOutOfRange) {
      return resp.respond({ error: e.message }, { status: 400 });
    }
    console.error(e);
    return resp.respond({ error: "Internal server error" }, { status: 500 });
  }
}
