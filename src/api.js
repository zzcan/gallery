import axios from 'axios';
import { stringify } from 'qs';

// 获取用户信息
export function getUserInfo() {
    return axios.get('/image/getUserInfo');
}
// 获取oem配置信息
export function getOemConfig() {
    return axios.get('/ConfigAppsetting/GetConfig');
}
// 获取分组
export function getCategory(options) {
    return axios.get('/image/getCategory');
}
// 获取容量信息
export function getSpace(options) {
    return axios.get('/image/getSpace');
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
export function getList(options) {
    return axios.get('/image/getList', { params: options });
}
/**
 * 获取oss图片信息
 * @param {categoryId, searchName 可选, pageIndex, pageSize} options 
 */
export function getPicInfo(url, options) {
    return axios.get(url, { params: options });
}
/**
 * 添加分组
 * @param {categoryName} options 
 */
export function addCategory(options) {
    return axios.post('/image/addCategory', stringify(options));
}
/**
 * 修改分组名
 * @param {id, name} options 
 */
export function categoryRename(options) {
    return axios.post('/image/categoryRename', stringify(options));
}
/**
 * 修改分组名
 * @param {ids,name} options 
 */
export function picRename(options) {
    return axios.post('/image/picRename', stringify(options));
}
/**
 * 删除分组
 * @param {categoryId} options 
 */
export function delCategory(options) {
    return axios.post('/image/delCategory', stringify(options));
}
/**
 * 移动图片至新分组
 * @param {categoryId 新分组id, id 图片id} options 
 */
export function moveCategory(options) {
    return axios.post('/image/moveCategory', stringify(options));
}
/**
 * 删除图片
 * @param {ids图片id数组} options 
 */
export function delPic(options) {
    return axios.post('/image/delPic', stringify(options));
}
/**
 * 上传网络图片
 * @param {imgSrc 网络图片路径} options 
 */
export function uploadWebImg(options) {
    return axios.post('/image/uploadWebImg', stringify(options));
}

