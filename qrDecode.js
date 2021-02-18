const decodeImage = require('jimp').read;
const qrcodeReader = require('qrcode-reader');

module.exports = function qrDecode(data, callback) {
  decodeImage(data, function (err, image) {
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

// qrDecode("123.png",function(data){
//   console.log(data);
// });