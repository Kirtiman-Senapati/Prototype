
import { asyncHandler } from "../middlewares/asyncHandeler.js"
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/user.js";
import { generateToken } from "../utils/generateToken.js";

//REGISTER USER
export const registerUser = asyncHandler(async (req, res, next) =>
{
    const { name, email, password, role } = req.body;
    
    
    if (!name || !email || !password || !role ) 
    {
        return next(new ErrorHandler("Please fill all the required fields", 400));
    }
    
    
    let user = await User.findOne({ email });
    
    
    if (user)
    {
        return next(new ErrorHandler("User already exists with this email", 400));
    }
    
    user = await User.create({ name, email, password, role });
    await user.save();
    generateToken(user, 201, "User registered successfully", res);


    
});

export const login = asyncHandler(async (req, res, next) =>{})
export const getUser = asyncHandler(async (req, res, next) =>{})
export const logout = asyncHandler(async (req, res, next) =>{})
export const forgotPassword = asyncHandler(async (req, res, next) =>{})
export const resetPassword = asyncHandler(async (req, res, next) =>{})


