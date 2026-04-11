import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    
    useEffect(() => {
        axiosInstance.get("/admin/projects").then(res => setProjects(res.data.projects));
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">All System Projects</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(proj => (
                    <div key={proj._id} className="card shadow-sm border-l-4 border-blue-500">
                        <div className="flex justify-between">
                             <h2 className="font-bold text-slate-800 text-lg">{proj.title}</h2>
                             <span className={`badge badge-${proj.status.toLowerCase()}`}>{proj.status}</span>
                        </div>
                        <p className="text-slate-600 text-sm mt-3 line-clamp-3">{proj.description}</p>
                        
                        <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                            <div>
                                <span className="font-semibold text-slate-500">Student: </span> {proj.student?.name}
                            </div>
                            <div>
                                <span className="font-semibold text-slate-500">Supervisor: </span> {proj.supervisor?.name || "Unassigned"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {projects.length === 0 && <p className="text-center text-slate-500 py-10">No projects exist.</p>}
        </div>
    );
};

export default ProjectsPage;