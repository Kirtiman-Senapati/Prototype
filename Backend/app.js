
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import authRouter from "./routes/userRoutes.js";
import studentRouter from "./routes/studentRoutes.js";
import teacherRouter from "./routes/teacherRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import feedbackRouter from "./routes/feedbackRoutes.js";
import activityRouter from "./routes/activityRoutes.js";
import { errorMiddleware } from "./middlewares/error.js";
//change dns servers to avoid dns resolution issues in some environments

import dns from "dns";
dns.setServers(["1.1.1.1","8.8.8.8"])


config();

const app = express();
app.use(
    cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET","POST","PUT","DELETE","PATCH"],
    credentials: true
})
);


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//------------------ROUTES-----------------
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/teacher", teacherRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/activities", activityRouter);

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

//------------------ERROR HANDLING-----------------
app.use(errorMiddleware);




export default app;