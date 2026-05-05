import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitProposal } from "../../store/slices/studentSlice";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Clock, CheckCircle2, ArrowLeft, AlertTriangle } from "lucide-react";

const SubmitProposal = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, project } = useSelector((state) => state.student);

  const [warning, setWarning] = useState(null);
  const [matches, setMatches] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(submitProposal({ title, description, forceSubmit: false })).then((res) => {
      if (res.payload?.status === "warning") {
        setWarning(res.payload.message);
        setMatches(res.payload.matches || 0);
      } else if (!res.error) {
        navigate("/dashboard");
      }
    });
  };

  const handleForceSubmit = () => {
    dispatch(submitProposal({ title, description, forceSubmit: true })).then((res) => {
      if (!res.error) {
        navigate("/dashboard");
      }
    });
  };

  const isLocked =
    project &&
    (project.status === "Pending" ||
      project.status === "Approved" ||
      project.status === "Completed");

  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-lg border border-slate-100 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
          
          <div className="mb-5">
            {project.status === "Approved" && (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            )}
            {project.status === "Completed" && (
              <CheckCircle2 className="w-8 h-8 text-slate-700" />
            )}
            {project.status === "Pending" && (
              <Clock className="w-8 h-8 text-amber-500" />
            )}
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">
            Proposal Locked
          </h1>
          <p className="text-slate-500 text-lg max-w-md">
            You already have an active proposal marked as{" "}
            <strong
              className={`${
                project.status === "Approved"
                  ? "text-green-600"
                  : project.status === "Completed"
                    ? "text-blue-600"
                    : "text-amber-500"
              }`}
            >
              {project.status}
            </strong>
            . You can only submit a new project proposal if your current one
            gets rejected.
          </p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-8 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (warning) {
    return (
      <div className="max-w-2xl mx-auto mt-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col items-center text-center">
          <div className="p-3 bg-slate-50 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-slate-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            {matches > 0 ? `${matches} similar project${matches > 1 ? 's' : ''} found` : "Similar project detected"}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
            {warning}
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleForceSubmit()}
              className="px-4 py-2 font-medium text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex-1 sm:flex-none"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Continue Anyway"}
            </button>
            <button
              onClick={() => setWarning(null)}
              className="px-4 py-2 font-medium text-sm text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm flex-1 sm:flex-none"
            >
              Edit Title
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
        <div className="card-header border-b border-slate-100 pb-5 mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Submit Project Proposal
          </h1>
          <p className="text-slate-500 mt-1">
            Provide details about your academic project.{" "}
            {project?.status === "Rejected" && (
              <span className="font-bold text-red-500">
                Your previous proposal was rejected, you may submit a new one.
              </span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Project Title
            </label>
            
            {/* input field */}
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 hover:bg-white border-slate-200 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all font-medium text-slate-800"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Academic Project Management System"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Project Description
            </label>

            {/* text area field */}
            <textarea
              className="w-full px-4 py-3 bg-slate-50 hover:bg-white border border-slate-200 border-slate-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-200 transition-all font-medium text-slate-800 min-h-[200px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scope, objectives, and technology stack..."
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-8">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 font-bold text-white bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitProposal;
