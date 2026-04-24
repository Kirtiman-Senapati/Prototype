import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPendingRequests, handleRequest } from "../../store/slices/teacherSlice";

const PendingRequests = () => {
    const dispatch = useDispatch();
    const { requests } = useSelector((state) => state.teacher);

    useEffect(() => {
        dispatch(getPendingRequests());
    }, [dispatch]);

    return (
        <div className="space-y-6">
            <div className="card-header border-b-0">
                <h1 className="text-2xl font-bold text-slate-800">Pending Requests</h1>
                <p className="text-slate-500">Approve or reject incoming project supervision requests.</p>
            </div>

            {requests && requests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {requests.map(req => (
                        <div key={req._id} className="card shadow-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="font-semibold text-lg">{req.fromUser?.name}</h2>
                                    <p className="text-sm text-slate-500">{req.fromUser?.email}</p>
                                </div>
                                <span className={`badge badge-pending`}>{req.type}</span>
                            </div>
                            
                            <div className="mt-4 bg-slate-50 p-4 rounded-lg">
                                <h3 className="font-medium text-sm text-slate-800">Project: {req.title}</h3>
                                <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{req.description}</p>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 flex-wrap">
                                <button onClick={() => dispatch(handleRequest({requestId: req._id, status: "Rejected"}))} className="btn-danger btn-small">Reject</button>
                                <button onClick={() => dispatch(handleRequest({requestId: req._id, status: "Accepted"}))} className="btn-secondary btn-small">Accept</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center p-12">
                    <p className="text-slate-500">You have no pending requests at the moment.</p>
                </div>
            )}
        </div>
    );
};

export default PendingRequests;