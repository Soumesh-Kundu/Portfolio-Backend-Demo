//all imports
import dotenv from 'dotenv';
import JWT from 'jsonwebtoken';

//initializations
dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET

function authenticate(req, res, next) {
    //get The User from jwt token and id to req object
    const token = req.header("auth-token")

    //if token not find set user null to verify with otp
    if (!token) {
        req.user = null
        next()
        return
    }
    try {
        const data = JWT.verify(token, JWT_SECRET)
        req.user = data.user
        next()
    } catch (error) {
        res.status(401).json({ error: "please authenticate using valid token" })
    }
    
}

export default authenticate