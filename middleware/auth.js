import jwt from "jsonwebtoken";
import UserModel from "../model/User.js";
import * as dotenv from "dotenv";
dotenv.config();

const isAuth = async (req, res, next) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];

    console.log(req.headers.authorization.split(" ")[1]);
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findOne({
        registration_number: decode.userId,
      });
      console.log(user);
      if (!user) {
        return res.json({
          success: false,
          message: "unauthorized access! !user",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.json({
          success: false,
          message: "unauthorized access! JsonWebTokenError",
        });
      }
      if (error.name === "TokenExpiredError") {
        return res.json({
          success: false,
          message: "sesson expired try sign in! TokenExpiredError",
        });
      }

      res.json({ success: false, message: "Internal server error!" });
    }
  } else {
    console.log(req.headers);
    res.json({ success: false, message: "unauthorized access! esle" });
  }
};

export default isAuth;
