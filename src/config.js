import axios from 'axios';
import { message, notification } from 'antd';

// 添加请求拦截器
axios.interceptors.request.use(config => {
    // 在发送请求之前做些什么
    //获取cookie
    if (config.url !== '/ConfigAppsetting/GetConfig') {
        let cookie = getCookie(config.headers.FormsCookieName);
        let localCookie = window.sessionStorage.getItem("userId");
        if (!cookie) {
            let count = window.sessionStorage.getItem('count') ? parseInt(window.sessionStorage.getItem('count')) : 0;
            if(count === 2) {
                return notification.error({
                    message: '错误提示',
                    description: '系统检测到服务器发生错误, 请重新登录！'
                });
            }
            window.sessionStorage.setItem('count', count + 1);
            let { Protocol, PassPortDomain, GalleryDomain } = JSON.parse(window.localStorage.getItem("config"));
            window.location.href = `${Protocol}://${PassPortDomain}?ReturnUrl=${Protocol}://${GalleryDomain}`;
        } else if (localCookie !== cookie) {
            window.sessionStorage.setItem("userId", cookie); //重置缓存
            if(localCookie) {
                window.sessionStorage.setItem("userChange", 'change');
            }
            window.location.reload(); //刷新页面
        }
    }
    return config;
}, error => {
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(response => {
    // 对响应数据做点什么
    if(response.config.url !== '/ConfigAppsetting/GetConfig') {
        let { Protocol, PassPortDomain, GalleryDomain } = JSON.parse(window.localStorage.getItem("config"));
        //未登录
        if(response.data.Code === 403) {
            window.sessionStorage.removeItem("userId");
            window.location.href = `${Protocol}://${PassPortDomain}?ReturnUrl=${Protocol}://${GalleryDomain}`;
        }
    }
    return response;
}, error => {
    // 对响应错误做点什么
    if(error.response.config.params && error.response.config.params['x-oss-process'] === "image/info") return Promise.reject(error);
    if(error.response.status === 500) {
        message.error('服务器错误！')
    }
    if(error.response.status === 404) {
        message.error('网络错误！')
    }
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