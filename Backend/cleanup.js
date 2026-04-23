import mongoose from "mongoose";
import dotenv from "dotenv";
import { Project } from "./models/project.js";

dotenv.config();

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URl);
        console.log("Connected to MongoDB for cleanup...");

        const result1 = await Project.deleteMany({ student: null });
        console.log(`Deleted ${result1.deletedCount} projects where student is null`);

        const result2 = await Project.deleteMany({ student: { $exists: false } });
        console.log(`Deleted ${result2.deletedCount} projects where student does not exist`);

        await mongoose.disconnect();
        console.log("Cleanup complete.");
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

cleanup();
