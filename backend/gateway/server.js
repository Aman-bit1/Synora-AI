import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cookieParser from "cookie-parser";
import cors from "cors";
import protect from "./middleware/auth.middleware.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import morgan from "morgan"
dotenv.config();
const app = express();
const port = process.env.PORT;
app.use(express.json());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(morgan("dev"))
app.use("/api/auth", proxy(process.env.AUTH_SERVICE));
app.use("/api/chat",protect, proxyWithHeader(process.env.CHAT_SERVICE)); //proxywithheader user to get the usersession id from protect function in middleware to use this chat service
app.use("/api/agent",protect, proxyWithHeader(process.env.AGENT_SERVICE));
app.use("/api/chat",protect, proxyWithHeader(process.env.CHAT_SERVICE));
app.use("/api/billing",protect, proxyWithHeader(process.env.BILLING_SERVICE));
app.use("/api/me", protect, getCurrentUser); ///it is used so that we can get user even after refreshing

app.get("/", (req, res) => {
  res.json({
    message: "hello from gateway",
  });
});
app.listen(port, () => {
  console.log(`gateway is running on ${port}`);
});
