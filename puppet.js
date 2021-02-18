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

// 未读信息
const unreadMsg = [];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(wechatUrl);

  // 等待加载登录的二维码
  log("加载登录二维码.....");
  const finalLoginResponse = await page.waitForResponse(async response => {
    if (
      response.url().includes(loginQrcodeUrl) &&
      response.status() === 200
    ) {
      log("二维码加载完成，请扫码登录");
      // 获取二维码图片
      axios({
        method: 'get',
        url: response.url(),
        responseType: 'stream'
      }).then(async response => {
        response.data.pipe(fs.createWriteStream(qrcodePath));
        setTimeout(() => {
          qrDecode(qrcodePath, data => {
            if (!data) {
              console.log('二维码解析出错');
              return;
            }
            qrcode.generate(data, { small: true }, function (qrcode) {
              console.log(qrcode);
            });
          });
        }, 100);
      });
      return 'ok';
    }
  })
  finalLoginResponse.ok();


  // 登录成功判断
  await page.waitForResponse(async response => {
    if (
      response.url().includes(webwxinitUrl) &&
      response.status() === 200
    ) {
      console.log("登录成功");
      // setTimeout(async () => {
      //   await page.screenshot({ path: screenshotPath });
      //   newChatMsg
      // }, 500);
      newChatMsg();
      return 'ok';
    }
  })

  // 获取新信息,(红点信息，只抓取用户聊天信息，不抓取文件传输等信息)
  function newChatMsg() {
    page.waitForResponse(async response => {
      if (
        response.url().includes(synccheckUrl)
      ) {
        const chatList = await page.$$(".chat_item.slide-left");
        for (let i = 0; i < chatList.length; i++) {
          const chat = chatList[i];
          const redMarker = chat.querySelector(".icon");
          // 是否有新信息（带红色徽标的）
          if (redMarker) {
            // 时间
            const ext = chat.querySelector(".ext").innerText;
            // 昵称
            const nickname = chat.querySelector(".nickname").innerText;
            // 未读信息数
            const number = redMarker.innerText;
            // 最新信息
            const msg = chat.querySelector(".msg").innerText;
          }
        }
      }
    }, { timeout: 0 })
  }



  // setTimeout(async () => {
  //   await page.screenshot({ path: 'login.png' });
  //   setTimeout(async () => {
  //     await page.screenshot({ path: 'ed.png' });
  //     await browser.close();
  //   }, 30000);
  // }, 5000);
  // page
  //   .waitForSelector('img')
  //   .then(() => {
  //   });

})();
// const puppeteer = require('puppeteer');

// (async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto('https://example.com');
//   await page.screenshot({ path: 'example.png' });

//   // await browser.close();
// })();

function log(msg) {
  console.log(msg);
}


