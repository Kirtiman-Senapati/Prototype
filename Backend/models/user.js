

import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";


const userSchema = new mongoose.Schema(
{
    name: 
    {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [40, "Name cannot exceed 40 characters"]
    },


    email: 
    {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: 
      [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },

    password: 
    {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minLength: [6, "Password must be at least 6 characters long"],
    },

    role:
    {
      type: String,
      enum: ["Student","Supervisor", "Admin"],
      default: "Student",
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    department:
    {
      type: String,
      trim: true,
      default: null,
      
    },

    experties:
    {
      type: [String],
      default: [],
    },

    maxStudents:
    {
      type: Number,
      default: 5,
      min: [1, "Min students must be at least 1"],
    },

    assignedStudents:
    [
    {
      
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    ],

    supervisor:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    project:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

  },
  
  {
    timestamps: true,
  }
);


// Encrypt password before saving
userSchema.pre("save", async function (next)
{
  if (!this.isModified("password"))
  {
    console.log("Password not modified, skipping hashing.,",typeof next);
    //next(); this line is intentionally commented out because it shows errors in reset password and forgot password functions, but the functions work fine without it. It seems that in some cases, calling next() here might cause issues with the flow of the reset password and forgot password function 
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.generateToken = function ()
{  
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, 
  {
    expiresIn: process.env.JWT_EXPIRE,
  });
};


// compare password
userSchema.methods.comparePassword = async function (enteredPassword)
{
  return await bcrypt.compare(enteredPassword, this.password);
};

// generate reset password token
userSchema.methods.getResetPasswordToken = function ()
{
  const resetToken = crypto.randomBytes(20).toString("hex");

 this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  return resetToken;
};

export const User = mongoose.model("User", userSchema);