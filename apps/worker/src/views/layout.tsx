import type { FC, PropsWithChildren } from "hono/jsx";

export const Layout: FC<PropsWithChildren> = ({ children }) => (
  <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Auto Post Blog</title>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="alternate icon" href="/favicon.svg" />
      <script src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js" />
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <main class="container">
        <h1>Auto Post Blog</h1>
        {children}
      </main>
      <footer class="site-footer">
        <p>v0.1.5</p>
      </footer>
      <script src="/app.js" />
    </body>
  </html>
);
