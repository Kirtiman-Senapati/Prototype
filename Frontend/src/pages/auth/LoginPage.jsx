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
       switch (formData.role) 
       {   
        case "Student":
          navigate("/student");
          break;
        case "Teacher":
          navigate("/teacher");
          break;
        case "Admin":
          navigate("/admin");
          break;
        default:
          navigate("/login");
       }
    }
  }, [authUser]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login Page</h1>
        {/* You will build your form here later */}
        <p>Your app is working!</p>
      </div>
    </div>
  );
}

export default LoginPage;
