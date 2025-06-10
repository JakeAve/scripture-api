import type { Context, Payload, ResponseProps } from "../main.ts";

export default async function serverStatic(
  context: Context,
  resp: ResponseProps,
): Promise<Payload> {
  try {
    const fileName = context.data.fileName;
    const fileType = context.data.fileType as "image/png" | "image/x-icon";
    const file = await Deno.readFile(`${Deno.cwd()}/static/${fileName}`);

    return resp.respond(file, { type: fileType });
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return resp.respond({ error: "Not found" }, { status: 404 });
    }
    console.error(e);
    return resp.respond({ error: "Internal server error" }, { status: 500 });
  }
}
