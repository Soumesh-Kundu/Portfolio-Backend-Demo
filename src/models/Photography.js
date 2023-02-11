//imports
import mongoose from "mongoose";

//defining schema
const PhotographyModel=mongoose.Schema({
    name:{type:String,required:true},
    type:{type:String,required:true},
    admin:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    author:{type:String,default:"Sumit Paul"},
    path:{type:String,required:true},
    blurhash:{type:String,required:true},
    Created_on:{type:Date,default:Date.now()}
})

export default mongoose.model("Photography",PhotographyModel)