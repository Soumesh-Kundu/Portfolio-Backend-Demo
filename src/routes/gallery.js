//all imports
import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import Print_Making from '../models/PrintMaking.js'
import Photography from "../models/photography.js";
import  Painting from '../models/Painting.js'
import authenticate from '../middleware/authenticate.js';
import { hash_encoder } from '../custom/index.js';
import { unlink } from 'fs/promises'

//all initializations
export const route=express.Router()
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname)
    }
})
const upload = multer({ storage: storage })
const modelMap= new Map([
    ["Photography",Photography],
    ["Painting",Painting],
    ["Print Making",Print_Making]
])

//middlewares
route.use(bodyParser.json())

//Get All Works Route - I : authentication depends
route.get('/works',async (req,res)=>{
    try {
        const {page, limit, category}=req.query
        const model=modelMap.get(category)
        const resultPromise=model.find().sort('-Created_on').skip((page-1)*limit).limit(limit).select('-admin')
        const results=await resultPromise.exec()
        return res.status(200).json({
            response:"ok",
            category,
            results
        })
    } catch (error) {
        return res.status(500).json({response:"Not Right",error:"Internal server error"})
    }
})

//upload file Route - II : authentication required
route.post('/uploads',authenticate,upload.single('uploadImage'),async (req,res)=>{
    let success=false
    if(!req.user){
        return res.status(401).json({success,error:"Unauthorize access"})
    }
    try {
        const {name,category:type}=req.body
        const path=req.file.path.replace('\\','/')
        const admin=req.user.id
        const Created_on=new Date()
        const model= modelMap.get(type)
        const blurhash=await hash_encoder(path)
        model.create({name,type,path,admin,blurhash,Created_on})
        success=true
        res.status(201).json({success,messege:"File uploaded Successfully"})
    } catch (error) {
        res.status(500).json({success,error:"Internal server error"})
    }
})

//Update file Route - III : authentication required 
route.patch('/updateinfo/:id',authenticate, async (req,res)=>{
    let success=false
    if(!req.user){
        res.status(401).json({success,error:"Unauthorize access"})
    }
    try {
        const id=req.params.id
        const {category}=req.query
        const model=modelMap.get(category)
        await model.findByIdAndUpdate(id,{$set : {...req.body}},{new:true})
        success=true
        res.status(200).json({success,messege:"File Updated"})
    } catch (error) {
        res.status(500).json({success,error:"Internal server error"})
    }
})

//Delete File Route - IV : authetcation required
route.delete('/deletefile/:id',authenticate,async (req,res)=>{
    let success=false
    if(!req.user){
        res.status(401).json({success,error:"Unauthorize access"})
    }
    try {
        const id=req.params.id
        const {category}=req.query 
        const model=modelMap.get(category)
        const {path} = await model.findById(id)
        await model.findByIdAndDelete(id)
        unlink(path)
        success=true
        res.status(200).json({success,messege:"File deleted"})
    } catch (error) {
        res.status(500).json({success,error:"Internal server error"})
    }
})