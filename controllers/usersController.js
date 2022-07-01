import { eventEmitter } from "../app.js";
import bcrypt from "bcrypt";
import UserModel from "../model/User.js";
import ReservationModel from "../model/Reservation.js";
import TransactionModel from "../model/Transaction.js";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import Stripe from "stripe";
import moment from "moment";
import { mqttClient } from "../config/connections.js";
dotenv.config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const register_user_post = async (req, res) => {
  const name = req.body.name;
  const registration_number = req.body.registration_number;
  const password = req.body.password;
  const phone = req.body.phone;

  if (!name || !registration_number || !password) {
    return res
      .status(400)
      .json({ message: "inserted data is not valid!", error: true });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await UserModel.findOne({
    registration_number: registration_number,
  });
  if (user) {
    return res
      .status(400)
      .json({ message: "That user already exisits!", error: true });
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
  const { registration_number: userId } = req.user;
  const parkingSpaceReservation = await ReservationModel.findOne({
    userId: userId,
    completed: false,
  }).populate("parkingSpaceId");

  // console.log(parkingSpaceReservation.parkingSpaceId.location.coordinates);

  if (!parkingSpaceReservation) {
    return res.status(201).json({ userStatus: "searching" });
  }
  if (parkingSpaceReservation.isCarParked) {
    return res.status(201).json({
      userStatus: "parked",
      coordinates: parkingSpaceReservation.parkingSpaceId.location.coordinates,
    });
  }
  return res.status(201).json({
    userStatus: "navigating",
    coordinates: parkingSpaceReservation.parkingSpaceId.location.coordinates,
  });
};

const pay = async (req, res) => {
  try {
    const { name, registration_number: userId } = req.user;
    const parkingSpaceReservation = await ReservationModel.findOne({
      userId: userId,
      completed: false,
    }).populate("parkingSpaceId");

    if (!parkingSpaceReservation) {
      return res
        .status(400)
        .json({ message: "reservation not found!", error: true });
    }

    const numberOfReservedHours = moment(new Date()).diff(
      moment(parkingSpaceReservation.createdAt),
      "hours"
    );

    const amountOfMoney =
      numberOfReservedHours == 0
        ? parkingSpaceReservation.parkingSpaceId._doc.price
        : numberOfReservedHours *
            parkingSpaceReservation.parkingSpaceId._doc.price +
          1;

    console.log(
      moment(new Date()).diff(
        moment(parkingSpaceReservation.createdAt),
        "hours"
      ),
      parkingSpaceReservation.parkingSpaceId._doc.price,
      amountOfMoney
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.ceil(amountOfMoney * 100),
      currency: "EGP",
      payment_method_types: ["card"],
      metadata: { name },
    });
    const clientSecret = paymentIntent.client_secret;
    res.json({
      message: "Payment initiated",
      clientSecret,
      amountOfMoney: amountOfMoney,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: true });
  }
};

const payment_confirmed = async (req, res) => {
  const { registration_number: userId } = req.user;
  const { amount } = req.body;

  const parkingSpaceReservation = await ReservationModel.findOne({
    userId: userId,
    completed: false,
  });

  if (!parkingSpaceReservation) {
    return res
      .status(400)
      .json({ message: "reservation not found!", error: true });
  }

  const transaction = new TransactionModel({
    amount,
    userId,
    reservationId: parkingSpaceReservation._id,
  });

  const results = await transaction.save();
  if (!results) {
    return res
      .status(400)
      .json({ message: "error: storing transaction failed!", error: true });
  }

  //! open barrier .....
  //!
  //!
  if (parkingSpaceReservation) {
    // openBarrier(parkingSpaceReservation.parkingSpaceId.toString(), res);
    const spaceId = parkingSpaceReservation.parkingSpaceId.toString();
    // console.log(parkingSpaceReservation.parkingSpaceId.toString());
    const checkTimeOut = setTimeout(() => {
      eventEmitter.emit("responseEvent/openbarrier/" + spaceId, {
        error: true,
        // message: "timeOut",
        message: "Error: couldn't open barrier!",
      });
    }, 10000);

    eventEmitter.once(
      "responseEvent/openbarrier/" + spaceId,
      async (responseMessage) => {
        clearTimeout(checkTimeOut);
        // return res.json({
        //   responseMessage,
        // });
        const updatedReservation = await ReservationModel.findOneAndUpdate(
          {
            userId: userId,
            completed: false,
          },
          { completed: true }
        );

        if (!updatedReservation) {
          return res
            .status(400)
            .json({ message: "updated reservation failed!", error: true });
        }

        res
          .status(201)
          .json({ message: "transaction completed!", confirmed: true });
      }
    );

    mqttClient.publish("request/openbarrier/" + spaceId, "open", {
      qos: 1,
      properties: {
        responseTopic: "response/openbarrier/" + spaceId,
      },
    });
  }
};

export {
  register_user_post,
  login_user_post,
  user_status,
  pay,
  payment_confirmed,
};
