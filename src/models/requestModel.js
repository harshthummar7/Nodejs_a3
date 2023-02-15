const mongoose = require('mongoose')


const requestSchema = new mongoose.Schema({
    UId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    message:{
        type:String,
        required:true,
        trim:true

    },
    category:{
        type:String,
        required:true,
        trim:true,
        validate(value){
            if(!(value==='Direct' || value==='Retried' || value==='Failed'))
            {
                throw Error("This is not valid category")
            }
        }
    }
},{
    timestamps:true
})


const Request = mongoose.model('Request',requestSchema)

module.exports = Request