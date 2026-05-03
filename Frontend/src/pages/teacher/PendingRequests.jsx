import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPendingRequests, handleRequest } from "../../store/slices/teacherSlice";
import useAutoRefresh from "../../hooks/useAutoRefresh";

const PendingRequests = () => {
    const dispatch = useDispatch();
    const { requests } = useSelector((state) => state.teacher);

    useEffect(() => {
        dispatch(getPendingRequests());
    }, [dispatch]);

    useAutoRefresh(() => {
        dispatch(getPendingRequests());
    });

    return (
        <div className="space-y-6">
            <div className="card-header border-b-0">
                <h1 className="text-2xl font-bold text-slate-800">Pending Requests</h1>
                <p className="text-slate-500">Approve or reject incoming project supervision requests.</p>
            </div>

            {requests && requests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Card view in pending requests page */}
                    {requests.map(req => (
                        <div key={req._id} className="bg-white border border-slate-200 rounded-xl p-5 
                        hover:border-slate-300 transition-all duration-200 
                        group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="font-semibold text-lg text-slate-800 tracking-tight">{req.fromUser?.name}</h2>
                                    <p className="text-sm text-slate-500 font-medium">{req.fromUser?.email}</p>
                                </div>
                                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium border 
                                bg-slate-100 text-slate-600 border-slate-200">{req.type}</span>
                            </div>
                            
                            <div className="mt-4 bg-slate-50/70 p-4 rounded-lg border border-slate-100 
                            group-hover:bg-slate-50 transition">
                                <h3 className="font-medium text-sm text-slate-800">Project: {req.title}</h3>
                                <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{req.description}</p>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 flex-wrap">
                                <button 
                                    onClick={() => dispatch(handleRequest({requestId: req._id, status: "Rejected"}))}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 
                                    bg-white border border-slate-200 rounded-lg 
                                    hover:bg-slate-100 transition">
                                    Reject
                                </button>

                                <button 
                                    onClick={() => dispatch(handleRequest({requestId: req._id, status: "Accepted"}))}
                                    className="px-4 py-2 text-sm font-semibold text-white 
                                    bg-slate-800 hover:bg-slate-900 
                                    rounded-lg transition shadow-sm">
                                    Accept
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
                    <p className="text-slate-500">You have no pending requests at the moment.</p>
                </div>
            )}
        </div>
    );
};

export default PendingRequests;