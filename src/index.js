import React from 'react';
import ReactDOM from 'react-dom';
import { LocaleProvider } from 'antd';
import zh_CN from 'antd/lib/locale-provider/zh_CN';
import 'moment/locale/zh-cn';
import Wrapper from './Wrapper';
import './config';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<LocaleProvider locale={zh_CN}><Wrapper /></LocaleProvider>, document.getElementById('root'));
registerServiceWorker();
