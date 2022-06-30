import express from "express";
import {
  // all_parking_spaces_get,
  // parking_space_get_by_ID,
  open_parking_barrier,
  parking_spaces_near_get,
  reserve_parking_space,
} from "../controllers/parkingSpacesController.js";

import isAuth from "../middleware/auth.js";

const router = express.Router();
//get all parking spaces
// router.get("/getAllParkingSpaces", all_parking_spaces_get);

//get a specific parking space by id
// router.get("/getParkingSpace/:id", parking_space_get_by_ID);

//get the nearest parking spaces
router.get("/getNearParkingSpaces", isAuth, parking_spaces_near_get);
//http://localhost:3000/getNearParkingSpaces?longitude=31.80602&latitude=30.080012

//req to open barrier of a specific parking space
router.post("/openBarrier", isAuth, open_parking_barrier);

//reserve a parking space
router.post("/reserveParkingSpace", isAuth, reserve_parking_space);

// app.get("/test", async (req, res) => {});

export default router;
