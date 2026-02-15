import { Hono } from "hono";
import type { Env } from "../types";
import { Layout } from "../views/layout";
import { PostForm } from "../views/form";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  return c.html(
    <Layout>
      <PostForm />
    </Layout>
  );
});

export { app as pagesRoute };
