const express = require('express')
const auth = require('../middleware/auth')
const Request = require('../models/requestModel')
const router = new express.Router()



router.post('/requests',auth,async (req,res)=>{
    const request = new Request(req.body)

    try{
        // await request.save()  
        // res.status(201).send(request)
        res.send({m:"done"})
    }
    catch(e)
    {
        res.status(400).send(e)
    }
    
})

router.get('/requests/msg',async (req,res)=>{
    const requests = await Request.find({})

    try{
        const newRequests = requests.map((request) => {
            if(request.message != null) 
            {
                return request.message
            }
        })  

            res.status(200).send(newRequests)
        
        
    }
    catch(e)
    {
        res.status(400).send(e)
    }
    
})

router.get('/users/count_msg',async (req,res)=>{
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

module.exports = router