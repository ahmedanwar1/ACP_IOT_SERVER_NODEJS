import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      required: true,
      type: String,
      ref: "User",
    },
    parkingSpaceId: {
      required: true,
      type: mongoose.SchemaTypes.ObjectId,
      ref: "ParkingSpace",
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
    completed: {
      required: true,
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);
