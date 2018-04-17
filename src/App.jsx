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
    Upload,
    message,
    Select,
    Spin,
    Popover
} from 'antd';
import axios from 'axios';
import { CopyToClipboard } from 'react-copy-to-clipboard';   //复制到剪切板插件
import './css/App.css';
import './config';
const { Header, Sider, Content } = Layout;

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: true,  //全局loading
            listLoading: false, //列表加载loading

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
            moveCateModalVisible: false, //移动分组弹窗
            previewModalVisible: false, //图片预览弹窗
            previewImage: '', //要预览的图片
            isLimit: false,

            renamePopover: false,  //图片改名popover
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
                return this.getList({ categoryId: id, pageIndex: 1, pageSize: 10 });
            }
        }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    loading: false,
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                });
            }
        })
    }
    /**
     * 选中分组的回调
     * @param {选中的分组id} id 
     */
    handleMenuChange(id) {
        const { categories, pageSize, selectedCategory } = this.state;
        if (selectedCategory.id === id) return;
        this.setState({
            selectedCategory: categories.filter(item => item.id === id)[0],
            listLoading: true,
        });
        this.getList({ categoryId: id, pageIndex: 1, pageSize }).then(res => {
            this.setState({ listLoading: false });
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                });
            }
        })
    }
    //添加分组
    handleAddCategory(e) {
        const { iptCategoryName } = this.state;
        if (!iptCategoryName || iptCategoryName.length > 6) {
            this.handleCancel('addModal');
            message.error(!iptCategoryName ? '分组名不能为空!' : '输入的分组名长度不能超过6位!');
            return;
        }
        this.setState({ confirmLoading: true });
        this.addCategory({ categoryName: iptCategoryName }).then(res => {
            if (res.data.Code === 0) {
                this.handleCancel('addModal');
                this.setState({
                    selectedCategory: res.data.Data,
                    categories: [...this.state.categories, res.data.Data],
                    confirmLoading: false,
                    imgList: [],
                    imgTotal: 0
                })
            }
        })
    }
    // 分组重命名
    handleCateRename() {
        const { iptCateName, selectedCategory, categories } = this.state;
        if (!iptCateName && selectedCategory.id === 0) {
            message.error(!iptCateName ? '修改的名称不能为空!' : '未分组不能更改名称!');
            return;
        }
        this.setState({ confirmLoading: true });
        this.reName({ id: selectedCategory.id, name: iptCateName }).then(res => {
            if (res.data.Code === 0) {
                const { id, categoryName } = res.data.Data;
                categories.forEach(v => {
                    if (v.id === id) v.categoryName = categoryName
                })
                this.setState({
                    categories,
                    confirmLoading: false
                })
            }
        })
    }
    // popover取消按钮
    handleCancelPopover(type, ipt) {
        this.setState({
            [`${type}Popover`]: false,
            [ipt]: ''
        })
    }
    // 图片重命名
    renamePics(type, id) {
        const { selectListIds, iptPicName, imgList } = this.state;
        if (!iptPicName) return message.error('请输入图片名!');
        let ids = type ? id + '' : selectListIds.join(',');
        this.setState({ confirmLoading: true });
        this.picRename({ ids, name: iptPicName }).then(res => {
            if (res.data.Code === 0) {
                message.success('修改图片名称成功!');
                let arr = type ? [id] : selectListIds;
                imgList.forEach(v => {
                    if (arr.includes(v.id)) {
                        v.name = iptPicName
                    }
                })
                this.setState({
                    imgList,
                    renamePopover: false,
                    iptPicName: '',
                    confirmLoading: false,
                })
            }
        })
    }
    // 删除分组
    handleDeleteCategory() {
        const { selectedCategory, categories } = this.state;
        if (selectedCategory.id === 0) {
            message.error('未分组不能删除!');
            return;
        }
        const modalRef = Modal.confirm({
            title: '确定删除该分组吗?',
            content: '若删除,当前分组内的图片将一同删除!',
            cancelText: '取消',
            okText: '确定',
            okType: 'danger',
            onCancel() {
                modalRef.destroy();
            },
            onOk: () => {
                this.delCategory({ categoryId: selectedCategory.id }).then(res => {
                    if (res.data.Code === 0) {
                        this.setState({
                            categories: categories.filter(v => v.id !== selectedCategory.id),
                            selectedCategory: categories[0],
                            listLoading: true,
                        });
                        modalRef.destroy();
                        message.success('删除分组成功！')
                        return this.getList({ categoryId: categories[0].id, pageIndex: 1, pageSize: 10 });
                    }
                }).then(res => {
                    if (res.data.Code === 0) {
                        this.setState({
                            imgList: res.data.Data.data,
                            imgTotal: res.data.Data.total,
                            listLoading: false,
                        });
                    }
                })
            },
        });
    }
    // 搜索图片  当前分组下搜索图片
    handleSearchPic(value) {
        const { selectedCategory } = this.state;
        this.setState({ listLoading: true });
        this.getList({ categoryId: selectedCategory.id, searchName: value, pageIndex: 1, pageSize: 10 }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                    listLoading: false,
                });
            }
        })
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
        const { selectListIds, imgList } = this.state;
        let index = selectListIds.findIndex(v => v === id);
        if (index > -1) {
            selectListIds.splice(index, 1);
            this.setState({ selectListIds, allChecked: false });
        } else {
            this.setState({
                selectListIds: [...selectListIds, id],
                allChecked: selectListIds.length + 1 === imgList.length,   //判断是否全部选中
            });
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
    //复制图片链接
    handleCopyLink(text, result) {
        message.success('复制链接成功!');
    }
    //移动图片至新分组的弹窗中 分组选择框选中回调
    handleCateChange(value) {
        this.setState({ movedCategoryId: value });
    }
    //移动图片至新分组弹窗确定按钮回调
    handleMoveCate() {
        const { movedCategoryId, selectedCategory, selectListIds } = this.state;
        if (!selectListIds.length) return message.error('请选择需要移动分组的图片');
        if (movedCategoryId === null || movedCategoryId === undefined) {
            this.handleCancel('moveCateModal');
            message.error('请选择分组!');
            return;
        }
        if (movedCategoryId === selectedCategory.id) {
            this.handleCancel('moveCateModal');
            message.error('已在该分组内!');
            return;
        }
        this.setState({ confirmLoading: true });
        this.moveCategory({ categoryId: movedCategoryId, ids: selectListIds.join(',') }).then(res => {
            if (res.data.Code === 0) {
                this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize: 10 }).then(res => {
                    this.setState({
                        imgList: res.data.Data.data,
                        imgTotal: res.data.Data.total,
                        confirmLoading: false,
                        moveCateModalVisible: false,
                        selectListIds: [],
                        allChecked: false,
                    });
                })
            }
        })
    }
    /**
     * 删除图片
     * @param {存在传进来的ids则表示单个图片的删除} ids 
     */
    handleDeletePic() {
        const { selectListIds, selectedCategory, pageIndex, pageSize } = this.state;
        // 批量删除且并未有任何图片选中
        if (!selectListIds.length) return message.error('请选择需要删除的图片');
        const modalRef = Modal.confirm({
            title: '确定删除图片吗?',
            content: '若删除，目前已使用该图片的相关业务会受影响!',
            cancelText: '取消',
            okText: '确定',
            okType: 'danger',
            onCancel() {
                modalRef.destroy();
            },
            onOk: () => {
                modalRef.destroy();
                this.delPic({ ids: selectListIds.join(',') }).then(res => {
                    if (res.data.Code === 0) {
                        message.success('删除图片成功!');
                        this.getList({ categoryId: selectedCategory.id, pageIndex, pageSize }).then(res => {
                            this.setState({
                                imgList: res.data.Data.data,
                                imgTotal: res.data.Data.total,
                                allChecked: false,
                            });
                        })
                    }
                })
            },
        });
    }
    /**
     * 显示弹窗
     * @param {弹窗类型} type 
     */
    showModal({ type,selectedPicLink = null, previewImage = '' }) {
        this.setState({
            [`${type}Visible`]: true,
            selectedPicLink,
            previewImage,
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
     * 弹窗完全关闭后的回调  重置弹窗内输入框的内容
     * @param {弹窗中输入框的引用} input
     */
    handleModalClose(input) {
        this.setState({
            [input]: null,
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
    // 上传网络图片
    handleUploadWebImg() {
        const { webImg, pageSize, selectedCategory } = this.state;
        if (!webImg) {
            message.error('请输入需要提取的网络图片!');
            return;
        }
        this.uploadWebImg({ imgSrc: webImg, categoryId: selectedCategory.id }).then(res => {
            if (res.data.Code === 0) {
                this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize }).then(res => {
                    if (res.data.Code === 0) {
                        message.success('上传成功!');
                        this.setState({
                            imgList: res.data.Data.data,
                            imgTotal: res.data.Data.total,
                            pageIndex: 1,
                            uploadModalVisible: false,
                        });
                    }
                })
            }
        })
    }
    // 图片上传前的回调
    handleBeforeUpload(file, fileList) {
        // 图片上传前验证其大小
        const MAXFILESIZE = 5;
        const isLtMax = file.size / 1024 / 1024 < MAXFILESIZE;
        if (!isLtMax) {
            message.error(`文件大小超过${MAXFILESIZE}M限制`);
        }
        return isLtMax;
    }
    // 图片上传改变的状态
    handleUploadChange({ fileList }) {
        // let fileList = e.fileList.map(file => {
        //     if (file.response) {
        //         //上传结束之后会调用的方法
        //         if (file.response.Code === 0) {
        //             return {...file, id: file.response.Data.id}
        //         }
        //     }
        //     return file;
        // });
        this.setState({ fileList });
    }
    // 已上传的图片移除
    handleImgRemove(file) {
        const { response } = file;
        if (response && response.Code === 0) {
            this.delPic({ ids: [response.Data.id] }).then(res => {
                if (res.data.Code === 0) {
                    console.log('pic delete success')
                }
            })
        }
    }
    // 上传图片弹窗取消按钮操作
    handleUploadModalClose(type) {
        const { fileList, selectedCategory } = this.state;
        if (type === 'cancel') {
            let ids = [];
            fileList.forEach(file => {
                if (file.response && file.response.Code === 0) ids.push(file.response.Data.id);
            })
            if (ids.length > 0) {
                this.delPic({ ids }).then(res => {
                    if (res.data.Code === 0) {
                        console.log('pics delete success')
                    }
                });
            }
        }
        this.setState({
            fileList: [],
            uploadModalVisible: false,
            allChecked: false,
            selectListIds: [],
        });
        this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize: 10 }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                });
            }
        })
    }
    // 图片替换
    handleReplacePic({ file }) {
        if (file.response && file.response.Code === 0) {
            message.success('图片替换成功！')
            let { imgList } = this.state;
            const { id } = file.response.Data;
            imgList = imgList.map(v => {
                if (v.id === id) return { ...v, ...file.response.Data };
                return v;
            });
            this.setState({ imgList })
        } else if (file.response && file.response.Code !== 0) {
            message.success('图片替换失败！')
        }
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
     * @param {categoryId, searchName 可选, pageIndex, pageSize} options 
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
     * 修改分组名
     * @param {id, name} options 
     */
    categoryRename(options) {
        return axios.post('/gallery/categoryRename', options);
    }
    /**
    * 修改分组名
    * @param {ids,name} options 
    */
    picRename(options) {
        return axios.post('/gallery/picRename', options);
    }
    /**
     * 删除分组
     * @param {categoryId} options 
     */
    delCategory(options) {
        return axios.post('/gallery/delCategory', options);
    }
    /**
     * 移动图片至新分组
     * @param {categoryId 新分组id, id 图片id} options 
     */
    moveCategory(options) {
        return axios.post('/gallery/moveCategory', options);
    }
    /**
     * 删除图片
     * @param {ids图片id数组} options 
     */
    delPic(options) {
        return axios.post('/gallery/delPic', options);
    }
    /**
   * 上传网络图片
   * @param {imgSrc 网络图片路径} options 
   */
    uploadWebImg(options) {
        return axios.post('/gallery/uploadWebImg', options);
    }
    render() {
        const {
            loading,
            listLoading,
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
            moveCateModalVisible,
            previewModalVisible,
            previewImage,
            confirmLoading,
            fileList,
            allChecked,
            selectedPicLink,
            iptCategoryName,
            iptPicName,
            webImg,
            renamePopover,
        } = this.state;
        return (
            <Layout className="basic-layout">
                <Spin className="basic-spin" spinning={loading} size="large" />
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
                        <Menu
                            className="menu"
                            defaultSelectedKeys={['0']}
                            selectedKeys={selectedCategory ? [`${selectedCategory.id}`] : ['0']}
                            mode="inline"
                            onClick={({ key }) => { this.handleMenuChange(Number(key)) }}
                        >
                            {
                                categories.map(v => (
                                    <Menu.Item className="menu-item" key={v.id + ''}>{v.categoryName}</Menu.Item>
                                ))
                            }
                        </Menu>
                        <div className="add-btn" onClick={e => this.showModal({ type: 'addModal' })}>
                            <Icon type="plus" />
                            <span className="btn-text">添加分组</span>
                        </div>
                        {/* 添加分组弹窗 */}
                        <Modal title="添加分组"
                            visible={addModalVisible}
                            onOk={this.handleAddCategory.bind(this)}
                            confirmLoading={confirmLoading}
                            onCancel={() => this.handleCancel('addModal')}
                            afterClose={() => this.handleModalClose('iptCategoryName')}
                        >
                            <Input placeholder="不超过6个字" value={iptCategoryName} onChange={e => this.handleInput('iptCategoryName', e.target.value)} />
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
                                <span className="blue-6 rename">重命名</span>
                                <span className="blue-6" onClick={() => this.handleDeleteCategory()}>删除分组</span>
                            </div>
                            <div className="header-right">
                                <Button type="primary" className="search-btn" onClick={e => this.showModal({ type: 'uploadModal' })}>上传图片</Button>
                                <Input.Search
                                    placeholder="请输入图片名称"
                                    onSearch={value => this.handleSearchPic(value)}
                                    style={{ width: 346 }}
                                />
                            </div>
                        </div>
                        <div className="oprate-tab clearfix">
                            <Checkbox className="checkbox" checked={allChecked} onChange={e => this.handleAllChecked(e)}>全选</Checkbox>
                            {
                                allChecked ?
                                    <div className="opration-text">
                                        <span onClick={() => {this.showModal({type: 'moveCateModal'})}}>修改分组</span>
                                        <Divider type="vertical" />
                                        <span onClick={this.handleDeletePic.bind(this)}>删除</span>
                                    </div>
                                    :
                                    null
                            }

                        </div>
                        <div className="pic-container">
                            {<Spin className="list-spin" spinning={listLoading} size="large" />}
                            {
                                imgList.length ?
                                    imgList.map(item => (
                                        <div
                                            className={selectListIds.includes(item.id) ? 'pic-item active' : 'pic-item'}
                                            key={item.id}
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
                                            <div className="pic-box" onClick={e => this.handleListClick(item.id)}>
                                                <img src={item.path} alt="" />
                                                <div
                                                    className={item.isMouseEnter ? 'preview-label mouse-enter' : 'preview-label'}
                                                >
                                                    {item.name}
                                                </div>
                                            </div>
                                            <div className="btns">
                                                <Popover
                                                    className="renamePopover"
                                                    content={
                                                        <div>
                                                            <Input placeholder="请输入名称" value={iptPicName} onChange={e => this.handleInput('iptPicName', e.target.value)} />
                                                            <div className="popover-btns">
                                                                <Button size="small" onClick={() => { this.handleCancelPopover('rename', 'iptPicName') }}>取消</Button>
                                                                <Button size="small" loading={confirmLoading} onClick={() => { this.renamePics(true, item.id) }} type="primary" style={{ marginLeft: 10 }}>确定</Button>
                                                            </div>
                                                        </div>
                                                    }
                                                    title="修改名称"
                                                    trigger="click"
                                                    visible={renamePopover}
                                                    onVisibleChange={visible => this.setState({ renamePopover: visible })}
                                                >
                                                    <span className="btn-item">改名</span>
                                                </Popover>
                                                <Upload
                                                    style={{ lineHeight: 1 }}
                                                    className="btn-item"
                                                    showUploadList={false}
                                                    accept="image/jpg,image/jpeg,image/png,image/bmp"
                                                    name={`&${item.id}`}
                                                    action="/upload"
                                                    beforeUpload={this.handleBeforeUpload.bind(this)}
                                                    onChange={this.handleReplacePic.bind(this)}
                                                >
                                                    <span>替换</span>
                                                </Upload>
                                                <CopyToClipboard
                                                    className="btn-item"
                                                    text={item.path}
                                                    onCopy={(text, result) => this.handleCopyLink(text, result)}
                                                >
                                                    <span>复制</span>
                                                </CopyToClipboard>
                                                <span className="btn-item" onClick={() => {this.showModal({ type: 'previewModal', previewImage: item.path, selectedPicLink: item.path })}}>查看</span>
                                            </div>
                                        </div>
                                    ))
                                    :
                                    imgTotal === null
                                        ?
                                        null
                                        :
                                        <div className="list-empty-box">
                                            <div className="list-empty-img"></div>
                                            <div>该分类下数据为空~</div>
                                        </div>
                            }
                        </div>
                        {
                            imgList.length ?
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
                                :
                                null
                        }

                    </Content>
                </Layout>
                {/* 图片预览 复制链接 下载 */}
                <Modal
                    className="preview-modal"
                    visible={previewModalVisible}
                    footer={null}
                    onCancel={() => this.handleCancel('previewModal')}
                >
                    <img alt="" src={previewImage} />
                    <div className="row">
                        <Input defaultValue={selectedPicLink} disabled />
                        <Button href={selectedPicLink} download={selectedPicLink} style={{ marginLeft: 8 }}>下载</Button>
                    </div>
                </Modal>
                {/* 图片移动分组弹窗 */}
                <Modal title="分组:"
                    visible={moveCateModalVisible}
                    onOk={() => this.handleMoveCate()}
                    confirmLoading={confirmLoading}
                    onCancel={() => this.handleCancel('moveCateModal')}
                >
                    <Select
                        showSearch
                        style={{ width: 400 }}
                        placeholder="选择分组"
                        optionFilterProp="children"
                        onChange={value => this.handleCateChange(value)}
                        filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                    >
                        {
                            categories.map(v => <Select.Option value={v.id} key={v.id}>{v.categoryName}</Select.Option>)
                        }
                    </Select>
                </Modal>
                {/* 图片上传弹窗 */}
                <Modal
                    title="本地上传"
                    visible={uploadModalVisible}
                    confirmLoading={confirmLoading}
                    onCancel={() => this.handleUploadModalClose('cancel')}
                    onOk={() => this.handleUploadModalClose('confirm')}
                    className="upload-modal"
                    width="888px"
                    afterClose={() => { this.handleModalClose('webImg'); }}
                >
                    <div className="row">
                        <span className="label">网络图片:</span>
                        <Input
                            style={{ width: 400, marginRight: 6 }}
                            value={webImg}
                            onChange={e => this.setState({ webImg: e.target.value })}
                            placeholder="请添加网络图片地址"
                        />
                        <Button onClick={this.handleUploadWebImg.bind(this)}>提取</Button>
                    </div>
                    <div className="clearfix" style={{ height: '100%' }}>
                        <span style={{ float: 'left', marginRight: 8, height: '100%' }}>选择图片:</span>
                        <Upload
                            className="upload-box"
                            action="/upload"
                            listType="picture-card"
                            multiple
                            name={selectedCategory ? selectedCategory.id + '' : '0'}
                            accept="image/jpg,image/jpeg,image/png,image/bmp"
                            fileList={fileList}
                            showUploadList={{ showPreviewIcon: false }}
                            beforeUpload={this.handleBeforeUpload.bind(this)}
                            onChange={this.handleUploadChange.bind(this)}
                            onRemove={this.handleImgRemove.bind(this)}
                        >
                            {
                                fileList.length >= 10 ?
                                    null
                                    :
                                    <div><Icon type="plus" /></div>
                            }
                        </Upload>
                        <div style={{ marginLeft: 66, color: '#bfbfbf' }}>仅支持gif，jpeg，png，bmp4种格式，大小不超过5.0MB</div>
                    </div>

                </Modal>
            </Layout>
        );
    }
}

export default App;