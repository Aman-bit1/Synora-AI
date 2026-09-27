import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectdb from "./config/db.js";
import router from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use("/", router);

app.get("/", (req, res) => {
    res.json({
        message: "hello from auth"
    });
});

app.listen(port, () => {
    console.log(`auth is running on ${port}`);
    connectdb();
});