import React, { Component } from 'react';
import { Layout, Divider, Avatar, Menu, Input, Progress } from 'antd';
import PicList from './components/pic-list/pic-list';
import './css/App.css';
const { Header, Sider, Content } = Layout;

class App extends Component {
    render() {
        return (
            <Layout className="basic-layout">
                <Header className="header">
                    <div className="logo-box">
                        <div className="logo"></div>
                        <Divider type="vertical" />
                        <span>图片管理</span>
                    </div>
                    <div className="user-info">
                        <Avatar icon="user" />
                        <span className="user-name">无印良品</span>
                        <span className="sign-out">退出</span>
                    </div>
                </Header>
                <Layout>
                    <Sider className="sider">
                        <Menu>
                            <Menu.Item>未分组</Menu.Item>
                            <Menu.Item>分组1</Menu.Item>
                            <Menu.Item>分组2</Menu.Item>
                            <Menu.Item>分组3</Menu.Item>
                            <Menu.Item>分组4</Menu.Item>
                            <Menu.Item>分组5</Menu.Item>
                        </Menu>
                        <div className="capacity">
                            <Progress type="dashboard" percent={75} width={60} />
                            <span>25GB/120GB</span>
                            <span className="blue-6">扩容</span>
                        </div>
                    </Sider>
                    <Content className="content">
                        <div className="content-header clearfix">
                            <div className="header-left">
                                <span>未分组</span>
                                <span className="blue-6">重命名</span>
                                <span className="blue-6">删除分组</span>
                            </div>
                            <div className="header-right">
                                <Input.Search
                                    placeholder="请输入图片名称或分类"
                                    onSearch={value => console.log(value)}
                                    enterButton
                                />
                            </div>
                        </div>
                        <PicList />
                    </Content>
                </Layout>
            </Layout>
        );
    }
}

export default App;