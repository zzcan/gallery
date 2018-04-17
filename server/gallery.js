
const express = require('express')
const Router = express.Router()
const models = require('./model')
const Capacity = models.getModel('capacity')
const Category = models.getModel('category')
const Pic = models.getModel('pic')
const User = models.getModel('user')
const _filter = {'_id': 0,'__v': 0}  //自定义查询条件 过滤掉密码

let cId = 1010
let pId = 1010

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
Router.get('/getCategory', (req, res) => {
    Category.find({}, _filter).then(data => {
        res.json({Code: 0, Data: data, Msg: 'success'})
    }).catch(err => {
        res.json({code: 1, msg: '服务器出错了'})
    })
})

//获取图片列表
Router.get('/getList', (req, res) => {
    let { categoryId, pageIndex, pageSize, searchName } = req.query
    categoryId = Number(categoryId)
    pageIndex = Number(pageIndex)
    pageSize = Number(pageSize)

    const queryOption = searchName ? {categoryId, name: searchName} : {categoryId}
    const query = Pic.find(queryOption, _filter)
    
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

// 添加分组
Router.post('/addCategory', (req, res) => {
    const { categoryName } = req.body
    Category.find({}).then(aData => {
        let id = aData.length ? aData[aData.length - 1].id : -1
        id++
        Category.create({categoryName, id}).then(data => {
            res.json({Code: 0, Data: {categoryName, id}, Msg: 'success'})
        }).catch(err => {
            res.json({code: 1, msg: '服务器出错了'})
        })
    })
})

// 修改分组名称
Router.post('/categoryRename', (req, res) => {
    const { id, name } = req.body
    Category.update({id}, {categoryName: name}).then(data => {
        if(data.ok === 1) {
            res.json({Code: 0, Data: {categoryName: name, id}, Msg: 'success'})
        }else {
            res.json({code: 1, msg: '服务器出错了'})
        }
    }).catch(err => {
        res.json({code: 1, msg: '服务器出错了'})
    })
})
// 修改图片名称
Router.post('/picRename', (req, res) => {
    const { ids, name } = req.body
    const newIds = ids.includes(',') ? ids.split(',') : [+ids]
    console.log(newIds)
    Pic.update({ id: {$in: newIds} }, { name }).then(data => {
        if(data.ok === 1) {
            res.json({Code: 0, Data: true, Msg: 'success'})
        }else {
            res.json({code: 1, msg: '服务器出错了'})
        }
    }).catch(err => {
        res.json({code: 1, msg: '服务器出错了'})
    })
})

// 删除分组
Router.post('/delCategory', (req, res) => {
    const { categoryId } = req.body
    Category.remove({ id: categoryId }).then(data => {
        if(data.ok === 1) {
            Pic.remove({categoryId}).then(d => {
                if(d.ok === 1) {
                    res.json({Code: 0, Data: true, Msg: 'success'})
                }else {
                    res.json({code: 1, msg: '服务器出错了'})
                }
            })
        }else {
            res.json({code: 1, msg: '服务器出错了'})
        }
    }).catch(err => {
        res.json({code: 1, msg: '服务器出错了'})
    })
})

// 移动图片至新分组
Router.post('/moveCategory', (req, res) => {
    const { categoryId, ids } = req.body
    Pic.updateMany({ id: {$in: ids.split(',')} }, { categoryId }).then(data => {
        if(data.ok === 1) {
            res.json({Code: 0, Data: true, Msg: 'success'})
        }else {
            res.json({code: 1, msg: '服务器出错了'})
        }
    }).catch(err => {
        res.json({code: 1, msg: '服务器出错了'})
    })
})

// 删除图片
Router.post('/delPic', (req, res) => {
    const { ids } = req.body
    Pic.remove({ id: {$in: ids} }).then(data => {
        if(data.ok === 1) {
            res.json({Code: 0, Data: true, Msg: 'success'})
        }else {
            res.json({code: 1, msg: '服务器出错了'})
        }
    }).catch(err => {
        res.json({code: 1, msg: '服务器出错了'})
    })
})

// 上传网络图片
Router.post('/uploadWebImg', (req, res) => {
    const { imgSrc, categoryId } = req.body
    Pic.find({}).then(aData => {
        let id = aData.length ? aData[aData.length - 1].id : -1
        id++
        Pic.create({ categoryId, fileSize: '1550', path: imgSrc, id, name: `网络图片${id}` }).then(data => {
            res.json({Code: 0, Data: true, Msg: 'success'})
        }).catch(err => {
            res.json({code: 1, msg: '服务器出错了'})
        })
    })
})

module.exports = Router