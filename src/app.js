const express = require('express')
require('./db/mongoose')
const requestRouter = require('./routers/requestRouter')
const userRouter = require('./routers/userRouter')

const app = express()

app.use(express.json())
app.use(requestRouter)
app.use(userRouter)

module.exports = app