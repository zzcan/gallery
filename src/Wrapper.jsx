import React, { Component } from 'react';
import axios from 'axios';
import App from './App';
import { getUserInfo, getOemConfig } from './api';

export default class Wrapper extends Component {
    constructor() {
        super()
        this.state = {
            pageConfig: {},
            user: {}
        }
    }
    componentDidMount() {
        getOemConfig().then(res => {
            // 添加ico
            let link = document.createElement("link");
            link.href = res.data.IcoUrl;
            link.rel = "shortcut icon";
            document.head.appendChild(link);
            this.setState({ pageConfig: res.data });
            window.sessionStorage.setItem("config", JSON.stringify(res.data));
        })
        getUserInfo().then(res => {
            this.setState({ user: res.data.Data });
            window.sessionStorage.setItem('mid', res.data.Data.mid);
        })
    }
    render() {
        const content = this.state.user.mid ? <App {...this.state.pageConfig} user={this.state.user}/> : null
        return content
    }
}