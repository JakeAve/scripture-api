import type { Context, Payload, ResponseProps } from "../main.ts";
import { books, contents } from "@jakeave/scripture-ref/server";
import type { Book, BookName } from "@jakeave/scripture-ref/types";

class VerseOutOfRange extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export default function reference(
  context: Context,
  resp: ResponseProps,
): Payload {
  try {
    const slug = context.params.book as keyof typeof books;

    const book = books[slug] as Book;

    if (!book) {
      return resp.respond(
        { error: `${slug} is not a valid book` },
        { status: 404 },
      );
    }

    const chapter = context.params.chapter as number;

    if (!chapter) {
      return resp.respond(
        { error: `Invalid chapter ${context.params.chapter}` },
        { status: 400 },
      );
    }

    if (chapter < 1 || chapter > book.chapters.length) {
      return resp.respond(
        {
          error: `Invalid ${
            slug === "dc" ? "section" : "chapter"
          } for ${book.name} ${context.params.chapter}`,
        },
        { status: 400 },
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
          `Verse out of range ${book.name} ${chapter}:${verses}`,
        );
      }

      return resp.respond({ content: [content[verses - 1]] });
    }

    const ranges = verses.split("/");

    const verseContent: string[] = [];

    for (const r of ranges) {
      const matches = r.match(/\d+/g)?.reduce<number[]>((acc, num) => {
        const n = Number(num);
        if (n < 0 || n > content.length) {
          throw new VerseOutOfRange(
            `Verse out of range ${book.name} ${chapter}:${n}`,
          );
        }
        return n > 0 && n < content.length ? [...acc, n] : acc;
      }, []);

      if (matches && matches.length === 2) {
        verseContent.push(...content.slice(matches[0] - 1, matches[1]));
      }

      if (matches && matches.length === 1) {
        verseContent.push(content[matches[0] - 1]);
      }
    }

    return resp.respond({ content: verseContent });
  } catch (e) {
    if (e instanceof VerseOutOfRange) {
      return resp.respond({ error: e.message });
    }
    console.error(e);
    return resp.respond({ error: "Internal server error" }, { status: 500 });
  }
}
