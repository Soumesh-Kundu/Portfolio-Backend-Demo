//imports
import mongoose from "mongoose";

//defining schema
const PaintingModel=mongoose.Schema({
    name:{type:String,required:true},
    type:{type:String,required:true},
    admin:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    author:{type:String,default:"Sumit Paul"},
    path:{type:String,required:true},
    blurhash:{type:String,required:true},
    Created_on:{type:Date,default:new Date().toISOString().slice(0,10)}
})

export default mongoose.model("Paintings",PaintingModel)