'use strict';

var express = require('express');
var Mock = require('mockjs');

var CONFIG = require('../public/config/server.json');
var PATH = CONFIG.PATH;
var LIVERELOAD_PORT = CONFIG.LIVERELOAD_PORT || 35729;
var WEINRE_ID = CONFIG.WEINRE_ID || 'uc_activity';
var PORT = CONFIG.PORT || 9000;

function genScript(src) {
    return src ? '<script src="' + src + '"><\\/script>' : '';
}

var app = express();

// 插入 LIVERELOAD 和 WEINRE
var snippet = '';
if (CONFIG.LIVERELOAD || CONFIG.WEINRE) {
    snippet = '\n<script>//<![CDATA[\ndocument.write(\'';
    if (CONFIG.LIVERELOAD) {
        snippet += genScript('//\' + (location.hostname || \'localhost\') + \':' + LIVERELOAD_PORT + '/livereload.js');
    }
    if (CONFIG.WEINRE && WEINRE_ID) {
        snippet += genScript('//weinre.uae.ucweb.local/target/target-script-min.js#' + WEINRE_ID);
    }
    snippet += '\')\n//]]></script>\n';
    app.use(require('connect-inject')({
        snippet: snippet
    }));
}

// 首页为 index.html
function indexHandler(req, res) {
    res.sendfile('public/views/index.html');
}
app.get(PATH + '/', indexHandler);
app.get(PATH + '/index', indexHandler);

// 和后端的路径保持一致
app.use(PATH, express.static(process.cwd()));

// Mock 数据模拟
var MOCKS = require('../public/config/mock');
if (MOCKS && MOCKS.length) {
    // 遍历 mock 数组
    MOCKS.forEach(function (mockConf) {
        if (mockConf.path) {
            mockConf.method = mockConf.method || 'get';
            // 接入 express
            app[mockConf.method](PATH + mockConf.path, function (req, res) {
                // 延迟输出
                setTimeout(function() {
                    res.send(Mock.mock(mockConf.data));
                }, mockConf.delay || 0);
            });
        }
    });
}

// 启动
app.listen(PORT, function() {
    console.log('Server listening on port ' + PORT);
});
