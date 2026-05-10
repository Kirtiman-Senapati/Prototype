import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { forgotPassword } from "../../store/slices/authSlice";
import { Loader2, CheckCircle2 } from "lucide-react";

const CheckEmailPage = () => {
  const [isResending, setIsResending] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  
  // We can get the email if we passed it via route state, otherwise a generic message.
  const email = location.state?.email || "your email address";

  const handleResend = async () => {
    if (!location.state?.email) return;
    setIsResending(true);
    try {
      await dispatch(forgotPassword(location.state.email)).unwrap();
    } catch (err) {
       // Handled by thunk
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 sm:p-10 shadow-sm flex flex-col items-center">
        
        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 mb-6">
          <CheckCircle2 size={22} strokeWidth={2} />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-900 tracking-tight mb-2">Check Your Email</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Reset instructions have been dispatched</p>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8 w-full text-center">
            <p className="text-sm text-slate-600">
            We've sent a password reset link to: <br/>
            <span className="font-semibold text-slate-900 mt-1 block">{email}</span>
            </p>
        </div>
        
        <div className="space-y-3 w-full">
            <Link 
                to="/login"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-all flex justify-center items-center shadow-sm"
            >
                Back to Login
            </Link>
            
            {location.state?.email ? (
                <button 
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                    {isResending ? (
                    <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Resending...
                    </>
                    ) : (
                    "Resend Email"
                    )}
                </button>
            ) : null}
        </div>
        
        <p className="text-xs text-slate-400 text-center mt-6">
           Did not receive the email? Check your spam filter, or try another email address.
        </p>

      </div>
    </div>
  );
}

export default CheckEmailPage;
