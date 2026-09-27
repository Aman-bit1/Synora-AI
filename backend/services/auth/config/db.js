import mongoose from "mongoose"
const connectdb = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("connected to db")
    } catch (error) {
        console.log(` db error ${error}`)
    }
}
export default connectdb