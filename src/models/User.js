//import Mongoose
import mongoose from "mongoose";

//defining schema
const UserSchema=mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,required:true},
    photography_exprience:{type:Number,default:2020},
    Art_exprience:{type:Number,default:2021},
    OTPhash:{type:String},
    OTP_Created_on:{type:Number}
})

export default mongoose.model('User',UserSchema)