//all Imports
import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config()

//connection for db
const connectToMongo=()=>{
    mongoose.set('strictQuery',false);
    mongoose.connect(process.env.DB_URL,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    },()=>{
        console.log("Database Has been Connected, Ready to use")
    })
}

//exporting
export default connectToMongo