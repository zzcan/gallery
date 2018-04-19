const express = require('express');
const path = require('path')
const proxy = require('http-proxy-middleware');//引入代理中间件
const app = express();
app.use(express.static(path.resolve(__dirname, '../build')))
 
// Add middleware for http proxying
const apiProxy = proxy('/image', { target: 'http://tulocal.xiaokeduo.com',changeOrigin: true });
app.use('/image/*', apiProxy);//api子目录下的都是用代理
 
// Render your site
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build/index.html'));
})
 

app.listen(1111, () => {
  console.log('Listening on: http://localhost:1111');
});