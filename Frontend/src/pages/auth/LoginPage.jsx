import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store/slices/authSlice";
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
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

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
       switch (formData.role) {   
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
  }, [authUser, formData.role, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 sm:p-10 shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
            <Lock size={20} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-900 tracking-tight mb-1">Welcome Back</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">Sign in to continue to your dashboard</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input 
                      type="email" 
                      name="email"
                      placeholder="Enter your email" 
                      className={`block w-full pl-10 pr-3 py-2.5 border ${errors.email ? 'border-red-300 focus:border-red-400' : 'border-slate-200'} rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all bg-white`}
                      value={formData.email}
                      onChange={handleChange}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
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
                      className={`block w-full pl-10 pr-3 py-2.5 border ${errors.password ? 'border-red-300 focus:border-red-400' : 'border-slate-200'} rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all bg-white`}
                      value={formData.password}
                      onChange={handleChange}
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
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
                className="w-full mt-6 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-sm transition-all flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
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
