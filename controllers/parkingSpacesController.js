// import { redisClient } from "../config/connections.js";
import ParkingSpaceModel from "../model/ParkingSpace.js";
import TransactionModel from "../model/Transaction.js";
import { mqttClient, redisClient } from "../config/connections.js";
import { eventEmitter } from "../app.js";
import ReservationModel from "../model/Reservation.js";
import moment from "moment";

// //* test
// const all_parking_spaces_get = async (req, res) => {
//   try {
//     const results = await ParkingSpaceModel.find();
//     const mergedData = [];
//     for (let i = 0; i < results.length; i++) {
//       let value = await redisClient.get(results[i]._id);
//       if (value) {
//         value = JSON.parse(value);
//         // console.log(value);
//         mergedData.push({
//           ...value,
//           coordinates: results[i].location.coordinates,
//         });
//         // mergedData.push({ ...parkingSpaces[results[i]._id], ...results[i] });
//       }
//     }

//     mergedData.length > 0
//       ? res.status(201).json({ data: mergedData, success: true })
//       : res
//           .status(404)
//           .json({ data: [], message: "No parking spaces!", success: false });
//     // });
//     // }
//     // return res.json({ msg: "NOT AUTHORIZED!" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: error });
//   }
// };

// //* test
// const parking_space_get_by_ID = async (req, res) => {
//   const _id = req.params.id;
//   const space = await ParkingSpaceModel.find({ _id: _id });
//   console.log(...space);
//   // return res.json(
//   //   parkingSpaces[_id] ? { ...parkingSpaces[_id] } : { msg: "No such space!" }
//   if (space) {
//     return res.json(...space);
//   }
//   return res.status(404).json({ msg: "No such space!" });
// };

//!
const open_parking_barrier = async (req, res) => {
  const { registration_number: userId } = req.user;
  const parkingSpaceReservation = await ReservationModel.findOne({
    registration_number: userId,
    completed: false,
  });

  // console.log(parkingSpaceReservation.parkingSpaceId);

  if (parkingSpaceReservation) {
    console.log(parkingSpaceReservation.parkingSpaceId.toString());
    const checkTimeOut = setTimeout(() => {
      eventEmitter.emit(
        "responseEvent/openbarrier/" +
          parkingSpaceReservation.parkingSpaceId.toString(),
        {
          error: true,
          message: "Error: couldn't open the barrier!",
          // message: "timeOut",
        }
      );
    }, 10000);

    eventEmitter.once(
      "responseEvent/openbarrier/" +
        parkingSpaceReservation.parkingSpaceId.toString(),
      async (responseMessage) => {
        clearTimeout(checkTimeOut);
        const updatedSpace = await ReservationModel.findOneAndUpdate(
          {
            registration_number: userId,
            completed: false,
          },
          { isCarParked: true }
        );
        return res.json({
          responseMessage,
        });
      }
    );
    // parkingSpaceReservation.isCarParked = true;
    // const result = await parkingSpaceReservation.save();
    // if (result) {
    mqttClient.publish(
      "request/openbarrier/" +
        parkingSpaceReservation.parkingSpaceId.toString(),
      // JSON.stringify({ action: "open" }),
      "open",
      {
        qos: 1,
        properties: {
          responseTopic:
            "response/openbarrier/" +
            parkingSpaceReservation.parkingSpaceId.toString(),
          // correlationData: Buffer.from("secret_" + id, "utf-8"),
        },
      }
    );
    // }
  }
};

//get spaces close to longitude & latitude
const parking_spaces_near_get = async (req, res) => {
  const longitude = req.query.longitude;
  const latitude = req.query.latitude;

  const parkingSpaceReservation = await ReservationModel.find({
    completed: false,
  }).select("parkingSpaceId");
  const reservedSpacesArr = parkingSpaceReservation.map(
    (s) => s.parkingSpaceId
  );
  console.log(reservedSpacesArr);

  //request near parking spaces from db based on location
  const results = await ParkingSpaceModel.find({
    _id: { $nin: reservedSpacesArr },
    location: {
      $near: {
        $maxDistance: 5000, //max distance to user's location
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(latitude), parseFloat(longitude)],
        },
      },
    },
  });

  //merge current available spaces with the near spaces
  const mergedData = [];
  for (let i = 0; i < results.length; i++) {
    let value = await redisClient.get(results[i]._id);
    if (value) {
      value = JSON.parse(value);
      console.log(value); //!vacant = true
      if (value.vacant) {
        mergedData.push({
          ...value,
          coordinates: results[i].location.coordinates,
          price: results[i]._doc.price,
        });
      }
    }
  }

  mergedData.length > 0
    ? res.status(201).json({ data: mergedData })
    : res.status(404).json({ message: "No parking spaces!", error: true });
};

