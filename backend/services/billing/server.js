import express from "express";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import router from "./routes/billing.route.js";




dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use((req, res, next) => {
    console.log("BILLING REQUEST:", req.method, req.url);
    next();
});

app.use("/", router);
app.get("/", (req, res) => {
    res.json({
        message: "hello from biling"
    });
});

app.listen(port, () => {
    console.log(`billing is running on ${port}`);
    connectdb();
});