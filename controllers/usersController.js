import bcrypt from "bcrypt";
import UserModel from "../model/User.js";
import ReservationModel from "../model/Reservation.js";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();

const register_user_post = async (req, res) => {
  const name = req.body.name;
  const registration_number = req.body.registration_number;
  const password = req.body.password;
  const phone = req.body.phone;

  if (!name || !registration_number || !password) {
    return res.status(400).send("inserted data is not valid!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await UserModel.findOne({
    registration_number: registration_number,
  });
  if (user) {
    return res.status(400).send("That user already exisits!");
  } else {
    // Insert the new user if they do not exist yet
    user = new UserModel({
      name,
      registration_number,
      password: hashedPassword,
      phone,
    });
    await user.save();
    res.send(user);
  }
};

const login_user_post = async (req, res) => {
  const { userId, password } = req.body;

  const user = await UserModel.findOne({ registration_number: userId });

  if (!user)
    return res.json({
      success: false,
      message: "user not found, with the given user id!",
    });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.json({
      success: false,
      message: "user id / password does not match!",
    });

  const token = jwt.sign(
    { userId: user.registration_number, name: user.name },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  const userInfo = {
    userId: user.registration_number,
    name: user.name,
  };

  res.json({ success: true, user: userInfo, token });
};

//! might be a middleware (reserving / car parked / looking for a space)
const user_status = async (req, res) => {
  //check reservation by id (exist ? => car parked:true,false | not exist => reservation)
  const { userId } = req.user;
  const parkingSpaceReservation = await ReservationModel.findOne({
    userId: userId,
  });

  if (!parkingSpaceReservation) {
    return res.status(201).json({ userStatus: "searching" });
  }
  if (parkingSpaceReservation.isCarParked) {
    return res.status(201).json({ userStatus: "parked" });
  }
  return res.status(201).json({ userStatus: "navigating" });
};

export { register_user_post, login_user_post, user_status };
