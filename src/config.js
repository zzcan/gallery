import axios from 'axios';
import { message } from 'antd';

// 添加请求拦截器
axios.interceptors.request.use(config => {
    // 在发送请求之前做些什么
    //获取cookie
    // let cookie = getCookie('online.xiaokeduo.com');
    // let localCookie = window.localStorage.getItem("userId");
    // if(!cookie) {
    //     window.location.href = "https://passport-online.xiaokeduo.com?ReturnUrl=https://tu-online.xiaokeduo.com";
    // }else if(localCookie !== cookie) {
    //     window.localStorage.setItem("userId", cookie);   //重置缓存
    //     window.location.reload();  //刷新页面
    // }
    return config;
}, error => {
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(response => {
    // 对响应数据做点什么
    return response;
}, error => {
    // 对响应错误做点什么
    return Promise.reject(error);
});

function getCookie(name) { //获取指定名称的cookie值
    // (^| )name=([^;]*)(;|$),match[0]为与整个正则表达式匹配的字符串，match[i]为正则表达式捕获数组相匹配的数组；
    var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
    if (arr != null) {
        return unescape(arr[2]);
    }
    return null;
}