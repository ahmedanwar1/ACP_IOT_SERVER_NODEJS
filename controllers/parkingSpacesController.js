// import { redisClient } from "../config/connections.js";
import ParkingSpaceModel from "../model/ParkingSpace.js";
import { mqttClient, redisClient } from "../config/connections.js";
import { eventEmitter } from "../app.js";
import ReservationModel from "../model/Reservation.js";
import moment from "moment";

//* test
const all_parking_spaces_get = async (req, res) => {
  try {
    const results = await ParkingSpaceModel.find();
    const mergedData = [];
    for (let i = 0; i < results.length; i++) {
      let value = await redisClient.get(results[i]._id);
      if (value) {
        value = JSON.parse(value);
        // console.log(value);
        mergedData.push({
          ...value,
          coordinates: results[i].location.coordinates,
        });
        // mergedData.push({ ...parkingSpaces[results[i]._id], ...results[i] });
      }
    }

    mergedData.length > 0
      ? res.status(201).json({ data: mergedData })
      : res.status(404).json({ data: [], errorMsg: "No parking spaces!" });
    // });
    // }
    // return res.json({ msg: "NOT AUTHORIZED!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};

//* test
const parking_space_get_by_ID = async (req, res) => {
  const _id = req.params.id;
  const space = await ParkingSpaceModel.find({ _id: _id });
  console.log(...space);
  // return res.json(
  //   parkingSpaces[_id] ? { ...parkingSpaces[_id] } : { msg: "No such space!" }
  if (space) {
    return res.json(...space);
  }
  return res.status(404).json({ msg: "No such space!" });
};

//!
const open_parking_barrier = async (req, res) => {
  const { registration_number: userId } = req.user;
  // mqttClient.publish("parking/openbarrier/" + id, "open");
  // res.json({ id, status: "opened" });
  /***************/
  const parkingSpaceReservation = await ReservationModel.findOneAndUpdate(
    {
      registration_number: userId,
      completed: false,
    },
    { isCarParked: true }
  );

  if (parkingSpaceReservation) {
    console.log(parkingSpaceReservation.parkingSpaceId.toString());
    const checkTimeOut = setTimeout(() => {
      eventEmitter.emit(
        "responseEvent/openbarrier/" +
          parkingSpaceReservation.parkingSpaceId.toString(),
        {
          error: true,
          message: "timeOut",
        }
      );
    }, 10000);

    eventEmitter.once(
      "responseEvent/openbarrier/" +
        parkingSpaceReservation.parkingSpaceId.toString(),
      (responseMessage) => {
        clearTimeout(checkTimeOut);
        res.json({ responseMessage });
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
      mergedData.push({
        ...value,
        coordinates: results[i].location.coordinates,
        price: results[i]._doc.price,
        // hi: "dsj",
      });
    }
  }

  mergedData.length > 0
    ? res.status(201).json({ data: mergedData })
    : res.status(404).json({ errorMsg: "No parking spaces!" });
};

//!
const reserve_parking_space = async (req, res) => {
  const { date, parkingSpaceId } = req.body;
  const { registration_number: userId } = req.user;

  //check inputs (date)
  if (!date || !moment(date).isAfter(moment(new Date()))) {
    return res.status(400).json({ errorMsg: "error: date is incorrect!" });
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
    return res.status(400).json({ errorMsg: "error: parking space reserved!" });
  }
  if (!parkingSpaceFound) {
    return res.status(404).json({ errorMsg: "error: parking space not found" });
  }
  //reserve
  const reservtion = new ReservationModel({
    userId,
    parkingSpaceId: parkingSpaceId,
    reservationDate: date,
    isCarParked: false,
    completed: false,
  });

  const results = await reservtion.save();
  if (!results) {
    return res.status(400).json({ errorMsg: "error: reservation failed!" });
  }

  //send ack
  res.status(201).json({ data: results });
};

export {
  all_parking_spaces_get,
  parking_space_get_by_ID,
  open_parking_barrier,
  parking_spaces_near_get,
  reserve_parking_space,
};
