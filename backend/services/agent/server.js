import express from "express";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import router from "./routes/agent.route.js";



dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use("/",router)
app.get("/", (req, res) => {
    res.json({
        message: "hello from agent"
    });
});

app.listen(port, () => {
    console.log(`agent is running on ${port}`);
    connectdb();
});