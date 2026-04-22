import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetPassword } from "../../store/slices/authSlice";
import { Loader2, LockKeyhole } from "lucide-react";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "New password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await dispatch(resetPassword({
        token, 
        password: formData.password, 
        confirmPassword: formData.confirmPassword 
      })).unwrap();
      
      // Navigate to login after successful reset
      navigate("/login");
    } catch (err) {
      // Handled by thunk
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-slate-100">
        
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
            <LockKeyhole size={32} strokeWidth={1.5} />
          </div>
        </div>
        
        <h1 className="text-2xl font-extrabold text-center text-slate-800 tracking-tight mb-2">Reset Password</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">
          Enter your new password below.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 block">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LockKeyhole size={18} />
                  </div>
                  <input 
                      type="password"
                      name="password" 
                      placeholder="Enter new password" 
                      className={`block w-full pl-10 pr-3 py-2.5 border ${errors.password ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'} rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white`}
                      value={formData.password}
                      onChange={handleChange}
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 block">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LockKeyhole size={18} />
                  </div>
                  <input 
                      type="password"
                      name="confirmPassword" 
                      placeholder="Confirm new password" 
                      className={`block w-full pl-10 pr-3 py-2.5 border ${errors.confirmPassword ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'} rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</p>}
            </div>

            <button 
                type="submit" 
                className="w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
            </button>
            <div className="mt-6 text-center text-sm text-slate-500">
              Wait, I remember my password?{" "}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                 Login here
              </Link>
            </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
