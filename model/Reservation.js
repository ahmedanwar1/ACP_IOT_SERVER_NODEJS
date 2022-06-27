import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      required: true,
      // type: mongoose.SchemaTypes.ObjectId,
      type: String,
      ref: "User",
      unique: true,
    },
    parkingSpaceId: {
      required: true,
      type: mongoose.SchemaTypes.ObjectId,
      ref: "ParkingSpace",
      unique: true,
    },
    reservationDate: {
      required: true,
      type: Date,
    },
    isCarParked: {
      required: true,
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);
