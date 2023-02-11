//all imports and intializtions
import dotenv from 'dotenv';
import express from "express";
import bcrypt from 'bcryptjs'
import bodyParser from "body-parser";
import { body, validationResult } from 'express-validator'
import JWT from 'jsonwebtoken';
import User from "../models/User.js";
import { OTPGenerator, VerifyOTP,sendMail } from '../custom/index.js';
import authenticate from '../middleware/authenticate.js';

//initialzations
dotenv.config()
export const route = express.Router()
const JWT_SECRET = process.env.JWT_SECRET

//middleware
route.use(bodyParser.json())

//Routes

//CreateUser Route-I : authentication not required
route.post('/createuser', [
    body('name', 'Enter a Valid Name').isLength({ min: 3 }),
    body('email', 'Enter a Valid Email').isEmail(),
    body('password', 'Password must be more than 8 Characters').isLength({ min: 8 })
], async (req, res) => {
    let success = false
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, password } = req.body
        let user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ success, error: "Sorry but this user already Exists" })
        }
        const salt = await bcrypt.genSalt(15)
        const secPass = await bcrypt.hash(password, salt)
        const response = await User.create({
            name, email, password: secPass
        })
        const data = {
            user: {
                id: response.id
            }
        }
        success = true
        const authToken = JWT.sign(data, JWT_SECRET)
        res.status(201).json({ success, authToken })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success,Error: "Some Error has occured" })
    }

})

//Login Route - II : action depending on the authentication
route.post('/login', [
    body('password', 'Password can not be blank').exists()
], authenticate, async (req, res) => {
    let success = false
    //if there are errors then return bad requests and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }
    const { email, password } = req.body
    try {
        if (req.user) {
            const _id = req.user.id
            const user = await User.findById({ _id })
            let passwordCheck = await bcrypt.compare(password, user.password)
            if (!passwordCheck) {
                return res.status(400).json({ success, error: "Wrong password" })
            }
            const data = {
                user: {
                    id: user.id
                }
            }
            success = true
            const authToken = JWT.sign(data, JWT_SECRET)
            return res.status(202).json({ success, authToken })
        }
        const user = await User.findOne({ email })
        let passwordCheck = await bcrypt.compare(password, user.password)
        if (!passwordCheck) {
            return  res.status(400).json({ success, error: "Wrong password" })
        }
        const { secret, token } = OTPGenerator()
        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = JWT.sign(data, JWT_SECRET)
        success=true
        res.status(202).json({success,authToken})
        await User.findByIdAndUpdate(user.id, { $set: { OTPhash: secret, OTP_Created_on: Date.now() } }, { new: true })
        const {err:error}=await sendMail({
            from: "Verification Email<iamsoumo26@gmail.com>",
            to: 'iamsoumo2004@gmail.com',
            subject: 'One Time Verification Email',
            html: `<p style="font-size:14px">Your OTP is <strong style="font-size:16px">${token}</strong>. This OTP will expire in 60 seconds</p>`
        })
        if(error){
            console.log("error")
            // return res.status(500).json({success,error:"Some error has occured"})
        }else{
            console.log("sent")
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({success, Error: "Some error has occured" })
    }
})

//Verify Route - III : authentication required to proceed 
route.post('/verify',authenticate,async(req,res)=>{
    let success=false
    if(!req.user){
        res.status(401).json({success,error:"Unauthorize access"})
        return
    }
    try {      
        const {email,id:_id}=req.user
        const token=req.body.token
        const UserPromise=_id?User.findById({_id}):User.findOne({email})
        const user=await UserPromise
        if((Date.now()-user.OTP_Created_on)>60000)
        {
            res.status(408).json({success,error:"OTP has exprired"})
            return 
        }
        const verifed=VerifyOTP(user.OTPhash,token)
        if(!verifed)
        {
            res.status(400).json({success,error:"Invaild OTP"})
            return
        }
        const data = {
            user: {
                id: user.id
            }
        }
        const authToken = JWT.sign(data, JWT_SECRET)
        success=true
        res.status(200).json({success,message:"verifed",authToken})
        await User.findByIdAndUpdate(user.id, { $set: { OTPhash: "", OTP_Created_on:"" } }, { new: true })   
    } catch (error) {
        console.log(error)
        res.status(500).json({ success,Error: "Some Error has occured" })
    }
})

//Resend Route - IV : authentication required and this route is to send otp again
route.post('/resend',authenticate,async (req,res)=>{
    let success=false
    if(!req.user){
        return res.status(401).json({success,error:"Unauthorize access"})
    }
    try {
        const { secret, token } = OTPGenerator()
        const {sent}=await sendMail({
            from: "Verification Email<iamsoumo26@gmail.com>",
            to: 'iamsoumo2004@gmail.com',
            subject: 'Resent One Time Verification Email',
            html: `<p style="font-size:14px">Your OTP is <strong style="font-size:16px">${token}</strong>. This OTP will expire in 60 seconds</p>`
        })
        if(!sent){
            res.status(500).json({success,error:"Some error has occured"})
        }
        success=true
        res.status(202).json({success,message:"resend OTP"})
        await User.findByIdAndUpdate(req.user.id, { $set: { OTPhash: secret, OTP_Created_on: Date.now() } }, { new: true })
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ success,Error: "Some Error has occured" })
    }
})

