const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const Redis = require('redis')
const redisClient = Redis.createClient()
const JWT_SECRET="thisismynewcourse"

const auth = async (req,res,next)=>{
    (async () => {
        await redisClient.connect();
    })();
    try{
        
        const token = req.header('Authorization').replace('Bearer ','')
        const decode = jwt.verify(token,JWT_SECRET)
        const result =  await redisClient.get("client")
        const data = JSON.parse(result)
        const response = data.value.find((d) => (d._id === decode._id && d.tokens[d.tokens.length-1].token === token))
       // console.log(data.value.tokens)
        //const user = await User.findOne({_id:decode._id,'tokens.token':token})

        if(!response)
        { console.log(1)
            throw new Error()
        }
        req.token = token
        req.user = response
        next()
    }
    catch(e){
        res.status(401).send({error:"Please authenticate."})
    }
    finally{
        redisClient.quit();
    }
}

module.exports = auth