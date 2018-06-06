import axios from 'axios';
import { message } from 'antd';

// 添加请求拦截器
axios.interceptors.request.use(config => {
    // 在发送请求之前做些什么
    //请求头添加mid
    if (config.url !== '/ConfigAppsetting/GetConfig' && config.url !== '/image/getUserInfo') {
        const mid = window.sessionStorage.getItem('mid');
        config.headers['mid'] = mid;
    }
    return config;
}, error => {
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(response => {
    // 对响应数据做点什么
    //未登录
    if(response.data.Code === 403) {
        let { Protocol, PassPortDomain, GalleryDomain } = JSON.parse(window.sessionStorage.getItem("config"));
        window.location.href = `${Protocol}://${PassPortDomain}?ReturnUrl=${Protocol}://${GalleryDomain}`;
    }
    if(response.config.url !== '/ConfigAppsetting/GetConfig' && response.config.url !== '/image/getUserInfo') {
        if(response.data.Code === 304) {
            window.sessionStorage.setItem("userChange", 'change');
            window.location.reload();
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
