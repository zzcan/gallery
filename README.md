# pic-space

## antd

按需加载

安装babel依赖包
`npm install babel-plugin-import --save`

babel配置中设置

``` js
{
  "plugins": [
    ["import", { libraryName: "antd-mobile", style: "css" }] // `style: true` 会加载 less 文件
  ]
}
```