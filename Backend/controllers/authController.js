
import { asyncHandler } from "../middlewares/asyncHandler.js"
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/user.js";
import { generateToken } from "../utils/generateToken.js";
import { generateResetPasswordEmailTemplate } from "../utils/emailTemplate.js";
import { sendEmail } from "../services/emailService.js";
import crypto from "crypto";
import { logActivity } from "../utils/activityLogger.js";
import { getIo } from "../utils/socket.js";
import { emitRefresh } from "../utils/socketEvents.js";

//REGISTER USER
export const registerUser = asyncHandler(async (req, res, next) => {
    let { name, email, password, role } = req.body;

    // Trim all inputs
    name = name?.trim();
    email = email?.trim()?.toLowerCase();
    password = password?.trim();

    if (!name || !email || !password || !role) {
        return next(new ErrorHandler("Please fill all the required fields", 400));
    }

    if (name.length < 3) {
        return next(new ErrorHandler("Name must be at least 3 characters long", 400));
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        return next(new ErrorHandler("Please provide a valid email address", 400));
    }

    if (password.length < 6) {
        return next(new ErrorHandler("Password must be at least 6 characters long", 400));
    }


    let user = await User.findOne({ email });


    if (user) {
        return next(new ErrorHandler("User already exists with this email", 400));
    }

    user = new User({ name, email, password, role });
    await user.save();

    const admins = await User.find({ role: "Admin" }).select("_id");
    const adminIds = admins.map(a => a._id);

    // Log activity
    await logActivity({
        actor: user._id,
        targetUsers: [user._id, ...adminIds],
        actionType: "NEW_USER_REGISTERED",
        message: `New ${role.toLowerCase()} registered: ${name}`,
        priority: "low"
    });

    const io = getIo();
    emitRefresh(io);

    generateToken(user, 201, "User registered successfully", res);



});

//create login function
export const login = asyncHandler(async (req, res, next) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
        return next(new ErrorHandler("Please fill all the required fields", 400));
    }

    const user = await User.findOne({ email, role }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid email, password or role", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email, password or role", 401));
    }

    generateToken(user, 200, "User logged in successfully", res);


});

//create google auth function
export const googleAuth = asyncHandler(async (req, res, next) => {
    const { token } = req.body; // This is the access_token from frontend
    
    if (!token) {
        return next(new ErrorHandler("Google Token is missing", 400));
    }

    let payload;
    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        
        if (!response.ok) {
            throw new Error("Failed to fetch user profile with token");
        }
        
        payload = await response.json();
    } catch (error) {
        return next(new ErrorHandler("Invalid Google Token", 401));
    }

    const { email, name } = payload;

    if (!email) {
        return next(new ErrorHandler("Email not found in Google profile", 400));
    }

    // Check if user already exists
    let user = await User.findOne({ email }).select("+password");

    if (user) {
        // Safe login: preserve existing role
        generateToken(user, 200, "Google Login Successful", res);
    } else {
        // Safe registration: strictly default to 'Student' for new users
        const randomPassword = crypto.randomBytes(16).toString("hex");
        
        user = new User({
            name,
            email,
            password: randomPassword,
            role: "Student" // Enforced default
        });
        await user.save();

        const admins = await User.find({ role: "Admin" }).select("_id");
        const adminIds = admins.map(a => a._id);

        // Log activity
        await logActivity({
            actor: user._id,
            targetUsers: [user._id, ...adminIds],
            actionType: "NEW_USER_REGISTERED",
            message: `New student registered via Google: ${name}`,
            priority: "low"
        });

        const io = getIo();
        emitRefresh(io);

        generateToken(user, 201, "User registered successfully via Google", res);
    }
});

//create logout function
export const logout = asyncHandler(async (req, res, next) => {
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

export const getUser = asyncHandler(async (req, res, next) => {
    const user = req.user;

    res.status(200).json({
        success: true,
        user,
    });

});


//forgot password  functions

export const forgotPassword = asyncHandler(async (req, res, next) => {
    console.log("Forgot Password Request Body:", req.body);
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new ErrorHandler("User not found with this email", 404));
    }

    const resetToken = user.getResetPasswordToken();

    console.log("Generated Reset Token:", resetToken); // Debugging line to check the generated reset token

    await user.save({ validateBeforeSave: false });

    // Create reset password URL
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Simulate sending email template that shows the reset password URL

    const message = generateResetPasswordEmailTemplate(resetPasswordUrl);

    try {
        await sendEmail({
            to: user.email,
            subject: "Academic Project Monitoring System - Password Reset Request",
            html: message,
        });

        res.status(200).json({
            success: true,
            message: `Password reset email sent to ${user.email} successfully`,
        });
    }

    catch (error) {
        console.log("REAL EMAIL ERROR:", error); //for debugging purposes, log the real error from the email service

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(error.message || "Failed to send email. Please try again later.", 500));
    }
});

//reset password function
export const resetPassword = asyncHandler(async (req, res, next) => {
    console.log("Is next a function?", typeof next); // Debugging line to check if next is a function
    const { token } = req.params;
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });

    if (!user) {
        return next(new ErrorHandler("Invalid or expired password reset token", 400));
    }

    if (!req.body.password || !req.body.confirmPassword) {
        return next(new ErrorHandler("Please provide both password and confirm password", 400));
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    generateToken(user, 200, "Password reset successfully", res);

});



