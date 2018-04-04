const express = require('express')
const Router = express.Router()
const models = require('./model')
const Capacity = models.getModel('capacity')
const Category = models.getModel('category')
const Pic = models.getModel('pic')
const _filter = {'_id': 0,'__v': 0}  //自定义查询条件 过滤掉密码

Router.get('/getSpace', (req, res) => {
    Capacity.find({}, _filter).then(data => {
        res.json({Code: 0, Data: data[0], Msg: 'success'})
    }).catch(err => {
        return res.json({code: 1, msg: '服务器出错了'})
    })
})
Router.post('/getCategory', (req, res) => {
    let searchName = req.body && req.body.searchName ? req.body.searchName : ''
    console.log(req.body, searchName)
    Category.find(searchName ? {categoryName: searchName} : {}, _filter).then(data => {
        res.json({Code: 0, Data: data, Msg: 'success'})
    }).catch(err => {
        return res.json({code: 1, msg: '服务器出错了'})
    })
})
module.exports = Router