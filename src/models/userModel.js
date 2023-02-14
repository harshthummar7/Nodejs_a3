const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Request = require('../models/requestModel')


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        minlength: 5,
        maxlength: 15,
        match: /^[a-zA-Z0-9]+$/

    },
    password:{
        type:String,
        required:true,
        trim:true,
        validate(value){
            if(value.toLowerCase().includes("password"))
            {
                throw Error("This is not valid password")
            }
        }
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate(value)
        {
            if(!validator.isEmail(value))
            {
                throw Error("Email is not valid")
            }
        }

    },
    age:{
        type:Number,
        default:0
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
},{
    timestamps:true
})



userSchema.virtual('data',{
    ref:'Request',
    localField:'_id',
    foreignField:'UId'
})

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()
    //delete userObject.password
    //delete userObject.tokens
    return userObject
}


userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id:user._id.toString()},"thisismynewcourse")
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email,password) => {

        const user = await User.findOne({email})
        if(!user)
        {
             throw new Error('Unable to login!')
            
            
        }
        
        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch) 
        {
           throw new Error('Unable to login!')
        }

        return user


}


userSchema.pre('save',async function(next){
    const user = this
    if(user.isModified('password'))
    {
        user.password = await bcrypt.hash(user.password,8)
    }
    next()
})

userSchema.pre('remove',async function(next){
    const user = this
    await Inventory.deleteMany({owner:user._id})
    next()
})

const User = mongoose.model('User',userSchema)

module.exports = User