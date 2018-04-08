import React, { Component } from 'react';
import { Layout, Divider, Avatar, Menu, Input, Progress, Icon, Button, Checkbox, Pagination } from 'antd';
import axios from 'axios';
import './css/App.css';
const { Header, Sider, Content } = Layout;

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            user: {},
            categories: [],  //分组列表
            imgList: [],  //图片列表
            imgTotal: null,
            selectListId: null
        }
    }
    componentWillMount() {
        // axios.all([this.getUserInfo(), this.getCategory(), this.getList({ categoryId: 0, pageIndex: 1, pageSize: 10 })])
        //     .then(axios.spread((userRes, cateRes, listRes) => {
        //         if (userRes.data.Code === 0 && cateRes.data.Code === 0 && listRes.data.Code === 0) {
        //         }
        //     }))
        this.getUserInfo().then(res => {
            if (res.data.Code === 0) {
                this.setState({ user: res.data.Data });
            }
        })
        this.getCategory().then(res => {
            if (res.data.Code === 0) {
                this.setState({ categories: res.data.Data });
            }
        })
        this.getList({ categoryId: 0, pageIndex: 1, pageSize: 10 }).then(res => {
            if (res.data.Code === 0) {
                this.setState({ imgList: res.data.Data.data, imgTotal: res.data.Data.total });
            }
        })
    }
    handleListClick(e, id) {
        this.setState({selectListId: id})
    }
    // 获取用户信息
    getUserInfo() {
        return axios.get('/gallery/getUserInfo');
    }
    // 获取分组
    getCategory(options = {}) {
        return axios.post('/gallery/getCategory', options);
    }
    // 获取图片列表
    getList(options = {}) {
        return axios.post('/gallery/getList', options);
    }
    render() {
        const { categories, user, imgList, selectListId } = this.state;
        return (
            <Layout className="basic-layout">
                <Header className="header">
                    <div className="logo-box">
                        <div className="logo"></div>
                        <Divider type="vertical" />
                        <span>图片管理</span>
                    </div>
                    <div className="user-info">
                        {
                            user.avatar ?
                                <Avatar size="small" src={user.avatar} />
                                :
                                <Avatar size="small" icon="user" />
                        }
                        <span className="user-name color-26">{user.name || ''}</span>
                        <span className="sign-out">退出</span>
                    </div>
                </Header>
                <Layout>
                    <Sider className="sider">
                        <Menu className="menu" defaultSelectedKeys={['0']} mode="inline" onClick={({ item, key, keyPath }) => {
                            console.log(item.props.eventKey)
                        }}>
                            {
                                categories.map(v => (
                                    <Menu.Item className="menu-item" key={v.id + ''}>{v.categoryName}</Menu.Item>
                                ))
                            }
                        </Menu>
                        <div className="add-btn">
                            <Icon type="plus" />
                            <span className="btn-text">添加分组</span>
                        </div>
                        <div className="capacity">
                            <Progress type="dashboard" percent={75} width={48} />
                            <span className="capacity-text">25GB/120GB</span>
                            <span className="blue-6" style={{ cursor: 'pointer' }}>扩容</span>
                        </div>
                    </Sider>
                    <Content className="content clearfix">
                        <div className="content-header clearfix">
                            <div className="header-left">
                                <span className="font-18 color-26">{categories.length ? categories[0].categoryName : ''}</span>
                                <span className="blue-6 rename">重命名</span>
                                <span className="blue-6">删除分组</span>
                            </div>
                            <div className="header-right">
                                <Button type="primary" className="search-btn">上传图片</Button>
                                <Input.Search
                                    placeholder="请输入图片名称或分类"
                                    onSearch={value => console.log(value)}
                                    style={{ width: 346 }}
                                />
                            </div>
                        </div>
                        <div className="oprate-tab clearfix">
                            <Checkbox onChange={(e) => console.log(e.target.checked)}>全选</Checkbox>
                            <div className="opration-text">
                                <span>批量下载</span>
                                <Divider type="vertical" />
                                <span>修改分组</span>
                                <Divider type="vertical" />
                                <span>删除</span>
                            </div>
                        </div>
                        <div className="pic-container">
                            {
                                imgList.length ?
                                imgList.map(item => (
                                    <div className={item.id === selectListId ? 'pic-item active' : 'pic-item'} key={item.id} onClick={e => this.handleListClick(e, item.id)}>
                                        {
                                            item.id === selectListId ?
                                                <div className="selected" >
                                                    <Icon type="check" style={{ fontSize: 18 }} />
                                                </div>
                                                :
                                                null
                                        }
                                        <div className="pic-box">
                                            <img src="https://xkdsaas.oss-cn-shanghai.aliyuncs.com/MerChant/2905/1260/1519844399969.jpg" alt="" />
                                            <div className="preview-label">
                                                图片名称图片名称图片名称
                                                <Icon className="preview-icon" type="search" />
                                            </div>
                                        </div>
                                        <div className="btns">
                                            <span>改名</span>
                                            <span>链接</span>
                                            <span>分组</span>
                                            <span>删除</span>
                                        </div>
                                    </div>
                                ))
                                :
                                null
                            }
                        </div>
                        <Pagination
                            style={{ float: 'right' }}
                            showTotal={total => `共${total}条记录`}
                            showQuickJumper
                            showSizeChanger
                            defaultCurrent={2}
                            total={100}
                            onChange={(page, pageSize) => console.log(page, pageSize)}
                            onShowSizeChange={(current, size) => console.log(current, size)}
                        />
                    </Content>
                </Layout>
            </Layout>
        );
    }
}

export default App;