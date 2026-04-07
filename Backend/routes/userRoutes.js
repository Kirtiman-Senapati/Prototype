

import express from "express";

import{registerUser,getUser,forgotPassword,logout,login,resetPassword} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login)
router.get("/me", getUser);
router.get("/logout", logout);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);

export default router;