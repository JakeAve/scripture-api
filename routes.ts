import find from "./handlers/find.ts";
import home from "./handlers/home.ts";
import parse from "./handlers/parse.ts";
import reference from "./handlers/reference.ts";
import type { Context, Payload, ResponseProps } from "./main.ts";

export type RouteHandler = (
  context: Context,
  response: ResponseProps,
) => Payload;

interface Route {
  pattern: RegExp;
  path: string;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: Route[] = [
  {
    pattern: /^\/$/,
    path: "/",
    paramNames: [],
    handler: (context, resp) => {
      context.data.paths = routes.map(({ path }) => path);
      return home(context, resp);
    },
  },
  {
    pattern: /^\/v1$/,
    path: "/v1",
    paramNames: [],
    handler: (context, resp) => {
      context.data.paths = routes.map(({ path }) => path);
      return home(context, resp);
    },
  },
  {
    pattern: /^\/v1\/find$/,
    paramNames: [],
    path: "/v1/find",
    handler: find,
  },
  {
    pattern: /^\/v1\/parse$/,
    paramNames: [],
    path: "/v1/parse",
    handler: parse,
  },
  {
    pattern: /^\/v1\/([^/]+)\/([^/]+)(?:\/([\d\-\/]+))?$/,
    paramNames: ["book", "chapter", "verses"],
    path: "/v1/:book/:chapter/:verses",
    handler: reference,
  },
];

export default routes;
