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
            this.setState({ pageConfig: res.data })
        })
    }
    render() {
        const content = this.state.pageConfig.FormsCookieName ? <App {...this.state.pageConfig} /> : null
        return content
    }
}