const express = require('express')
const app = express()
const galleryRouter = require('./gallery')
const bodyParser = require('body-parser')
const upload = require('jquery-file-upload-middleware')

upload.configure({
    uploadDir: `${__dirname}/uploads`,
    uploadUrl: '/uploads',
    imageVersions: {
        space: {
            width: 128,
            height: 128
        }
    }
})
app.use(bodyParser.json())
app.use('/gallery', galleryRouter)

app.listen(1010, () => {
    console.log('Node app start at port 1010')
})