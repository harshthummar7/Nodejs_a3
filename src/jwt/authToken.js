const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const generateToken = async function(res){
    const user = res
    const token = jwt.sign({_id:user._id.toString()},"thisismynewcourse")
    const decodedToken = jwt.verify(token,"thisismynewcourse");
    console.log(decodedToken)
    //user.tokens = user.tokens.concat({token})
    //await user.save()
    //console.log(token)
    return {token,_id:decodedToken._id}
}
module.exports = generateToken