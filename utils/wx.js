const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

const qrDecode = require('./qrDecode');
const handleHtmlGetMsg = require('./handleHtmlGetMsg');

const wechatUrl = "https://wx.qq.com/";
const loginQrcodeUrl = "https://login.weixin.qq.com/qrcode";  // 登录二维码链接
const webwxinitUrl = "https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit"; // 登录后初始化
const synccheckUrl = "https://webpush.wx.qq.com/cgi-bin/mmwebwx-bin/synccheck"; // 等待接收信息

const qrcodePath = "img/login.jpg";           // 登录图片
// const screenshotPath = "img/screenshot.jpg";  // 界面截图


class Wx {
  unreadMsg = []; // 未读信息

  constructor() {
    return (async () => {
      this.browser = await puppeteer.launch();
      this.page = await this.browser.newPage();
      await this.page.goto(wechatUrl, {
        waitUntil: 'load'
      });
      return this;
    })()
  }

  // 获取登录的二维码
  getQrcode(cb, whenTimeout) {
    this.page.waitForResponse(async response => {
      if (
        response.url().includes(loginQrcodeUrl) &&
        response.status() === 200
      ) {
        // 获取二维码图片
        axios({
          method: 'get',
          url: response.url(),
          responseType: 'stream'
        }).then(async response => {
          const ws = fs.createWriteStream(qrcodePath);
          response.data.pipe(ws);
          ws.on('finish', printQrcode);
          function printQrcode() {
            qrDecode(qrcodePath, data => {
              if (!data) {
                typeof cb === "function" && cb();
                return;
              }
              qrcode.generate(data, { small: true }, function (qrcode) {
                typeof cb === "function" && cb(qrcode);
              });
            });
          }
        });
        return 'ok';
      }
    }).then(finalLoginResponse => {
      finalLoginResponse.ok();
    }).catch(e => {
      typeof whenTimeout === "function" && whenTimeout();
    });
  }

  // 登录判断
  checkLogin(cb, whenTimeout) {
    this.page.waitForResponse(async response => {
      if (
        response.url().includes(webwxinitUrl) &&
        response.status() === 200
      ) {
        typeof cb === "function" && cb(true);
        return 'ok';
      }
      // TODO 登录失败判断（出现不能登录情况）
    }, { timeout: 60000 }).then(finalLoginResponse => {
      finalLoginResponse.ok();
    }).catch(e => {
      typeof whenTimeout === "function" && whenTimeout();
    });
  }

  // 获取信息(只获取有红点的信息)
  async getNewChatMsg(cb) {
    this.page.waitForResponse(async response => {
      if (response.url().includes(synccheckUrl)) {
        const msg = await this.page.evaluate(handleHtmlGetMsg);
        this.unreadMsg = msg;
        typeof cb === "function" && cb(msg);
      }
    }, { timeout: 0 }).catch((e) => {
      console.log("信息获取失败");
    })
  }

  // 循环登录
  login = async () => {
    return new Promise(resolve => {
      const _this = this;
      // 等待加载登录的二维码
      console.log("加载登录二维码.....");
      _login();

      function _getQrcode() {
        _this.getQrcode(async (qrcode) => {
          if (!qrcode) {
            console.log('二维码解析出错');
            _this.page.reload();
            _getQrcode();
            return;
          }
          console.log("二维码加载完成，请扫码登录");
          console.log(qrcode);
        });
      }

      function _login() {
        _getQrcode();
        // 登录成功判断
        _this.checkLogin((status) => {
          if (status) {
            console.log("登录成功");
            resolve('login_ok');
          }
        }, () => {
          console.log("扫描登录超时！！！请扫描新的二维码......");
          _this.page.reload();
          _login(); // 循环登录
        });
      }
    })
  }

  // 获取红点信息
  async getUnreadMsg() {
    return [...this.unreadMsg];
  }

  // 选中聊天对象
  async chatWith(user) {
    const { dataUsername } = user;
    const selector = `data-username="${dataUsername}"`;
    await this.page.click(selector);
  }

  // 发送信息
  async sendMsg(msg) {
    await this.page.type("#editArea", msg);
    await this.page.click(".btn.btn_send");
  }

  // 选中并发送信息
  async sendMsgToUser(user, msg) {
    await this.chatWith(user);
    await this.sendMsg(msg);
  }

  // 关闭
  close() {
    try {
      this.browser.close();
    } catch (e) {
    }
  }
}


module.exports = Wx;


// TODO 输出文字不同颜色
// 登录失败提醒

// 别处登录错误处理
