
// use This file to handle properly the authentication of users and protect routes that require authentication


import jwt from "jsonwebtoken";
import { asyncHandler } from "./asyncHandler.js";
import ErrorHandler from "./error.js";
import {User} from "../models/user.js";


// Middleware to protect routes
export const isAuthenticated = asyncHandler(async (req, res, next) =>
{
    const { token } = req.cookies;

    if (!token)
    {
        return next(new ErrorHandler("Please login to access this page", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-resetPasswordToken -resetPasswordExpire");

    if (!req.user)
    {
        return next(new ErrorHandler("User not found", 404));
    }
    next();

});

// Middleware to protect routes for specific roles
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};