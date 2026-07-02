// Dev entry point: listen on PORT (default 2567 → ws://localhost:2567).
// Fly.io hosting comes later; this is the local/dev server.
import { createGameServer } from "./createServer.js";

const PORT = Number(process.env.PORT) || 2567;

createGameServer()
  .listen(PORT)
  .then(() => {
    console.log(`🎨 SPLOTCH match server listening on ws://localhost:${PORT}`);
  })
  .catch((err) => {
    console.error("Failed to start SPLOTCH server:", err);
    process.exit(1);
  });
