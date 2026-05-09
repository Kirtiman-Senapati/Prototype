import { User } from "../models/user.js";

export const getProjectTargetUsers = async (project, extraUsers = []) => {
    const admins = await User.find({
        role: "Admin",
    }).select("_id");

    const adminIds = admins.map(admin => admin._id.toString());

    return [
        project.student,
        ...(project.members || []),
        project.supervisor,
        ...adminIds,
        ...extraUsers,
    ]
        .filter(Boolean)
        .map(id =>
            typeof id === "object" && id._id
                ? id._id.toString()
                : id.toString()
        )
        .filter((id, index, self) => self.indexOf(id) === index);
};