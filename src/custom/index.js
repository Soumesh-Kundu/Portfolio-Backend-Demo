import dotenv from 'dotenv';
dotenv.config()
import speakeasy from 'speakeasy';
import sharp from 'sharp'
import { encode } from 'blurhash';
import nodemailer from 'nodemailer';

const mailsender = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: '465',
    secure: true,
    auth: {
        user: process.env.COMPANY_EMAIL,
        pass: process.env.COMPANY_PASS
    }
})

export function OTPGenerator() {
    let secret = speakeasy.generateSecret().base32
    let token = speakeasy.totp({
        secret,
        encoding: 'base32',
        algorithm: 'sha512',
        window: 2
    })
    return { secret, token }
}
export function VerifyOTP(secret, token) {
    let verifed = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        algorithm: 'sha512',
        token,
        window: 2
    })
    return verifed
}

export function hash_encoder(path) {
    return new Promise(async (resolve,reject)=>{
        let { data, info } = await sharp(path).raw().ensureAlpha().resize(50, 35, 
            {fit:"cover"}).toBuffer({
                resolveWithObject: true
            })
            const blurhashEnocde = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3)
        resolve(blurhashEnocde)
    })
}

export function sendMail(mailoptions){
    return new Promise((resolve,reject)=>{
        mailsender.sendMail(mailoptions,(err,info)=>{
            resolve({err})
        })
    })
}