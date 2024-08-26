import express from "express";
import Room from "../models/Room.js";
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const rooms = await Room.find({ status: "available" });
    if (rooms.length === 0) {
      return res.status(404).json({ message: "No rooms are available now." });
    }
    res
      .status(200)
      .json({ data: rooms, message: "Available Rooms Fetched Successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
