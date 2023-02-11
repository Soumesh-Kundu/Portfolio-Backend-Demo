//all imports
import  {route as authRouter} from './src/routes/auth.js'
import  {route as galleryRouter} from './src/routes/gallery.js'
import User from './src/models/User.js';
import { sendMail } from './src/custom/index.js';
import connectToMongo from './database.js';
import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config()

//all instialzations
const app=express()
const PORT=process.env.PORT ?? 8080

//Connect To MongoDB
connectToMongo()

//middleware setup
app.use(cors())
app.use(express.json())
app.use('/uploads',express.static('uploads'))

app.use('/api/auth',authRouter)
app.use('/api/gallery',galleryRouter)
app.get('/',(req,res)=>{
    res.status(200).send("Hello World!!")
})

//Contact Route : authentication not required
app.post('/contact',async(req,res)=>{
    try {
        const {name,messege,email}=req.body
        const user=await User.find()
        const sent=await sendMail({
            from:`${name}<iamsoumo26gmail.com>`,
            to:`${user[0].email}`,
            subject:`A Contact mail from ${name}`,
            html:`<div style="font-size:15px; font-weight:600"><p>Dear Sumit,</p><p>${messege}</p><p>from ${name},</p><br><p>to Contact, mail me to this ${email} address</p></div>`
        })
        if(!sent) throw error
        res.status(200).json({success:true,messege:'sent'})
    } catch (error) {
        console.log(error)
        res.status(500).json({ success,Error: "Some Error has occured" })
    }
})

//starting server 
app.listen(PORT,()=>{
    console.log(`Server has started on http://localhost:${PORT}`)
})
