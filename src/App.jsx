import React, { Component } from 'react';
import {
    Layout,
    Divider,
    Avatar,
    Menu,
    Input,
    Progress,
    Icon,
    Button,
    Checkbox,
    Pagination,
    Modal,
    Upload
} from 'antd';
import axios from 'axios';
import './css/App.css';
const { Header, Sider, Content } = Layout;

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            user: {},
            categories: [],  //分组列表

            pageIndex: 1,
            pageSize: 10,
            imgList: [],  //图片列表
            imgTotal: null,
            selectListIds: [],  //选中的图片id数组
            allChecked: false,  //全选按钮

            selectedCategory: null,  //选中的分组

            confirmLoading: false,  //弹窗确定时loading
            fileList: [],   //已上传图片的列表

            uploadModalVisible: false,  //上传图片弹窗
            addModalVisible: false,     //添加分组弹窗
            renameModalVisible: false,  //重命名弹窗
            // delCategoryModalVisible: false, 删除分组弹窗
        }
    }
    componentWillMount() {
        this.getUserInfo().then(res => {
            if (res.data.Code === 0) {
                this.setState({ user: res.data.Data });
            }
        })
        this.getCategory().then(res => {
            if (res.data.Code === 0) {
                const { categoryName, id } = res.data.Data[0];
                this.setState({
                    categories: res.data.Data,
                    selectedCategory: { categoryName, id }
                });
            }
        })
        this.getList({ categoryId: 0, pageIndex: 1, pageSize: 10 }).then(res => {
            if (res.data.Code === 0) {
                this.setState({ imgList: res.data.Data.data, imgTotal: res.data.Data.total });
            }
        })
    }
    /**
     * 选中分组的回调
     * @param {选中的分组id} id 
     */
    handleMenuChange(id) {
        const { categories, pageSize } = this.state;
        this.setState({ selectedCategory: categories.filter(item => item.id === id)[0] });
        this.getList({ categoryId: id, pageIndex: 1, pageSize }).then(res => {
            if (res.data.Code === 0) {
                this.setState({ imgList: res.data.Data.data, imgTotal: res.data.Data.total });
            }
        })
    }
    //添加分组
    handleAddCategory(e) {
        const { iptCategoryName } = this.state;
        if (!iptCategoryName) {
            this.handleCancel('addModal');
            const modalRef = Modal.error({
                title: '错误提示',
                content: '分组名不能为空!',
            });
            setTimeout(modalRef.destroy, 3000)
            return;
        }
        this.setState({ confirmLoading: true });
        this.addCategory({ categoryName: iptCategoryName }).then(res => {
            if (res.data.Code === 0) {
                this.handleCancel('addModal');
                this.setState({
                    categories: [...this.state.categories, res.data.Data],
                    confirmLoading: false
                })
            }
        })
    }
    //处理重命名
    handleRename(type) {
        const { iptCategoryRename, selectedCategory, categories } = this.state;
        if (!iptCategoryRename || selectedCategory.id === 0) {
            this.handleCancel('renameModal');
            const modalRef = Modal.error({
                title: '错误提示',
                content: selectedCategory.id === 0 ? '未分组不能更改名称!' : '修改的名称不能为空!',
            });
            setTimeout(modalRef.destroy, 3000)
            return;
        }
        this.setState({ confirmLoading: true });
        const options = {
            category: {
                id: selectedCategory.id,
                name: iptCategoryRename,
                type
            },
            file: {}
        }
        this.reName(options[type]).then(res => {
            if(res.data.Code === 0) {
                this.handleCancel('renameModal');
                const { id, categoryName } = res.data.Data;
                categories.forEach(v => {
                    if(v.id === id) v.categoryName = categoryName
                })
                this.setState({
                    categories,
                    confirmLoading: false
                })
            }
        })
    }
    // 删除分组
    handleDeleteCategory() {
        const { selectedCategory } = this.state;
        const modalRef = Modal.confirm({
            title: '确定删除该分组吗?',
            content: '若删除,当前分组内的图片将一同删除!',
            cancelText: '取消',
            okText: '确定',
            okType: 'danger',
            onCancel() {
                modalRef.destroy();
            },
            onOk() {
                console.log('yes')
            }
        });
    }
    /**
     * 处理各种弹窗输入框内容  
     * @param {输入框类型} type 
     * @param {输入框的值} value 
     */
    handleInput(type, value) {
        this.setState({ [type]: value })
    }
    // 点击列表中的图片
    handleListClick(id) {
        const { selectListIds } = this.state;
        let index = selectListIds.findIndex(v => v === id);
        if (index > -1) {
            selectListIds.splice(index, 1);
            this.setState({ selectListIds });
        } else {
            this.setState({ selectListIds: [...selectListIds, id] });
        }
    }
    // 鼠标移上图片效果
    handleListEnter(e, id) {
        const { imgList } = this.state;
        imgList.forEach(item => {
            if (item.id === id) item.isMouseEnter = true;
        })
        this.setState({ imgList })
    }
    // 鼠标离开图片效果
    handleListLeave(e) {
        const { imgList } = this.state;
        imgList.forEach(item => {
            item.isMouseEnter = false;
        })
        this.setState({ imgList })
    }
    // 全选按钮
    handleAllChecked(e) {
        const { imgList } = this.state;
        let { checked } = e.target;
        const selectListIds = checked ? imgList.map(v => v.id) : [];
        this.setState({
            allChecked: e.target.checked,
            selectListIds,
        })
    }
    /**
     * 显示弹窗
     * @param {弹窗类型} type 
     */
    showModal(type) {
        this.setState({
            [`${type}Visible`]: true,
        });
    }
    /**
     * 隐藏弹窗
     * @param {弹窗类型} type 
     */
    handleCancel(type) {
        this.setState({
            [`${type}Visible`]: false,
        });
    }
    /**
     * pageSize 变化的回调
     * @param {当前页数} currentPage 
     * @param {改变后的pageSize} size 
     */
    handleSizeChange(currentPage, size) {
        const { selectedCategory } = this.state;
        this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize: size }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                    pageIndex: 1,
                    pageSize: size
                });
            }
        })
    }
    // 文件状态改变回调
    handleUploadChange(obj) {
        console.log(obj);
    }
    // 获取用户信息
    getUserInfo() {
        return axios.get('/gallery/getUserInfo');
    }
    // 获取分组
    getCategory(options) {
        return axios.get('/gallery/getCategory');
    }
    /**
     * 获取图片列表
     * @param {categoryId, searchName, pageIndex, pageSize} options 
     */
    getList(options) {
        return axios.get('/gallery/getList', { params: options });
    }
    /**
     * 添加分组
     * @param {categoryName} options 
     */
    addCategory(options) {
        return axios.post('/gallery/addCategory', options);
    }
    /**
     * 修改分组名或图片名
     * @param {id, name, type} options 
     */
    reName(options) {
        return axios.post('/gallery/reName', options);
    }
    /**
     * 删除分组
     * @param {categoryId} options 
     */
    delCategory(options) {
        return axios.post('/gallery/delCategory', options);
    }
    render() {
        const {
            categories,
            user,
            pageIndex,
            pageSize,
            imgList,
            imgTotal,
            selectListIds,
            selectedCategory,
            uploadModalVisible,
            addModalVisible,
            renameModalVisible,
            confirmLoading,
            fileList,
            allChecked,
        } = this.state;
        return (
            <Layout className="basic-layout">
                <Header className="header">
                    <div className="logo-box">
                        <div className="logo"></div>
                        <Divider type="vertical" />
                        <span className="font-16">图片管理</span>
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
                        <Menu className="menu" defaultSelectedKeys={['0']} mode="inline" onClick={({ key }) => {
                            this.handleMenuChange(Number(key))
                        }}>
                            {
                                categories.map(v => (
                                    <Menu.Item className="menu-item" key={v.id + ''}>{v.categoryName}</Menu.Item>
                                ))
                            }
                        </Menu>
                        <div className="add-btn" onClick={e => this.showModal('addModal')}>
                            <Icon type="plus" />
                            <span className="btn-text">添加分组</span>
                        </div>
                        {/* 添加分组弹窗 */}
                        <Modal title="添加分组"
                            visible={addModalVisible}
                            onOk={this.handleAddCategory.bind(this)}
                            confirmLoading={confirmLoading}
                            onCancel={() => this.handleCancel('addModal')}
                        >
                            <Input placeholder="不超过6个字" onChange={e => this.handleInput('iptCategoryName', e.target.value)} />
                        </Modal>
                        <div className="capacity">
                            <Progress type="dashboard" percent={75} width={48} />
                            <span className="capacity-text">25GB/120GB</span>
                            <span className="blue-6" style={{ cursor: 'pointer' }}>扩容</span>
                        </div>
                    </Sider>
                    <Content className="content clearfix">
                        <div className="content-header clearfix">
                            <div className="header-left">
                                <span className="font-18 color-26">{selectedCategory ? selectedCategory.categoryName : ''}</span>
                                <span className="blue-6 rename" onClick={() => this.showModal('renameModal')}>重命名</span>
                                <span className="blue-6" onClick={() => this.handleDeleteCategory()}>删除分组</span>
                            </div>
                            <div className="header-right">
                                <Button type="primary" className="search-btn" onClick={(e) => this.showModal('uploadModal')}>上传图片</Button>
                                <Input.Search
                                    placeholder="请输入图片名称"
                                    onSearch={value => console.log(value)}
                                    style={{ width: 346 }}
                                />
                            </div>
                        </div>
                        <div className="oprate-tab clearfix">
                            <Checkbox onChange={(e) => this.handleAllChecked(e)}>全选</Checkbox>
                            {
                                allChecked ?
                                    <div className="opration-text">
                                        <span>修改分组</span>
                                        <Divider type="vertical" />
                                        <span>删除</span>
                                    </div>
                                    :
                                    null
                            }

                        </div>
                        <div className="pic-container">
                            {
                                imgList.length ?
                                    imgList.map(item => (
                                        <div
                                            className={selectListIds.includes(item.id) ? 'pic-item active' : 'pic-item'}
                                            key={item.id}
                                            onClick={e => this.handleListClick(item.id)}
                                            onMouseEnter={e => this.handleListEnter(e, item.id)}
                                            onMouseLeave={e => this.handleListLeave(e)}
                                        >
                                            {
                                                selectListIds.includes(item.id) ?
                                                    <div className="selected" >
                                                        <Icon type="check" style={{ fontSize: 18 }} />
                                                    </div>
                                                    :
                                                    null
                                            }
                                            <div className="pic-box">
                                                <img src="https://xkdsaas.oss-cn-shanghai.aliyuncs.com/MerChant/2905/1260/1519844399969.jpg" alt="" />
                                                <div className={item.isMouseEnter ? 'preview-label mouse-enter' : 'preview-label'}>
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
                            defaultCurrent={1}
                            pageSize={pageSize}
                            current={pageIndex}
                            total={imgTotal}
                            onChange={(page, pageSize) => console.log(page, pageSize)}
                            onShowSizeChange={(current, size) => this.handleSizeChange(current, size)}
                        />
                    </Content>
                </Layout>
                {/* 分组或图片重命名弹窗 */}
                <Modal title="修改名称"
                    visible={renameModalVisible}
                    onOk={() => this.handleRename('category')}
                    confirmLoading={confirmLoading}
                    onCancel={() => this.handleCancel('renameModal')}
                >
                    <Input placeholder="请输入名称" onChange={e => this.handleInput('iptCategoryRename', e.target.value)} />
                </Modal>
                <Modal
                    title="本地上传"
                    visible={uploadModalVisible}
                    onOk={() => console.log(111)}
                    confirmLoading={confirmLoading}
                    onCancel={() => this.handleCancel('uploadModal')}
                    className="upload-modal"
                    width="888px"
                >
                    <div className="row">
                        <span className="label">网络图片:</span>
                        <Input style={{ width: 400, marginRight: 6 }} placeholder="请添加网络图片地址" />
                        <Button>提取</Button>
                    </div>
                    <div className="row">
                        <span className="label">选择商品:</span>
                        <Upload
                            action="//jsonplaceholder.typicode.com/posts/"
                            listType="picture-card"
                            fileList={fileList}
                            onChange={this.handleUploadChange.bind(this)}
                        >
                            {
                                fileList.length >= 3 ?
                                    null
                                    :
                                    <Icon type="plus" />
                            }
                        </Upload>
                    </div>
                    <div style={{ marginLeft: 66, color: '#bfbfbf' }}>仅支持gif，jpeg，png，bmp4种格式，大小不超过5.0MB</div>
                </Modal>
            </Layout>
        );
    }
}

export default App;