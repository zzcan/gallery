const express = require('express')
const Router = express.Router()
const models = require('./model')
const Capacity = models.getModel('capacity')
const Category = models.getModel('category')
const Pic = models.getModel('pic')
const User = models.getModel('user')
const _filter = {'_id': 0,'__v': 0}  //自定义查询条件 过滤掉密码

// 获取用户信息
Router.get('/getUserInfo', (req, res) => {
    User.find({}, _filter).then(data => {
        res.json({Code: 0, Data: data[0], Msg: 'success'})
    }).catch(err => {
        return res.json({code: 1, msg: '服务器出错了'})
    })
})

// 获取图片空间
Router.get('/getSpace', (req, res) => {
    Capacity.find({}, _filter).then(data => {
        res.json({Code: 0, Data: data[0], Msg: 'success'})
    }).catch(err => {
        return res.json({code: 1, msg: '服务器出错了'})
    })
})

// 获取分组
Router.post('/getCategory', (req, res) => {
    let searchName = req.body && req.body.searchName ? req.body.searchName : ''
    Category.find(searchName ? {categoryName: searchName} : {}, _filter).then(data => {
        res.json({Code: 0, Data: data, Msg: 'success'})
    }).catch(err => {
        res.json({code: 1, msg: '服务器出错了'})
    })
})

//获取图片列表
Router.post('/getList', (req, res) => {
    let {categoryId, pageIndex, pageSize, searchName} = req.body
    const query = Pic.find({categoryId, searchName}, _filter)
    
    query.skip((pageIndex - 1) * pageSize)
        .limit(pageSize)
        .then(data => {
            query.count((err, count) => {
                if(err) return res.json({code: 1, msg: '服务器出错了'})
                res.json({Code: 0, Data: {data, total: count}, Msg: 'success'})
            })
        })
        .catch(err => {
            res.json({code: 1, msg: '服务器出错了'})
        })
      
})
module.exports = Router