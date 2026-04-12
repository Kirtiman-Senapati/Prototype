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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-slate-100 flex flex-col items-center">
        
        <div className="h-20 w-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-inner mb-6">
          <CheckCircle2 size={40} strokeWidth={2} />
        </div>
        
        <h1 className="text-2xl font-extrabold text-center text-slate-800 tracking-tight mb-3">Check Your Email</h1>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8 w-full text-center">
            <p className="text-sm text-slate-600">
            We've sent a password reset link to: <br/>
            <span className="font-semibold text-slate-800 mt-1 block">{email}</span>
            </p>
        </div>
        
        <div className="space-y-3 w-full">
            <Link 
                to="/login"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex justify-center items-center"
            >
                Back to Login
            </Link>
            
            {location.state?.email ? (
                <button 
                    onClick={handleResend}
                    disabled={isResending}
                    className="w-full py-3 px-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
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
