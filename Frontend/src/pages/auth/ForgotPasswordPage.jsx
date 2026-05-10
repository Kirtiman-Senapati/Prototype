import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { forgotPassword } from "../../store/slices/authSlice";
import { Loader2, Mail, KeyRound, ArrowLeft } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email is invalid");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      await dispatch(forgotPassword(email)).unwrap();
      navigate("/check-email", { state: { email } });
    } catch (err) {
      // Error is handled by thunk toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 sm:p-10 shadow-sm">
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back to login
          </Link>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
            <KeyRound size={20} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-900 tracking-tight mb-1">Forgot Password?</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">
          No worries, we'll send you reset instructions.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input 
                      type="email" 
                      placeholder="Enter your email" 
                      className={`block w-full pl-10 pr-3 py-2.5 border ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200'} rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all bg-white`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                  />
                </div>
                {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
            </div>

            <button 
                type="submit" 
                className="w-full mt-6 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                disabled={isLoading}
            >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
            </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
