import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../store/slices/authSlice";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(registerUser(formData)).then((res) => {
      setIsSubmitting(false);
      if (!res.error) {
        navigate("/login");
      }
    });
  };

  useEffect(() => {
    if (authUser) {
      navigate("/dashboard");
    }
  }, [authUser, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Create an Account</h1>
        <p className="text-center text-slate-500 mb-8">Register to access the platform</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="label">Full Name</label>
                <input 
                    type="text" 
                    name="name"
                    placeholder="John Doe" 
                    className="input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div>
                <label className="label">Email Address</label>
                <input 
                    type="email" 
                    name="email"
                    placeholder="Enter your email" 
                    className="input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div>
                <label className="label">Password</label>
                <input 
                    type="password" 
                    name="password"
                    placeholder="••••••••" 
                    className="input"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
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
                disabled={isSubmitting}
            >
                {isSubmitting ? "Registering..." : "Sign Up"}
            </button>
            <div className="text-center mt-4">
                 <p className="text-sm text-slate-600">
                   Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
                 </p>
            </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