//!
const reserve_parking_space = async (req, res) => {
  const { date, parkingSpaceId, origin, destination } = req.body;
  const { registration_number: userId } = req.user;

  //check inputs (date)
  if (!date || !moment(date).isAfter(moment(new Date()))) {
    return res
      .status(400)
      .json({ message: "error: date is incorrect!", error: true });
  }
  //check parking space
  const parkingSpaceReservationFound = await ReservationModel.find({
    $or: [
      { parkingSpaceId: parkingSpaceId, completed: false },
      { userId, completed: false },
    ],
  });
  const parkingSpaceFound = await ParkingSpaceModel.findById(parkingSpaceId);
  if (parkingSpaceReservationFound.length != 0) {
    return res
      .status(400)
      .json({ message: "error: parking space reserved!", error: true });
  }
  if (!parkingSpaceFound) {
    return res
      .status(404)
      .json({ message: "error: parking space not found", error: true });
  }
  //reserve
  const reservtion = new ReservationModel({
    userId,
    parkingSpaceId: parkingSpaceId,
    reservationDate: date,
    isCarParked: false,
    completed: false,
    origin,
    destination,
  });

  const results = await reservtion.save();
  if (!results) {
    return res
      .status(400)
      .json({ message: "error: reservation failed!", error: true });
  }

  //send ack
  res.status(201).json({ data: results });
};

const cancel_booking = async (req, res) => {
  const { registration_number: userId } = req.user;
  //check parking space
  const parkingSpaceReservation = await ReservationModel.find({
    userId,
    completed: false,
    isCarParked: false,
  });

  if (!parkingSpaceReservation) {
    return res.status(404).json({ error: true, message: "unexpected error!" });
  }

  if (parkingSpaceReservation.isCarParked) {
    return res.status(404).json({ error: true, message: "car parked!" });
  }
  //check inputs (date)
  if (
    moment(new Date()).diff(
      moment(parkingSpaceReservation.createdAt),
      "minutes"
    ) > 20
  ) {
    return res.status(201).json({
      message: "error: cannot cancel booking after 20 mins!",
      error: true,
    });
  }

  const removedReservation = await ReservationModel.findOneAndRemove({
    userId,
    completed: false,
    isCarParked: false,
  });

  if (!removedReservation) {
    return res.status(400).json({ error: true, message: "unexpected error!" });
  }
  return res.status(201).json({ message: "booking removed successfully." });
};

const current_booking_get = async (req, res) => {
  const { registration_number: userId } = req.user;
  //check parking space
  const parkingSpaceReservation = await ReservationModel.find({
    userId,
    completed: false,
  }).populate("parkingSpaceId");

  if (!parkingSpaceReservation) {
    return res.status(404).json({ booking: null });
  }

  return res.status(201).json({ booking: parkingSpaceReservation });
};

const all_booking_get = async (req, res) => {
  const { registration_number: userId } = req.user;
  //check parking space
  // const parkingSpaceReservations = await ReservationModel.find({
  //   userId,
  //   completed: true,
  // });
  const transaction = await TransactionModel.find({
    userId,
  }).populate("reservationId");

  console.log(transaction);

  // if (!parkingSpaceReservations) {
  //   return res.status(404).json({ booking: [] });
  // }

  if (!transaction) {
    return res.status(404).json({ booking: [] });
  }

  const generatedBookings = transaction.map((trans) => {
    return {
      booking: trans.reservationId,
      totalPrice: trans.amount,
      leavingTime: trans.createdAt,
    };
  });

  return res.status(201).json({
    booking: generatedBookings,
  });
};

export {
  // all_parking_spaces_get,
  // parking_space_get_by_ID,
  open_parking_barrier,
  parking_spaces_near_get,
  reserve_parking_space,
  cancel_booking,
  current_booking_get,
  all_booking_get,
};
