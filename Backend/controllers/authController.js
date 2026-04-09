
import { asyncHandler } from "../middlewares/asyncHandler.js"
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
    
    user = new User({ name, email, password, role });
    await user.save();
    generateToken(user, 201, "User registered successfully", res);


    
});

//create login function
export const login = asyncHandler(async (req, res, next) =>
    
{
    const {email, password,role } = req.body;
    if (!email || !password || !role)
    {
        return next(new ErrorHandler("Please fill all the required fields", 400));
    }

    const user = await User.findOne({ email,role }).select("+password");

    if (!user)
    {
        return next(new ErrorHandler("Invalid email, password or role", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched)
    {
        return next(new ErrorHandler("Invalid email, password or role", 401));
    }

    generateToken(user, 200, "User logged in successfully", res);


});

//create logout function
export const logout = asyncHandler(async (req, res, next) =>
{
    res.status(200).cookie("token", "",
    {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).json({
        success: true,
        message: "User logged out successfully"
    });

});


//create get user function

export const getUser = asyncHandler(async (req, res, next) =>
{
    const user = req.user;

    res.status(200).json({
        success: true,
        user,
    });

});


//forgot password  functions

export const forgotPassword = asyncHandler(async (req, res, next) =>

{
    const user = await User.findOne({ email: req.body.email });

    if (!user)
    {
        return next(new ErrorHandler("User not found with this email", 404));
    }
    
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset password URL
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Simulate sending email template that shows the reset password URL

    const message = `You requested a password reset. Please click on the following link to reset your password: \n\n ${resetPasswordUrl} \n\n If you did not request this, please ignore this email.`;
    
    // Here you would typically send the email using a service like Nodemailer
    // For now, we'll just log the message
    console.log(message);
});
export const resetPassword = asyncHandler(async (req, res, next) =>{});


