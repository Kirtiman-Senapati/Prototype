import mongoose from "mongoose";
import dotenv from "dotenv";
import { Project } from "./models/project.js";

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

mongoose.connect(process.env.MONGO_URl).then(async () => {
    console.log("Connected to MongoDB for migration");
    try {
        const updateResult = await Project.updateMany(
            {},
            {
                $set: {
                    reminder2DaySent: false,
                    reminder1DaySent: false
                },
                $unset: { reminderSent: "" }
            }
        );
        console.log("Migration complete:", updateResult);
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        mongoose.disconnect();
    }
});
