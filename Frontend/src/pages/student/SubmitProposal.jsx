import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitProposal } from "../../store/slices/studentSlice";
import { useNavigate } from "react-router-dom";

const SubmitProposal = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.student);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(submitProposal({ title, description })).then((res) => {
      if(!res.error) navigate("/dashboard");
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Submit Project Proposal</h1>
          <p className="card-subtitle">Provide details about your academic project.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Project Title</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Academic Project Management System"
              required
            />
          </div>

          <div>
            <label className="label">Project Description</label>
            <textarea
              className="input min-h-[150px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scope, objectives, and technology stack..."
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate("/dashboard")} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitProposal;