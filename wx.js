const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const qrDecode = require('./qrDecode');
const qrcode = require('qrcode-terminal');

const wechatUrl = "https://wx.qq.com/";
const loginQrcodeUrl = "https://login.weixin.qq.com/qrcode";  // 登录二维码链接
const webwxinitUrl = "https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit"; // 登录后初始化
const synccheckUrl = "https://webpush.wx.qq.com/cgi-bin/mmwebwx-bin/synccheck"; // 等待接收信息

const qrcodePath = "img/login.jpg";           // 登录图片
const screenshotPath = "img/screenshot.jpg";  // 界面截图


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
    }).then(finalLoginResponse => {
      finalLoginResponse.ok();
    }).catch(e => {
      typeof whenTimeout === "function" && whenTimeout();
    });
  }

  // 获取新信息(只获取有红点的信息)
  async getNewChatMsg(cb) {
    this.page.waitForResponse(async response => {
      if (response.url().includes(synccheckUrl)) {
        this.unreadMsg = [];
        const chatList = await this.page.$$(".chat_item.slide-left");
        let times = 0;
        for (let i = 0; i < chatList.length; i++) {
          const chat = chatList[i];
          const redMarker = await chat.$(".icon") && await chat.$eval(".icon", node => node.innerText);
          const nickname = await chat.$eval(".nickname", node => node.innerText); // 昵称
          // 是否有新信息（带红色徽标的）
          if (redMarker) {
            const ext = await chat.$eval(".ext", node => node.innerText); // 时间
            const msg = await chat.$eval(".msg", node => node.innerText); // 最新信息
            const number = redMarker;
            this.unreadMsg.push({
              ext, nickname, msg, number
            })
          } else { times++; }
          if (times > 2) break;
        }
        typeof cb === "function" && cb(this.unreadMsg);
      }
    }, { timeout: 0 }).catch((e) => {
      console.log("信息获取失败");
    })
  }
}
// module.exports = Wx;

(async () => {
  const wx = await new Wx();
  // 等待加载登录的二维码
  console.log("加载登录二维码.....");
  const _getQrcode = () => {
    wx.getQrcode(async (qrcode) => {
      if (!qrcode) {
        console.log('二维码解析出错');
        wx.page.reload();
        _getQrcode();
        return;
      }
      console.log("二维码加载完成，请扫码登录");
      console.log(qrcode);
    });
  }

  _getQrcode();

  // 登录成功判断
  wx.checkLogin((status) => {
    if (status) {
      console.log("登录成功");
      wx.getNewChatMsg((msg) => {
        console.log(msg);
      });
    }
  }, () => {
    console.log("扫描登录超时！！！请扫描新的二维码");
    _getQrcode();
  });
})()

