
const Wx = require('./wx');

function login(params) {
  (async () => {
    const wx = await new Wx();
    // 等待加载登录的二维码
    console.log("加载登录二维码.....");
    login();

    function _getQrcode() {
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

    function login() {
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
        wx.page.reload();
        login(); // 循环登录
      });
    }
  })()
}

module.exports = login;