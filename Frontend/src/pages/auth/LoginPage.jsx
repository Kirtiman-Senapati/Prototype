import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, googleLogin } from "../../store/slices/authSlice";
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2, Mail, Lock, UserCircle } from "lucide-react";

const LoginPage = () => {
  const dispatch = useDispatch();
  const { isLoggingIn, authUser } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Student",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      dispatch(googleLogin({ token: codeResponse.access_token }));
    },
    onError: (error) => console.log('Google Login Failed:', error)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) { 
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
        newErrors.password = "Password is required";
    } 
    // Yahan hum strict regex ya length check nahi lagayenge 
    // kyunki agar password galat hoga to backend waise bhi error de dega.


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    dispatch(login(formData));
  };

  useEffect(() => {
    if (authUser) {
       switch (authUser.role) {   
        case "Student":
          navigate("/dashboard");
          break;
        case "Supervisor":
          navigate("/dashboard/teacher");
          break;
        case "Admin":
          navigate("/dashboard/admin");
          break;
        default:
          navigate("/dashboard");
       }
    }
  }, [authUser, navigate]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-[#F8FAFC] p-4 py-8 md:py-12">
      <div className="w-full max-w-[420px] bg-white rounded-xl border border-slate-200 p-7 sm:p-8">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
            <Lock size={20} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-900 tracking-tight mb-1">Portal Login</h1>
        <p className="text-center text-slate-500 mb-5 text-sm">Sign in to continue to your dashboard</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input 
                      type="email" 
                      inputMode="email"
                      autoComplete="email"
                      name="email"
                      placeholder="Enter your email" 
                      className={`block w-full pl-10 pr-3 py-2.5 border ${errors.email ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200'} rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all bg-white`}
                      value={formData.email}
                      onChange={handleChange}
                  />
                </div>
                {errors.email && <p className="text-rose-500 text-[11px] font-medium mt-1 pl-1">{errors.email}</p>}
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input 
                      type="password" 
                      name="password"
                      placeholder="••••••••" 
                      className={`block w-full pl-10 pr-3 py-2.5 border ${errors.password ? 'border-rose-200 focus:border-rose-300' : 'border-slate-200'} rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all bg-white`}
                      value={formData.password}
                      onChange={handleChange}
                  />
                </div>
                {errors.password && <p className="text-rose-500 text-[11px] font-medium mt-1 pl-1">{errors.password}</p>}
            </div>

            <div className="space-y-1">
                 <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Role</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserCircle size={18} />
                    </div>
                    <select 
                        name="role" 
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 transition-all bg-white appearance-none text-slate-800"
                        value={formData.role} 
                        onChange={handleChange}
                    >
                        <option value="Student">Student</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Admin">Administrator</option>
                    </select>
                 </div>
            </div>

            <button 
                type="submit" 
                className="w-full mt-6 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoggingIn}
            >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
            </button>

            <div className="flex items-center gap-4 py-1">
               <div className="h-px bg-slate-200 flex-1"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
               <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <button 
                type="button" 
                onClick={() => handleGoogleLogin()}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoggingIn}
            >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
            </button>
            <div className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-slate-600 hover:text-slate-900 hover:underline transition-colors">
                 Create account
              </Link>
            </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
