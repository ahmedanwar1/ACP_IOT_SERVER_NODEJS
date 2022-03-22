import express from "express";
import {
  all_parking_spaces_get,
  parking_space_get_by_ID,
  open_parking_barrier,
  parking_spaces_near_get,
} from "../controllers/parkingSpacesController.js";

const router = express.Router();
//get all parking spaces
router.get("/getAllParkingSpaces", all_parking_spaces_get);

//get the nearest parking spaces
router.get("/getParkingSpacesNear", parking_spaces_near_get);
//http://localhost:3000/getParkingSpacesNear?longitude=31.80602&latitude=30.080012

//get a specific parking space by id
router.get("/getParkingSpace/:id", parking_space_get_by_ID);

//req to open barrier of a specific parking space
router.get("/openBarrier/:id", open_parking_barrier);

// app.get("/test", async (req, res) => {});

export default router;
