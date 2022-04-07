import express from "express";
import {
  register_user_post,
  login_user_post,
} from "../controllers/usersController.js";

const router = express.Router();
//register user
router.post("/register", register_user_post);

//login
router.post("/login", login_user_post);

export default router;
