import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// Add this to your imports at the very top:
import { login } from "../../store/slices/authSlice";

const LoginPage = () => 
{

  const dispatch = useDispatch();

  const {isLoggingIn, authUser} = useSelector((state) => state.auth);

  const[formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Student",
  });

  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleChange = (e) =>
  {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name])
    { 
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };


  const validateForm = () =>
  {
    const newErrors = {};

    if (!formData.email)
    {
      newErrors.email = "Email is required";
    }
    else if (!/\S+@\S+\.\S+/.test(formData.email))
    {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password)
    {
      newErrors.password = "Password is required";
    }

    else if (formData.password.length < 6)
    {
      newErrors.password = "Password must be at least 6 characters";
    }


    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) =>
  {
    e.preventDefault();

    if (!validateForm())
    {
      return;
    }

    const data = new FormData();
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("role", formData.role);


   dispatch(login(data));

  };


 useEffect(() => 
  {
    if (authUser) 
    {
        // the App.jsx routing logic encapsulates dashboards under "/dashboard"
        // and handles role based visibility there or via role-specific paths
       switch (formData.role) 
       {   
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Welcome Back</h1>
        <p className="text-center text-slate-500 mb-8">Sign in to your account</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="label">Email Address</label>
                <input 
                    type="email" 
                    name="email"
                    placeholder="Enter your email" 
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
                <label className="label">Password</label>
                <input 
                    type="password" 
                    name="password"
                    placeholder="••••••••" 
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
                 <label className="label">Account Role</label>
                 <select 
                     name="role" 
                     className="input bg-white w-full"
                     value={formData.role} 
                     onChange={handleChange}
                 >
                     <option value="Student">Student</option>
                     <option value="Supervisor">Supervisor</option>
                     <option value="Admin">Administrator</option>
                 </select>
            </div>

            <button 
                type="submit" 
                className="btn-primary w-full mt-4 flex justify-center items-center h-11"
                disabled={isLoggingIn}
            >
                {isLoggingIn ? "Signing In..." : "Sign In"}
            </button>
            <div className="text-center mt-4">
                 <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
            </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
