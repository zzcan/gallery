import React, { Component } from 'react';
import axios from 'axios';
import App from './App';

export default class Wrapper extends Component {
    constructor() {
        super()
        this.state = {
            pageConfig: {}
        }
    }
    componentDidMount() {
        axios.get('/ConfigAppsetting/GetConfig').then(res => {
            window.localStorage.removeItem('config');
            window.localStorage.setItem('config', JSON.stringify(res.data));
            // 添加ico
            let link = document.createElement("link");
            link.href = res.data.IcoUrl;
            link.rel = "shortcut icon";
            document.head.appendChild(link);

            this.setState({ pageConfig: res.data })
        })
    }
    componentWillUnmount() {
        window.localStorage.removeItem('count');
    }
    render() {
        const content = this.state.pageConfig.FormsCookieName ? <App {...this.state.pageConfig} /> : null
        return content
    }
}