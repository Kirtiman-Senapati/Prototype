

import app from "./app.js";
import connectDB from "./config/db.js";


// -------------------DATABASE-----------------
connectDB();

// -------------------SERVER-------------------
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
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