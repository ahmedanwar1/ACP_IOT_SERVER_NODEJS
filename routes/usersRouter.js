import express from "express";
import {
  register_user_post,
  login_user_post,
  user_status,
  pay,
  payment_confirmed,
} from "../controllers/usersController.js";
import isAuth from "../middleware/auth.js";

const router = express.Router();
//register user
router.post("/register", register_user_post);

//login
router.post("/login", login_user_post);

//get user status
router.get("/userStatus", isAuth, user_status);

//pay with stripe
router.post("/pay", isAuth, pay);

//once payment confirmed
router.post("/paymentConfirmed", isAuth, payment_confirmed);

export default router;
