import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      required: true,
      type: String,
      ref: "User",
    },
    reservationId: {
      required: true,
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Reservation",
      // unique: true,
    },
    amount: {
      required: true,
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
