import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import roomRoutes from "./routes/room.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/room", roomRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectDB();


server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
