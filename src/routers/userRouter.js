const express = require('express')
const router = new express.Router()
const mongoose = require('mongoose');
const User = require('../models/userModel')
const generateToken = require('../jwt/authToken')
const {sendWelcomeEmail,sendCancelationEmail} = require('../emails/account')
const auth = require('../middleware/auth')
const crypto = require('crypto');
const Redis = require('redis')
const redisClient = Redis.createClient()

//signup user
router.post('/users',async (req,res)=>{

    (async () => {
        await redisClient.connect();
    })();
      

    const user = new User(req.body)
    const buffer = crypto.randomBytes(12);
    const id = buffer.toString('hex');
    const data = user
    data._id = mongoose.Types.ObjectId(id)
     
    try{
        if(!(user.password.length >= 6 && user.password.length<= 12))
        {
            throw new Error("length is not valid")
        }
       
        const info = {}
        var result =  await redisClient.get("client") || []
       
        if(result.length != 0)
        {
            
            var r1 = JSON.parse(result)
    
            var result = r1.value
        }
        data.tokens = []
        
        const Rtoken = await generateToken(data)
        console.log('before',data.tokens)
        console.log(Rtoken)
        data.tokens.push({token:Rtoken})
        console.log('after',data.tokens)
        result.push(data)
        console.log({result})

        info.value = result
      

        await redisClient.set("client",JSON.stringify(info)) 
        await user.save()

     
        sendWelcomeEmail(user.email,user.name)
      
        const token = await user.generateAuthToken()
        
        res.status(201).send({user,token,message:"successfuly insert"})
        
    }
    catch(e)
    {
        console.log(e)
        res.status(400).send({message:"error"})
    }
    finally{
        redisClient.quit();
    }
    
})


//login user
router.post('/users/login',async (req,res) => {
    (async () => {
        await redisClient.connect();
    })();
    try{
        //await redisClient.del("client")
         const result =  await redisClient.get("client")
         //console.log(result)
         if(result != null)
            {          
               
                const data = JSON.parse(result)
               // console.log(data)
                const response = data.value.find((d) => (d.name === req.body.name && d.password === req.body.password))
               
                // console.log(response)
                if(response != null)  
                {   
                    const dup = response
                    const Rtoken = await generateToken(response)
                   // console.log(Rtoken)
                    response.tokens.push({token:Rtoken})
                    
                    var i;
                     data.value.forEach((v,index) => {
                        if(v._id === dup._id)
                        {
                            //console.log(index)
                            i = index
                            return 
                        }
                    })
                   // console.log(i)
                    data.value[i] = response

                    await redisClient.set("client",JSON.stringify(data)) 
                    return res.status(200).send({response,Rtoken,message:"successfuly get"})
                    
                }  
                
            }
           
            
        console.log({message:"data does not in redis"})   
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user , token})
        //res.send({m:"delete"})
    }
    catch(e)
    {
       // console.log(e)
        res.status(400).send(e.message)
    }
     
    finally{
        redisClient.quit();
    }
    
})


router.post('/delete',async (req,res) => {
    (async () => {
        await redisClient.connect();
    })();
    try{
        await redisClient.del("client")
        res.send({m:"delete"})
    }
    catch(e){
        res.status(500).send()
    }
    finally{
        redisClient.quit();
    }

})


//logout user
router.post('/users/logout',auth,async (req,res) => {
    try{
            req.user.tokens = req.user.tokens.filter((token)=>{
                return token.token !== req.token
            })

            await req.user.save()
            res.send()
    }
    catch(e){
        res.status(500).send()
    }
})


//logout all 
router.post('/users/logoutAll',auth,async (req,res) => {
    try{
            req.user.tokens = []

            await req.user.save()
            res.send()
    }
    catch(e){
        res.status(500).send()
    }
})


//update user
router.patch('/users/me',auth,async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password','age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error: "Invalid updates!"})
    }

    try{

           updates.forEach((update)=>req.user[update]=req.body[update])
           await req.user.save()
           res.send(req.user)
    }
    catch(e)
    {
        res.status(400).send()
    }
})


//delete user 
router.delete('/users/me',auth,async (req,res) =>{
    try{
        await req.user.remove()
        sendCancelationEmail(req.user.email,req.user.name)
        res.send(req.user)
    }
    catch(e)
    {
        res.status(500).send()
    }
})

module.exports = router