import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { initSocket } from "./config/server.config.js";
import http from "http";
import notificationRoute from "./routes/notification.routes.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// socket initilization
const server = http.createServer(app);
initSocket(server);

connectDB();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/notification", notificationRoute);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
