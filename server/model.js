const mongoose = require('mongoose')
const DB_URL = 'mongodb://localhost:27017/gallery'
mongoose.connect(DB_URL)
mongoose.Promise = global.Promise
const models = {
    capacity: {
        percent: Number,
        totalSize: String,
        usedSpace: String
    },
    category: {
        categoryName: String,
        id: Number
    },
    pic: {
        categoryId: Number,
        fileSize: Number,
        path: String,
        id: Number,
        name: String
    },
    user: {
        name: String,
        avatar: String
    }
}

for(let m in models) {
    mongoose.model(m, new mongoose.Schema(models[m]))
}
module.exports = {
    getModel: name =>  mongoose.model(name)
}
