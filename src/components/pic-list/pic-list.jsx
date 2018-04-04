import React, { Component } from 'react';
import { Pagination } from 'antd';
import './pic-list.css';

export default class PicList extends Component {

    render() {
        return (
            <div>
                <div className="pic-container clearfix">
                    <div className="pic-item">
                        <div className="pic-box">
                            <img src="https://xkdsaas.oss-cn-shanghai.aliyuncs.com/MerChant/2905/1260/1519844399969.jpg" alt="" />
                        </div>
                        <div className="btns">
                            <span>改名</span>
                            <span>链接</span>
                            <span>分组</span>
                            <span>删除</span>
                        </div>
                    </div>

                </div>
                <Pagination defaultCurrent={1} total={50} />
            </div>

        )
    }
}