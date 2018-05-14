import React, { Component } from 'react';
import ReactDOM from 'react-dom';
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
    Popover,
    Tabs,
    notification,
    Row,
    Col,
} from 'antd';
import axios from 'axios';
import { CopyToClipboard } from 'react-copy-to-clipboard';   //复制到剪切板插件
import './css/App.css';
const qs = require('qs');
const { Header, Sider, Content } = Layout;

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            logoAdrees: '',

            loading: true,  //全局loading
            listLoading: false, //列表加载loading

            user: {},
            categories: [],  //分组列表
            capacity: {},

            pageIndex: 1,
            imgList: [],  //图片列表
            sortParameter: 'CreateTime_desc',
            imgTotal: null,
            selectListIds: [],  //选中的图片id数组
            allChecked: false,  //全选按钮

            selectedCategory: null,  //选中的分组

            confirmLoading: false,  //弹窗确定时loading
            fileList: [],   //已上传图片的列表

            uploadModalVisible: false,  //上传图片弹窗
            previewModalVisible: false, //图片预览弹窗
            previewImage: '', //要预览的图片
            isLimit: false,

            isTimeSort: true,  //时间排序
            isNameSort: 0,  //名称排序
            timeSortUp: false, //正序or倒序
            nameSortUp: false, //正序or倒序

            addCatePopoverVisible: false,
        }
    }
    componentDidMount() {
        // 检测是否状态发生变化
        if (window.localStorage.getItem("userChange")) {
            window.localStorage.removeItem('userChange');
            notification.warning({
                message: '账号变更提醒',
                description: '系统检测到当前登录账号发生变更，请确认无误后进行数据操作。'
            });
        }
        this.getUserInfo().then(res => {
            if (res.data.Code === 0) {
                this.setState({ user: res.data.Data });
                this.getSpace().then(res => {
                    if (res.data.Code === 0) {
                        this.setState({ capacity: res.data.Data });
                    }
                })
                this.getCategory().then(res => {
                    if (res.data.Code === 0) {
                        const { categoryName, id } = res.data.Data[0];
                        this.setState({
                            categories: res.data.Data,
                            selectedCategory: { categoryName, id }
                        }, () => {
                            //判断列表一行显示的图片个数
                            const wrapperWidth = this.refs.picWrapper.clientWidth;
                            const marginLeft = 20;
                            const picItemWidth = 180;
                            let i = Math.floor((wrapperWidth + marginLeft) / (picItemWidth + marginLeft));
                            this.setState({ pageSize: 4 * i, initPageSize: 4 * i });
                            this.getList({ categoryId: id, pageIndex: 1, pageSize: 4 * i, sortParameter: this.state.sortParameter }).then(res => {
                                if (res.data.Code === 0) {
                                    this.setState({
                                        loading: false,
                                        imgList: res.data.Data.data,
                                        imgTotal: res.data.Data.total,
                                    });
                                }
                            })
                        });
                    }
                })
            }
        })
    }
    /**
     * 选中分组的回调
     * @param {选中的分组id} id 
     */
    handleMenuChange(id) {
        const { categories, selectedCategory, initPageSize, sortParameter } = this.state;
        if (selectedCategory.id === id) return;
        this.setState({
            selectedCategory: categories.filter(item => item.id === id)[0],
            listLoading: true,
            selectListIds: [],
        });
        this.getList({ categoryId: id, pageIndex: 1, pageSize: initPageSize, sortParameter }).then(res => {
            this.setState({ listLoading: false });
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                    pageIndex: 1,
                    pageSize: initPageSize,
                });
            }
        })
    }
    // 菜单hover状态
    handleMenuItemHover(id) {
        const { categories } = this.state;
        categories.forEach(v => {
            v.menuMouseEnter = v.id === id;
        })
        this.setState({ categories })
    }
    //菜单鼠标离开状态
    handleMenuItemMleave() {
        const { categories } = this.state;
        categories.forEach(v => {
            v.menuMouseEnter = false;
            v.popoverVisible = false;
            v.delPopoverVisible = false;
            v.cateRenamePopoverVisible = false;
        })
        this.setState({ categories })
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
                    categories: [...this.state.categories, { categoryName: iptCategoryName, id: res.data.Data.id, count: 0 }],
                    confirmLoading: false,
                    addCatePopoverVisible: false,
                    iptCategoryName: '',
                    imgList: [],
                    imgTotal: 0
                })
            } else {
                message.error(res.data.Msg);
                this.setState({
                    confirmLoading: false,
                    addCatePopoverVisible: false,
                    iptCategoryName: '',
                })
            }
        }).catch(err => {
            this.setState({
                confirmLoading: false,
            })
        })
    }
    // 分组重命名
    handleCateRename(id) {
        const { iptCateName, categories } = this.state;
        if (!iptCateName || id === 0) {
            message.error(!iptCateName ? '修改的名称不能为空!' : '默认分组不能更改名称!');
            return;
        }
        if (iptCateName.length > 6) {
            message.error('名称不能超过6个字!');
            return;
        }
        this.setState({ confirmLoading: true });
        this.categoryRename({ id, name: iptCateName }).then(res => {
            if (res.data.Code === 0) {
                const { categoryId, categoryName } = res.data.Data;
                categories.forEach(v => {
                    if (v.id === categoryId) {
                        v.categoryName = categoryName;
                        v.popoverVisible = false;
                        v.cateRenamePopoverVisible = false;
                    }
                })
                this.setState({
                    categories,
                    iptCateName: '',
                })
            }
            this.setState({
                confirmLoading: false,
            })
        }).catch(err => {
            this.setState({
                confirmLoading: false,
            })
        })
    }
    // menu popover取消按钮
    handleMenuCancelPopover(type, id) {
        const { categories } = this.state;
        categories.forEach(v => {
            if (v.id === id) v[type] = false;
        })
        this.setState({ categories, iptCateName: '' });
    }
    // list popover取消按钮
    handleListCancelPopover(id) {
        const { imgList } = this.state;
        imgList.forEach(v => {
            if (v.id === id) v.popoverVisible = false;
        })
        this.setState({ imgList, iptPicName: '' });
    }
    // 图片重命名
    renamePics(id) {
        let { iptPicName, imgList } = this.state;
        if (!iptPicName) return message.error('请输入图片名!');
        this.setState({ confirmLoading: true });
        this.picRename({ id, name: iptPicName }).then(res => {
            if (res.data.Code === 0) {
                message.success('修改图片名称成功!');
                imgList.forEach(v => {
                    if (v.id === id) {
                        v.name = iptPicName + imgList.filter(v => v.id === id)[0].suffix;
                        v.popoverVisible = false;
                    }
                })
                this.setState({
                    imgList,
                    iptPicName: '',

                    confirmLoading: false,
                })
            }
            this.setState({
                confirmLoading: false,
            })
        }).catch(err => {
            this.setState({
                confirmLoading: false,
            })
        })
    }
    // 删除分组
    handleDeleteCategory(id) {
        const { categories, initPageSize, sortParameter } = this.state;
        if (id === 0) {
            message.error('默认分组不能删除!');
            return;
        }
        this.setState({ confirmLoading: true })
        this.delCategory({ categoryId: id }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    categories: categories.filter(v => v.id !== id),
                    selectedCategory: categories[0],
                    listLoading: true,
                    confirmLoading: false,
                });
                message.success('删除分组成功！')
                return this.getList({ categoryId: categories[0].id, pageIndex: 1, pageSize: initPageSize, sortParameter });
            }
        }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                    listLoading: false,
                });
            }
        }).catch(err => {
            this.setState({
                listLoading: false,
                confirmLoading: false,
            })
        })
    }
    // 搜索图片  当前分组下搜索图片
    handleSearchPic(value) {
        const { selectedCategory, initPageSize, sortParameter } = this.state;
        this.setState({ listLoading: true });
        this.getList({ categoryId: selectedCategory.id, searchName: value, pageIndex: 1, pageSize: initPageSize, sortParameter }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                    pageSize: initPageSize
                });
            }
            this.setState({
                listLoading: false,
            })
        }).catch(err => {
            this.setState({
                listLoading: false,
            })
        })
    }
    /**
     * 处理各种弹窗输入框内容  
     * @param {输入框类型} type 
     * @param {输入框的值} value 
     */
    handleInput(type, value) {
        this.setState({ [type]: value });
    }
    // 图片列表popover
    handleListPopover(visible, id, name) {
        const { imgList } = this.state;
        let { suffix, unsuffix } = formatPicName(name);
        imgList.forEach(v => {
            v.popoverVisible = v.id === id;
            if (v.id === id) v.suffix = suffix;
        })
        this.setState({
            imgList,
            iptPicName: unsuffix
        });
    }
    // 分组popover    
    handleMenuPopover(type, visible, id, name = '') {
        const { categories } = this.state;
        categories.forEach(v => {
            v[type] = v.id === id;
        })
        this.setState({
            categories,
            iptCateName: name
        });
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
    handleListEnter(e, pic) {
        let { imgList } = this.state;
        if (pic.ossPath === undefined) {
            this.getPicInfo(pic.path, { 'x-oss-process': 'image/info' }).then(res => {
                if (res.data && res.data.ImageWidth) {
                    let ossSize = ["60", "80", "85", "100", "150", "160", "200", "300", "320", "450", "640"];
                    let ossPath = '';
                    let value = res.data.ImageWidth.value;
                    if (ossSize.includes(value)) {
                        ossPath = `${pic.path}?x-oss-process=style/${res.data.ImageWidth.value}`
                    } else {
                        value = +value;
                        let MAXS = ossSize.filter(v => v > value);
                        let MINS = ossSize.filter(v => v < value);
                        let newValue = '';
                        if (MAXS.length && MINS.length) {
                            let MAX = MAXS[0];
                            let MIN = MINS[MINS.length - 1];
                            if (MAX - value > value - MIN || MAX - value === value - MIN) {
                                newValue = MAX;
                            } else {
                                newValue = MIN;
                            }
                        } else if (!MAXS.length && MINS.length) {
                            newValue = MINS[MINS.length - 1];
                        } else if (MAXS.length && !MINS.length) {
                            newValue = MAXS[0];
                        }
                        ossPath = `${pic.path}?x-oss-process=style/${newValue}`
                    }
                    imgList.forEach(v => {
                        if (v.id === pic.id) v.ossPath = ossPath;
                    })
                    this.setState({ imgList });
                }
            }).catch(err => {
                imgList.forEach(v => {
                    if (v.id === pic.id) v.ossPath = pic.path;
                })
                this.setState({ imgList });
            });
        }
        imgList.forEach(item => {
            if (item.id === pic.id) item.isMouseEnter = true;
        })
        this.setState({ imgList })
    }
    // 鼠标离开图片效果
    handleListLeave(e) {
        const { imgList } = this.state;
        imgList.forEach(item => {
            item.isMouseEnter = false;
            item.popoverVisible = false;
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
        let movedCategoryId = value
        this.setState({
            movedCategoryId: value,
        });
        this.handleMoveCate(movedCategoryId)
    }
    //移动图片至新分组弹窗确定按钮回调
    handleMoveCate(movedCategoryId) {
        const { selectedCategory, selectListIds, initPageSize, sortParameter } = this.state;
        if (movedCategoryId === selectedCategory.id) {
            this.handleCancel('moveCateModal');
            message.error('已在该分组内!');
            return;
        }
        this.setState({ confirmLoading: true });
        this.moveCategory({ categoryId: movedCategoryId, ids: selectListIds.join(',') }).then(res => {
            if (res.data.Code === 0) {
                message.success('修改分组成功!');
                this.getCategory().then(res => {
                    if (res.data.Code === 0) {
                        const { categoryName, id } = res.data.Data[0];
                        this.setState({
                            categories: res.data.Data,
                            selectedCategory
                        });
                        this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize: initPageSize, sortParameter }).then(res => {
                            if (res.data.Code === 0) {
                                this.setState({
                                    imgList: res.data.Data.data,
                                    imgTotal: res.data.Data.total,
                                    pageSize: initPageSize,
                                    allChecked: false,
                                    selectListIds: [],
                                    confirmLoading: false,
                                });
                            }
                        });
                    }
                });
            }
        }).catch(err => {
            this.setState({
                confirmLoading: false,
            })
        })
    }
    /**
     * 删除图片
     * @param {String} ids
     */
    handleDeletePic() {
        const { selectListIds, selectedCategory, pageIndex, initPageSize, sortParameter } = this.state;
        // 批量删除且并未有任何图片选中
        if (!selectListIds.length) return message.error('请选择需要删除的图片');
        this.delPic({ ids: selectListIds.join(',') }).then(res => {
            if (res.data.Code === 0) {
                message.success('删除图片成功!');
                this.getCategory().then(res => {
                    if (res.data.Code === 0) {
                        const { categoryName, id } = res.data.Data[0];
                        this.setState({
                            categories: res.data.Data,
                            selectedCategory
                        });
                        this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize: initPageSize, sortParameter }).then(res => {
                            if (res.data.Code === 0) {
                                this.setState({
                                    imgList: res.data.Data.data,
                                    imgTotal: res.data.Data.total,
                                    pageSize: initPageSize,
                                    allChecked: false,
                                    selectListIds: [],
                                });
                            }
                        });
                    }
                });
            }
            this.setState({ picDelPopoverVisible: false })
        }).catch(err => {
            this.setState({ picDelPopoverVisible: false })
        })
    }
    /**
     * 显示弹窗
     * @param {弹窗类型} type 
     */
    showModal({ type, selectedPicLink = null, previewImage = '' }) {
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
     * 分页组件pageIndex或pageSize变化的回调
     * @param {pageIndex或pageSize} type 
     * @param {改变后的状态} size 
     */
    handlePageChange(type, page) {
        const { selectedCategory, pageSize, sortParameter } = this.state;
        const options = {
            pageIndexChange: {
                pageIndex: page,
                pageSize
            },
            pageSizeChange: {
                pageIndex: 1,
                pageSize: page
            }
        }
        this.setState({ listLoading: true });
        this.getList({ categoryId: selectedCategory.id, ...options[type], sortParameter }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                    pageIndex: options[type].pageIndex,
                    pageSize: options[type].pageSize,
                    listLoading: false
                });
            }
        })
    }
    // 上传网络图片
    handleUploadWebImg() {
        const { webImg, selectedCategory, initPageSize, sortParameter } = this.state;
        if (!webImg) {
            message.error('请输入需要提取的网络图片!');
            return;
        }
        this.uploadWebImg({ imgSrc: webImg, categoryId: selectedCategory.id }).then(res => {
            if (res.data.Code === 0) {
                this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize: initPageSize, sortParameter }).then(res => {
                    if (res.data.Code === 0) {
                        message.success('上传成功!');
                        this.setState({
                            imgList: res.data.Data.data,
                            imgTotal: res.data.Data.total,
                            pageIndex: 1,
                            pageSize: initPageSize,
                            uploadModalVisible: false,
                        });
                    } else {
                        message.success('提取网络图片失败!');
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
        // return isLtMax && fileList.length < 50;
        return isLtMax;
    }
    // 图片上传改变的状态
    handleUploadChange(info) {
        let fileList = info.fileList;
        fileList = fileList.filter(v => {
            return !!v.status;
        });
        this.setState({fileList});
    }
    // 已上传的图片移除
    handleImgRemove(file) {
        const { response } = file;
        if (response && response.Code === 0) {
            this.delPic({ ids: [response.Data.id] })
        }
    }
    // 上传图片弹窗取消按钮操作
    handleUploadModalClose(type) {
        const { fileList, selectedCategory, initPageSize, sortParameter } = this.state;
        if (type === 'cancel') {
            let ids = [];
            fileList.forEach(file => {
                if (file.response && file.response.Code === 0) ids.push(file.response.Data);
            })
            if (ids.length > 0) {
                this.delPic({ ids: ids.join(',') });
            }
        }
        this.setState({
            fileList: [],
            uploadModalVisible: false,
            allChecked: false,
            selectListIds: [],
        });
        this.getCategory().then(res => {
            if (res.data.Code === 0) {
                const { categoryName, id } = res.data.Data[0];
                this.setState({
                    categories: res.data.Data,
                    selectedCategory
                });
                this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize: initPageSize, sortParameter }).then(res => {
                    if (res.data.Code === 0) {
                        this.setState({
                            imgList: res.data.Data.data,
                            imgTotal: res.data.Data.total,
                            pageSize: initPageSize,
                        });
                    }
                });
            }
        });
    }
    // 图片替换
    handleReplacePic({ file }) {
        if (file.response && file.response.Code === 0) {
            message.success('图片替换成功！')
            const { imgList } = this.state;
            const { id } = file.response.Data;
            file.response.Data.path = `${file.response.Data.path}?x-oss-process=style/150&${Math.random() * 10000}`
            const newImgList = imgList.map(v => {
                if (v.id === id) {
                    return file.response.Data;
                }
                return v;
            });
            this.setState({ imgList: newImgList })
        } else if (file.response && file.response.Code !== 0) {
            message.error('图片替换失败！');
        }
    }
    handleReplaceImg(id) {
        const { selectedCategory } = this.state;
        if (selectedCategory.id === -1) return message.error('商品评图图片不能替换！');
        this.setState({ replaceImgId: id }, () => {
            this.replaceImgDom.click()
        })
    }
    // 列表排序
    handleTimeSort() {
        const { timeSortUp, isNameSort, isTimeSort, selectedCategory, initPageSize } = this.state;
        // CreateTime 创建时间
        // DisplayName 图片名称
        // UpdateTime  修改时间
        // FileSize 图片大小
        let sortParameter = (isTimeSort || isNameSort) && !timeSortUp ? 'CreateTime_asc' : 'CreateTime_desc';
        this.setState({
            isTimeSort: true,
            isNameSort: false,
            timeSortUp: (isTimeSort || isNameSort) && !timeSortUp ? true : false,
            sortParameter,
            listLoading: true,
        })
        this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize: initPageSize, sortParameter }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                    pageIndex: 1,
                    pageSize: initPageSize,
                    listLoading: false,
                });
            }
        })
    }
    // 名称排序
    handleNameSort() {
        const { nameSortUp, isTimeSort, isNameSort, selectedCategory, initPageSize } = this.state;
        let sortParameter = (isNameSort === 0 || isNameSort || isTimeSort) && !nameSortUp ? 'DisplayName_asc' : 'DisplayName_desc';
        this.setState({
            isNameSort: true,
            isTimeSort: false,
            nameSortUp: (isNameSort === 0 || isNameSort || isTimeSort) && !nameSortUp ? true : false,
            sortParameter,
            listLoading: true,
        })
        // categoryId, searchName 可选, pageIndex, pageSize, sortParameter
        this.getList({ categoryId: selectedCategory.id, pageIndex: 1, pageSize: initPageSize, sortParameter }).then(res => {
            if (res.data.Code === 0) {
                this.setState({
                    imgList: res.data.Data.data,
                    imgTotal: res.data.Data.total,
                    pageIndex: 1,
                    pageSize: initPageSize,
                    listLoading: false,
                });
            }
        })
    }
    handleCancelPreviewModal(e) {
        let maskDom = e.target;
        if (maskDom.className) {
            this.setState({ previewModalVisible: false })
        }
    }
    handleExpand() {
        window.localStorage.removeItem("userId");
        window.localStorage.removeItem("userChange");
        window.localStorage.removeItem("count");
        window.location.href = `${this.props.Protocol}://${this.props.SellerDomain}`
    }
    // 退出
    handleSigout() {
        window.localStorage.removeItem("userId");
        window.localStorage.removeItem("userChange");
        window.localStorage.removeItem("count");
        window.location.href = `${this.props.Protocol}://${this.props.PassPortDomain}/Sigout`
    }
    // 获取用户信息
    getUserInfo() {
        return axios.get('/image/getUserInfo', {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    // 获取分组
    getCategory(options) {
        return axios.get('/image/getCategory', {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    // 获取容量信息
    getSpace(options) {
        return axios.get('/image/getSpace', {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    /**
     * 获取图片列表
     * sortParameter  desc降序 asc升序  默认CreateTime_desc
     * CreateTime 创建时间
     * DisplayName 图片名称
     * UpdateTime  修改时间
     * FileSize 图片大小
     * @param {categoryId, searchName 可选, pageIndex, pageSize, sortParameter} options 
     */
    getList(options) {
        return axios.get('/image/getList', {
            params: options,
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    /**
     * 获取oss图片信息
     * @param {categoryId, searchName 可选, pageIndex, pageSize} options 
     */
    getPicInfo(url, options) {
        return axios.get(url, {
            params: options,
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    /**
     * 添加分组
     * @param {categoryName} options 
     */
    addCategory(options) {
        return axios.post('/image/addCategory', qs.stringify(options), {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    /**
     * 修改分组名
     * @param {id, name} options 
     */
    categoryRename(options) {
        return axios.post('/image/categoryRename', qs.stringify(options), {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    /**
    * 修改分组名
    * @param {ids,name} options 
    */
    picRename(options) {
        return axios.post('/image/picRename', qs.stringify(options), {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    /**
     * 删除分组
     * @param {categoryId} options 
     */
    delCategory(options) {
        return axios.post('/image/delCategory', qs.stringify(options), {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    /**
     * 移动图片至新分组
     * @param {categoryId 新分组id, id 图片id} options 
     */
    moveCategory(options) {
        return axios.post('/image/moveCategory', qs.stringify(options), {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    /**
     * 删除图片
     * @param {ids图片id数组} options 
     */
    delPic(options) {
        return axios.post('/image/delPic', qs.stringify(options), {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    /**
     * 上传网络图片
     * @param {imgSrc 网络图片路径} options 
     */
    uploadWebImg(options) {
        return axios.post('/image/uploadWebImg', qs.stringify(options), {
            headers: { 'FormsCookieName': this.props.FormsCookieName }
        });
    }
    render() {
        const {
            loading,
            listLoading,
            categories,
            user,
            capacity,
            pageIndex,
            pageSize,
            imgList,
            imgTotal,
            selectListIds,
            selectedCategory,
            uploadModalVisible,
            previewModalVisible,
            previewImage,
            confirmLoading,
            fileList,
            allChecked,
            selectedPicLink,
            iptCategoryName,
            iptPicName,
            webImg,
            iptCateName,
            isTimeSort,
            isNameSort,
            timeSortUp,
            nameSortUp,
            addCatePopoverVisible,
            initPageSize
        } = this.state;
        const pageSizeOptions = [`${initPageSize * 1}`, `${initPageSize * 2}`, `${initPageSize * 3}`]
        return (
            <Layout className="basic-layout">
                <Spin className="basic-spin" spinning={loading} size="large" />
                <Header className="header">
                    <div className="logo-box">
                        <div className="logo" style={{ backgroundImage: "url('" + this.props.GalleryLogo + "')" }}></div>
                        <Divider type="vertical" />
                        <span className="font-16">图片库</span>
                    </div>
                    <div className="user-info">
                        {
                            user.avatar ?
                                <Avatar size="small" src={user.avatar} />
                                :
                                <Avatar size="small" icon="user" />
                        }
                        <span className="user-name color-26">{user.name || ''}</span>
                        <span className="sign-out" onClick={() => this.handleSigout()}>退出</span>
                    </div>
                </Header>
                <Layout>
                    <Sider className="sider">
                        <Menu
                            className="menu"
                            ref="layoutMenu"
                            defaultSelectedKeys={['0']}
                            selectedKeys={selectedCategory ? [`${selectedCategory.id}`] : ['0']}
                            mode="inline"
                            onClick={({ key }) => { this.handleMenuChange(Number(key)) }}
                        >
                            {
                                categories.map(v => (
                                    <Menu.Item
                                        ref="menuItem"
                                        className="menu-item" key={v.id + ''}
                                        onMouseEnter={() => this.handleMenuItemHover(v.id)}
                                        onMouseLeave={() => this.handleMenuItemMleave()}
                                    >
                                        {v.categoryName}
                                        {
                                            v.menuMouseEnter && v.id !== 0 && v.id !== -1 ?
                                                <div style={{ float: 'right' }} onClick={e => e.stopPropagation()}>
                                                    <Popover
                                                        className="renamePopover"
                                                        content={
                                                            <div>
                                                                <Input placeholder="请输入名称" value={iptCateName} onChange={e => this.handleInput('iptCateName', e.target.value)} />
                                                                <div className="popover-btns">
                                                                    <Button size="small" onClick={() => { this.handleMenuCancelPopover('cateRenamePopoverVisible', v.id) }}>取消</Button>
                                                                    <Button size="small" loading={confirmLoading} onClick={() => { this.handleCateRename(v.id) }} type="primary" style={{ marginLeft: 10 }}>确定</Button>
                                                                </div>
                                                            </div>
                                                        }
                                                        title="修改名称"
                                                        trigger="click"
                                                        visible={v.cateRenamePopoverVisible}
                                                        onVisibleChange={visible => this.handleMenuPopover('cateRenamePopoverVisible', visible, v.id, v.categoryName)}
                                                    >
                                                        <Icon type="edit" />
                                                    </Popover>
                                                    <Popover
                                                        title="确定删除?"
                                                        content={
                                                            <div>
                                                                <div>若删除，分组内的{v.count}张图片全部转移到默认分组。</div>
                                                                <div className="popover-btns">
                                                                    <Button size="small" onClick={() => { this.handleMenuCancelPopover('delPopoverVisible', v.id) }}>取消</Button>
                                                                    <Button size="small" loading={confirmLoading} onClick={() => { this.handleDeleteCategory(v.id) }} type="primary" style={{ marginLeft: 10 }}>确定</Button>
                                                                </div>
                                                            </div>
                                                        }
                                                        trigger="click"
                                                        visible={v.delPopoverVisible}
                                                        onVisibleChange={visible => this.handleMenuPopover('delPopoverVisible', visible, v.id)}
                                                    >
                                                        <Icon type="delete" style={{ marginRight: 0 }} />
                                                    </Popover>
                                                </div>
                                                :
                                                <span style={{ float: 'right' }}>{v.count}</span>
                                        }
                                    </Menu.Item>
                                ))
                            }
                        </Menu>
                        <Popover
                            className="renamePopover"
                            content={
                                <div>
                                    <Input placeholder="不超过6个字" value={iptCategoryName} onChange={e => this.handleInput('iptCategoryName', e.target.value)} />
                                    <div className="popover-btns">
                                        <Button size="small" onClick={() => this.setState({ addCatePopoverVisible: false, iptCategoryName: '' })}>取消</Button>
                                        <Button size="small" loading={confirmLoading} onClick={this.handleAddCategory.bind(this)} type="primary" style={{ marginLeft: 10 }}>确定</Button>
                                    </div>
                                </div>
                            }
                            title="添加分组"
                            trigger="click"
                            visible={addCatePopoverVisible}
                            onVisibleChange={visible => this.setState({ addCatePopoverVisible: visible })}
                        >
                            <div className="add-btn" ref="addBtn">
                                <Icon type="plus" />
                                <span className="btn-text">添加分组</span>
                            </div>
                        </Popover>
                        <div className="capacity">
                            <Progress type="dashboard" percent={capacity.percent || 0} width={48} />
                            <span className="capacity-text">{capacity.usedSpace}/{capacity.totalSize}</span>
                            <span className="blue-6" style={{ cursor: 'pointer' }} onClick={() => this.handleExpand()}>扩容</span>
                        </div>
                    </Sider>
                    <Content className="content clearfix">
                        <div className="content-header clearfix">
                            <div className="header-left">
                                <span className="font-18 color-26">{selectedCategory ? selectedCategory.categoryName : ''}</span>
                            </div>
                            {
                                imgList.length ?
                                    <div className="header-right">
                                        <Button type="primary" className="search-btn" onClick={e => this.showModal({ type: 'uploadModal' })}>上传图片</Button>
                                        <Input.Search
                                            placeholder="请输入图片名称"
                                            onSearch={value => this.handleSearchPic(value)}
                                            style={{ width: 346 }}
                                        />
                                        <Upload
                                            style={{ lineHeight: 1 }}
                                            className="btn-item"
                                            action="/image/ReplaceImg"
                                            showUploadList={false}
                                            data={{ id: this.state.replaceImgId }}
                                            listType="text"
                                            accept="image/jpg,image/jpeg,image/gif,image/png"
                                            beforeUpload={this.handleBeforeUpload.bind(this)}
                                            onChange={this.handleReplacePic.bind(this)}
                                        >
                                            <span ref={span => this.replaceImgDom = span}></span>
                                        </Upload>
                                    </div>
                                    :
                                    null
                            }
                        </div>
                        {
                            imgList.length ?
                                <div className="oprate-tab clearfix">
                                    {
                                        selectedCategory.id !== -1 ?
                                            <Checkbox className="checkbox" checked={allChecked} onChange={e => this.handleAllChecked(e)}>全选</Checkbox>
                                            :
                                            null
                                    }
                                    {
                                        selectListIds.length && selectedCategory.id !== -1 ?
                                            <div className="opration-text">
                                                <Popover
                                                    className="renamePopover"
                                                    content={
                                                        <div>
                                                            <div>已选中{selectListIds.length}张图片</div>
                                                            <Select
                                                                showSearch
                                                                style={{ width: 200, margin: '6px 0' }}
                                                                placeholder="选择分组"
                                                                optionFilterProp="children"
                                                                onChange={value => this.handleCateChange(value)}
                                                                filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                                                            >
                                                                {
                                                                    categories.filter(v => v.id !== -1).map(v => <Select.Option value={v.id} key={v.id}>{v.categoryName}</Select.Option>)
                                                                }
                                                            </Select>
                                                        </div>
                                                    }
                                                    title="修改分组"
                                                    trigger="click"
                                                >
                                                    <span>修改分组</span>
                                                </Popover>
                                                <Divider type="vertical" />
                                                <Popover
                                                    title="确定删除选中的图片吗?"
                                                    content={
                                                        <div>
                                                            <div>已选中的{selectListIds.length}张图片删除后，使用这些图片的相关业务会受影响。</div>
                                                            <div className="popover-btns">
                                                                <Button size="small" onClick={() => { this.setState({ picDelPopoverVisible: false }) }}>取消</Button>
                                                                <Button size="small" loading={confirmLoading} onClick={this.handleDeletePic.bind(this)} type="primary" style={{ marginLeft: 10 }}>确定</Button>
                                                            </div>
                                                        </div>
                                                    }
                                                    trigger="click"
                                                    visible={this.state.picDelPopoverVisible}
                                                    onVisibleChange={visible => this.setState({ picDelPopoverVisible: visible })}
                                                >
                                                    <span>删除</span>
                                                </Popover>
                                            </div>
                                            :
                                            null
                                    }
                                    <div className="list-sort">
                                        <div className="time-sort" onClick={e => this.handleTimeSort()}>
                                            <span className={isTimeSort ? 'blue-6' : ''}>上传时间</span>
                                            <span className="sort-icon">
                                                <Icon className={isTimeSort && timeSortUp ? 'blue-6' : ''} type="caret-up" />
                                                <Icon className={isTimeSort && !timeSortUp ? 'blue-6' : ''} type="caret-down" />
                                            </span>
                                        </div>
                                        <div className="name-sort" onClick={e => this.handleNameSort()}>
                                            <span className={isNameSort ? 'blue-6' : ''}>图片名称</span>
                                            <span className="sort-icon">
                                                <Icon className={isNameSort && nameSortUp ? 'blue-6' : ''} type="caret-up" />
                                                <Icon className={isNameSort && !nameSortUp ? 'blue-6' : ''} type="caret-down" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                :
                                null
                        }
                        <div className="pic-container clearfix" ref="picWrapper">
                            {<Spin className="list-spin" spinning={listLoading} size="large" />}
                            {
                                imgList.length ?
                                    imgList.map(item => (
                                        <div
                                            className={selectListIds.includes(item.id) && selectedCategory.id !== -1 ? 'pic-item active' : 'pic-item'}
                                            key={item.id + ''}
                                            ref="picItem"
                                            onMouseEnter={e => this.handleListEnter(e, item)}
                                            onMouseLeave={e => this.handleListLeave(e)}
                                        >
                                            {
                                                selectListIds.includes(item.id) && selectedCategory.id !== -1 ?
                                                    <div className="selected" >
                                                        <Icon type="check" style={{ fontSize: 18 }} />
                                                    </div>
                                                    :
                                                    null
                                            }
                                            <div className="pic-box" onClick={e => this.handleListClick(item.id)}>
                                                <img src={`${item.path}?x-oss-process=style/150`} alt="" />
                                            </div>
                                            {
                                                item.isMouseEnter ?
                                                    <div className="btns">
                                                        <Popover
                                                            className="renamePopover"
                                                            content={
                                                                <div>
                                                                    <Input placeholder="请输入名称" value={iptPicName} onChange={e => this.handleInput('iptPicName', e.target.value)} />
                                                                    <div className="popover-btns">
                                                                        <Button size="small" onClick={() => { this.handleListCancelPopover(item.id) }}>取消</Button>
                                                                        <Button size="small" loading={confirmLoading} onClick={() => { this.renamePics(item.id) }} type="primary" style={{ marginLeft: 10 }}>确定</Button>
                                                                    </div>
                                                                </div>
                                                            }
                                                            title="修改名称"
                                                            trigger="click"
                                                            visible={item.popoverVisible}
                                                            onVisibleChange={visible => this.handleListPopover(visible, item.id, item.name)}
                                                        >
                                                            <span className="btn-item">改名</span>
                                                        </Popover>
                                                        <div className="btn-item">
                                                            {
                                                                selectedCategory.id !== -1 ?
                                                                    <span onClick={() => this.handleReplaceImg(item.id)} style={{ color: '#03A9F4' }}>替换</span>
                                                                    :
                                                                    <span style={{ color: '#595959' }}>替换</span>
                                                            }
                                                        </div>
                                                        <CopyToClipboard
                                                            className="btn-item"
                                                            text={item.ossPath}
                                                            onCopy={(text, result) => this.handleCopyLink(text, result)}
                                                        >
                                                            <span>链接</span>
                                                        </CopyToClipboard>
                                                        <span className="btn-item" onClick={() => { this.showModal({ type: 'previewModal', previewImage: item.path, selectedPicLink: item.path }) }}>查看</span>
                                                    </div>
                                                    :
                                                    <div className="pic-name">{formatPicName(item.name).newName}</div>
                                            }
                                        </div>
                                    ))
                                    :
                                    imgTotal === null
                                        ?
                                        null
                                        :
                                        <div className="list-empty-box">
                                            <div className="list-empty-img"></div>
                                            <div>暂无图片</div>
                                            <div><Button style={{ marginTop: 20 }} type="primary" className="search-btn" onClick={e => this.showModal({ type: 'uploadModal' })}>上传图片</Button></div>
                                        </div>
                            }
                        </div>
                        {
                            imgList.length ?
                                <Pagination
                                    style={{ float: 'right', marginTop: 10 }}
                                    showTotal={total => `共${total}条记录`}
                                    showQuickJumper
                                    showSizeChanger
                                    defaultCurrent={1}
                                    pageSize={pageSize}
                                    current={pageIndex}
                                    pageSizeOptions={pageSizeOptions}
                                    total={imgTotal}
                                    onChange={(page, pageSize) => this.handlePageChange('pageIndexChange', page)}
                                    onShowSizeChange={(current, size) => this.handlePageChange('pageSizeChange', size)}
                                />
                                :
                                null
                        }

                    </Content>
                </Layout>
                {/* 图片预览 复制链接 下载 */}
                {
                    previewModalVisible ?
                        <div className="preview-modal-mask" onClick={this.handleCancelPreviewModal.bind(this)}>
                            <div className="preview-modal">
                                <Icon type="close" className="preview-close" />
                                <img className="preview-img" alt="" src={previewImage} />
                                <div className="preview-download">
                                    <Button href={selectedPicLink} download={selectedPicLink}>下载</Button>
                                </div>
                            </div>
                        </div>
                        :
                        null
                }

                {/* 图片上传弹窗 */}
                <Modal
                    title={
                        <Tabs defaultActiveKey="1" onChange={key => console.log(key)}>
                            <Tabs.TabPane tab="本地上传" key="1">
                                <div className="clearfix">
                                    <Row>
                                        <Col span={2}>选择图片:</Col>
                                        <Col span={22}>
                                            <div>
                                                <Upload
                                                    className="upload-box"
                                                    action="/image/uploadFiles"
                                                    data={{ categoryId: selectedCategory ? selectedCategory.id : null }}
                                                    listType="picture-card"
                                                    multiple
                                                    accept="image/jpg,image/jpeg,image/gif,image/png"
                                                    fileList={fileList}
                                                    showUploadList={{ showPreviewIcon: false }}
                                                    beforeUpload={this.handleBeforeUpload.bind(this)}
                                                    onChange={this.handleUploadChange.bind(this)}
                                                    onRemove={this.handleImgRemove.bind(this)}
                                                >
                                                    {
                                                        fileList.length >= 50 ?
                                                            null
                                                            :
                                                            <div><Icon type="plus" /></div>
                                                    }
                                                </Upload>
                                                <div style={{ color: '#bfbfbf', clear: 'both' }}>仅支持gif，jpg，jpeg，png 4种格式，大小不超过5.0MB</div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Tabs.TabPane>
                            <Tabs.TabPane tab="网络图片" key="2">
                                <div className="clearfix">
                                    <span className="label">网络图片:</span>
                                    <Input
                                        style={{ width: 400, marginRight: 6, marginLeft: 10 }}
                                        value={webImg}
                                        onChange={e => this.setState({ webImg: e.target.value })}
                                        placeholder="请添加网络图片地址"
                                    />
                                    <Button onClick={this.handleUploadWebImg.bind(this)}>提取</Button>
                                </div>
                            </Tabs.TabPane>
                        </Tabs>
                    }
                    visible={uploadModalVisible}
                    confirmLoading={confirmLoading}
                    onCancel={() => this.handleUploadModalClose('cancel')}
                    onOk={() => this.handleUploadModalClose('confirm')}
                    className="upload-modal"
                    width="888px"
                    bodyStyle={{ padding: 0 }}
                    afterClose={() => { this.handleModalClose('webImg'); }}
                >
                </Modal>
            </Layout>
        );
    }
}
function formatPicName(name) {
    let suffix = '';
    let unsuffix = '';
    let newName = name.replace(/((\S{8})(.*))(\.[A-Za-z]{3,4})$/g, function (match, $1, $2, $3, $4) {
        unsuffix = $1;
        if ($4) suffix = $4;
        if ($3 && $3.length > 4) return $2 + '...' + $4;
        return name;
    })
    if (!unsuffix) {
        unsuffix = name.replace(/(\S*)(\.[A-Za-z]{3,4})$/g, function (match, $1, $2) {
            suffix = $2
            return $1;
        })
    }
    return {
        newName,
        suffix,
        unsuffix,
    }
}
export default App;