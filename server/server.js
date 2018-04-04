const express = require('express')
const app = express()
const galleryRouter = require('./gallery')
const bodyParser = require('body-parser')

app.use('/gallery', galleryRouter)
app.use(bodyParser.json())

app.listen(1010, () => {
    console.log('Node app start at port 1010')
})