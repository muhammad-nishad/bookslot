const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

connectDB();

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