//ForgetPass Route - V : authentication not required to change the password  
route.post('/forgetpassword',[body('email', 'Enter a Valid Email').isEmail()],async (req,res)=>{
    let success=false
    try {
        const {email}=req.body
        const user=await User.findOne({email})
        if(!user){
            return res.status(401).json({success,error:"Unauthorize access denied"})
        }
        const { secret, token } = OTPGenerator()
        const data = {
            user: {
                email
            }
        }
        const authToken = JWT.sign(data, JWT_SECRET)
        success=true
        res.status(202).json({success,authToken})
        await User.findByIdAndUpdate(user._id, { $set: { OTPhash: secret, OTP_Created_on: Date.now() } }, { new: true })
        const {err:error}=await sendMail({
            from: "Password Reset Verification<iamsoumo26@gmail.com>",
            to: 'iamsoumo2004@gmail.com',
            subject: 'One Time Verification Email',
            html: `<p style="font-size:14px">Your OTP is <strong style="font-size:16px">${token}</strong>. This OTP will expire in 60 seconds. Don't Share this OTP with anyone</p>`
        })
        if(error){
            console.log("error")
            // return res.status(500).json({success,error:"Some error has occured"})
        }else{
            console.log("sent")
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success,Error: "Some Error has occured" })
    }
})

//NewPassword Route - VI : authentication required
route.patch('/newpassword',[body('password', 'Password must be more than 8 Characters').isLength({ min: 8 })],authenticate,async (req,res)=>{
    let success=false
    if(!req.user){
        return res.status(401).json({success,error:"Unauthorize access"})
    }
    try {
        const {id:_id}=req.user
        const {password}=req.body
        const salt = await bcrypt.genSalt(15)
        const secPass = await bcrypt.hash(password, salt)
        success=true
        res.status(202).json({success,message:"Password changed"})
        await User.findByIdAndUpdate(_id, { $set: { password: secPass} }, { new: true })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success,Error: "Some Error has occured" })
    }
})

//Get Credentials Route - VII : authentication required
route.get('/user/details',authenticate,async(req,res)=>{
    let success=false
    if(!req.user){
        res.status(401).json({success,error:"Unauthorize access"})
    }
    try {
        const user=await User.findById(req.user.id).select('-password -OTP_Created_on -OTPhash -_id')
        success=true
        res.status(200).json({success,result:user})
    } catch (error) {
        console.log(error)
        res.status(500).json({ success,Error: "Some Error has occured" })
    }
})

//Update Credentials Route - VIII : authentication required
route.patch('/user/update',authenticate,async(req,res)=>{
    let success=false
    if(!req.user){
        res.status(401).json({success,error:"Unauthorize access"})
    }
    try {
        await User.findByIdAndUpdate(req.user.id,{$set:{...req.body}})
        success=true
        res.status(200).json({success,messege:"Credentials updated"})
    } catch (error) {
        console.log(error)
        res.status(500).json({ success,Error: "Some Error has occured" })
    }
})