const decodeImage = require('jimp').read;
const qrcodeReader = require('qrcode-reader');

// 获取二维码信息
function qrDecode(filePath, callback) {
  decodeImage(filePath, function (err, image) {
    if (err) {
      callback(false);
      return;
    }
    let decodeQR = new qrcodeReader();
    decodeQR.callback = function (errorWhenDecodeQR, result) {
      if (errorWhenDecodeQR) {
        callback(false);
        return;
      }
      if (!result) {
        callback(false);
        return;
      } else {
        callback(result.result)
      }
    };
    decodeQR.decode(image.bitmap);
  });
}

module.exports = qrDecode;