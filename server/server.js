const fs = require('fs');
const path = require('path');
const express = require('express')
const app = express()
const galleryRouter = require('./gallery')
const bodyParser = require('body-parser')
const JFUM = require('jfum')
const jfum = new JFUM({
    minFileSize: 100,
    maxFileSize: 5242880, // 5 mB
    acceptFileTypes: /\.(gif|jpe?g|png|bmp)$/i // gif, jpg, jpeg, png
})
const models = require('./model')
const Pic = models.getModel('pic')

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use('/gallery', galleryRouter)

app.options('/upload', jfum.optionsHandler.bind(jfum))
app.post('/upload', jfum.postHandler.bind(jfum), function (req, res) {
    // Check if upload failed or was aborted
    if (req.jfum.error) {
        // req.jfum.error
        return res.json(500, '服务器出错了！')
    } else {
        // Here are the uploaded files
        req.jfum.files.forEach(file => {
            // Check if file has errors
            if (file.errors.length > 0)  return res.json({code: 1, msg: '服务器出错了'})
            // file.field - form field name
            // file.path - full path to file on disk
            // file.name - original file name
            // file.size - file size on disk
            // file.mime - file mime type
            const sourceFile = file.path
            const destPath = path.join(__dirname, "public/images", file.name)
            const imgPath = `http://localhost:1010/images/${file.name}`
            fs.readFile(sourceFile, (err, data) => {
                if (err) res.json({code: 1, msg: '服务器出错了'})
                fs.writeFile(destPath, data, err => {
                    if (err) res.json({code: 1, msg: '服务器出错了'})
                    //图片上传
                    if(file.field.indexOf('&') === -1) {
                        Pic.find({}).then(aData => {
                            let id = aData.length ? aData[aData.length - 1].id : -1
                            id++
                            Pic.create({ categoryId: +file.field, fileSize: file.size, path: imgPath, id, name: file.name}).then(data => {
                                file.path = imgPath
                                file.id = id
                                res.json({Code: 0, Data: file, Msg: 'The file has been saved!'})
                            }).catch(err => {
                                res.json({code: 1, msg: '服务器出错了'})
                            })
                        }) 
                    }else {
                        //图片替换
                        const ids = file.field.split("&")
                        let id = +ids[1]
                        Pic.update({id}, {name: file.name, path: imgPath, fileSize: file.size}).then(data => {
                            console.log(data)
                            res.json({Code: 0, Data: {id, name: file.name, path: imgPath, fileSize: file.size}, Msg: 'The pic has been replaced success!'})
                        }).catch(err => {
                            res.json({code: 1, msg: '服务器出错了'})
                        })
                    }
                    
                })
            })
        })
    }
});

app.listen(1010, () => {
    console.log('Node app start at port 1010')
})