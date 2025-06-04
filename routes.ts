import find from "./handlers/find.ts";
import home from "./handlers/home.ts";
import parse from "./handlers/parse.ts";
import reference from "./handlers/reference.ts";
import serverStatic from "./handlers/serveStatic.ts";
import type { Context, Payload, ResponseProps } from "./main.ts";

export type RouteHandler = (
  context: Context,
  response: ResponseProps
) => Payload | Promise<Payload>;

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
    path: "/v1/find?ref=&book=&volume=&max=",
    handler: find,
  },
  {
    pattern: /^\/v1\/parse$/,
    paramNames: [],
    path: "/v1/parse?ref=&content=",
    handler: parse,
  },
  {
    pattern: /^\/v1\/([^/]+)\/([^/]+)(?:\/([\d\-\/]+))?$/,
    paramNames: ["book", "chapter", "verses"],
    path: "/v1/:book/:chapter/:verses",
    handler: reference,
  },
  {
    pattern: /^\/favicon.ico$/,
    paramNames: [],
    path: "/favicon.ico",
    handler: (context, resp) => {
      context.data.fileName = "favicon.ico";
      context.data.fileType = "image/x-icon";
      return serverStatic(context, resp);
    },
  },
  {
    pattern: /^\/apple-touch-icon.png$/,
    paramNames: [],
    path: "/apple-touch-icon.png",
    handler: (context, resp) => {
      context.data.fileName = "apple-touch-icon.png";
      context.data.fileType = "image/png";
      return serverStatic(context, resp);
    },
  },
  {
    pattern: /^\/apple-touch-icon-precomposed.png$/,
    paramNames: [],
    path: "/apple-touch-icon-precomposed.png",
    handler: (context, resp) => {
      context.data.fileName = "apple-touch-icon.png";
      context.data.fileType = "image/png";
      return serverStatic(context, resp);
    },
  },
];

export default routes;
