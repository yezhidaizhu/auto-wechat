const Wx = require('./utils/wx');

(async () => {
  const wx = await new Wx();
  await wx.login();

})()
