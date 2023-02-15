const express = require('express')
const auth = require('../middleware/auth')
const Request = require('../models/requestModel')
const router = new express.Router()
const User = require('../models/userModel')
const Redis = require('redis')
const redisClient = Redis.createClient()


router.post('/requests',auth,async (req,res)=>{
    const request = new Request({...req.body,UId:req.user._id})

    try{
        await request.save()  
        res.status(201).send(request)
        // res.send({m:"done"})
    }
    catch(e)
    {
        res.status(400).send(e)
    }
    
})


router.get('/requests',auth,async (req,res)=>{
      
    (async () => {
        await redisClient.connect();
    })();
      

    try{
        
        const info = {}
        var result =  await redisClient.get("user") || []
        if(result.length != 0)
        {
            
            var r1 = JSON.parse(result)
            var result = r1.value
            var response = result.find((d) => (d._id === req.user._id ))
            response.count += 1
            
            const data = {
                _id:req.user._id,
                count:response.count
            }
            var i
            result.forEach((user,index) => {
                if(user._id === req.user._id)
                {
                    
                     i = index
                     return 
                }
            })
          
            result[i] = data
            r1.value = result
            await redisClient.set("user",JSON.stringify(r1))
        }
        else{
              
            var data = {
                _id:req.user._id,
                count:1
            }
        
        result.push(data)
        info.value = result
        await redisClient.set("user",JSON.stringify(info))

        } 

        const user = await User.findById(req.user._id)
        await user.populate({
            path:'data'
        })
        const msgAll = user.data.map((request) => {
            if(request.message != null) 
            {
                return request.message
            }
        })  
        res.status(200).send(msgAll)
        // res.send({m:"done"})
    }
    catch(e)
    {
        console.log(e)
        res.status(400).send(e)
    }

    finally{
        redisClient.quit();
    }
    
})



// router.get('/requests/msg',async (req,res)=>{

//     const requests = await Request.find({})

//     try{
//         const newRequests = requests.map((request) => {
//             if(request.message != null) 
//             {
//                 return request.message
//             }
//         })  

//             res.status(200).send(newRequests)
        
        
//     }
//     catch(e)
//     {
//         res.status(400).send(e)
//     }
    
// })


router.get('/requests/count_request',auth,async (req,res)=>{
    (async () => {
        await redisClient.connect();
    })();

    try{
        const result = await redisClient.get("user")
        const data = JSON.parse(result)
        const response = data.value.find((d) => (d._id === req.user._id ))

        const userJson = await redisClient.get("client")
        const userObj = JSON.parse(userJson)
        const user = userObj.value.find((d) => (d._id === response._id ))
        res.status(200).send({user,response})
    }
    catch(e)
    {
        console.log(e)
        res.status(400).send(e)
    }
    finally{
        redisClient.quit();
    }
    
})

router.get('/requests/count_msg',async (req,res)=>{
    const requests = await Request.find({})

    try{
        var Direct = 0;
        var Failed = 0;
        var Retried = 0;
        requests.map((request) => {
            if(request.category === "Direct") 
            {
                Direct++
            }
            else if(request.category === "Failed") 
            {
                Failed++
            }
            else 
            {
                Retried++
            }
        })  

            res.status(200).send({
                Direct,
                Failed,
                Retried
            })
        
        
    }
    catch(e)
    {
        res.status(400).send(e)
    }
    
})

router.post('/delete_user',async (req,res) => {
    (async () => {
        await redisClient.connect();
    })();
    try{
        await redisClient.del("user")
        res.send({m:"delete"})
    }
    catch(e){
        res.status(500).send()
    }
    finally{
        redisClient.quit();
    }

})

module.exports = router