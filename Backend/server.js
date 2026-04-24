import app from "./app.js";
import connectDB from "./config/db.js";
import http from "http";
import { initSocket } from "./utils/socket.js";

if (process.env.CRON_ENABLED === "true") {
  import("./cron/deadlineChecker.js");
}
// -------------------DATABASE-----------------
connectDB();
// -------------------SERVER-------------------
const PORT = process.env.PORT || 4000; 
const httpServer = http.createServer(app);
initSocket(httpServer);
const server = httpServer.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});
 
//---- error handling --------------------------
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

export default server;