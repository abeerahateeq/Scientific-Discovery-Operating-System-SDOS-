import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import sub-routers
import authRouter from "./src/server/routes/auth.js";
import papersRouter from "./src/server/routes/papers.js";
import graphRouter from "./src/server/routes/graph.js";
import hypothesesRouter from "./src/server/routes/hypotheses.js";
import bountiesRouter from "./src/server/routes/bounties.js";
import interdisciplinaryRouter from "./src/server/routes/interdisciplinary.js";

const app = express();
const PORT = 3000;

// Body parsing middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[Express] ${req.method} ${req.url}`);
  next();
});

// Mount Sub-routers
app.use("/api/auth", authRouter);
app.use("/api/papers", papersRouter);
app.use("/api/graph", graphRouter);
app.use("/api/hypotheses", hypothesesRouter);
app.use("/api/bounties", bountiesRouter);
app.use("/api/interdisciplinary", interdisciplinaryRouter);

// Vite middleware and static asset serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on port ${PORT}`);
    console.log(`[Server] Access at http://0.0.0.0:${PORT}`);
  });
}

startServer();
