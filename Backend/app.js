
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import authRouter from "./routes/userRoutes.js";
import { errorMiddleware } from "./middlewares/error.js";

//change dns servers to avoid dns resolution issues in some environments

import dns from "dns";
dns.setServers(["1.1.1.1","8.8.8.8"])


config();

const app = express();
app.use(
    cors({
    origin: [process.env.FRONTEND_URL],
    method: ["GET","POST","PUT","DELETE"],
    Credential: true
})
);


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//------------------ROUTES-----------------
app.use("/api/v1/auth", authRouter);


//------------------ERROR HANDLING-----------------
app.use(errorMiddleware);




export default app;