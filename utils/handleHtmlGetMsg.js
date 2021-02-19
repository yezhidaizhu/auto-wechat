
// html 处理返回数据
function handleHtmlGetMsg() {
  return new Promise(resolve => {
    const MutationObserver = window.WebKitMutationObserver;
    const target = document.querySelector(".chat_list");
    if (!target) return;
    const observer = new MutationObserver(() => {
      const msg = getMsgInEml();
      observer.disconnect();
      resolve(msg);
    });
    const config = {
      childList: true,
      characterData: true,
      subtree: true,
    };
    observer.observe(target, config);

    function getMsgInEml() {
      const unreadMsg = [];
      const chatList = target.querySelectorAll(".chat_item.slide-left");

      let times = 0;
      for (let i = 0; i < chatList.length; i++) {
        const chat = chatList[i];
        const redMarker = chat.querySelector(".icon");

        // 是否有新信息（带红色徽标的）
        if (redMarker) {
          const ext = chat.querySelector(".ext").innerText; // 时间
          const msg = chat.querySelector(".msg").innerText; // 最新信息
          const nickname = chat.querySelector(".nickname").innerText; // 昵称
          const number = redMarker.innerText;
          unreadMsg.push({
            ext, nickname, msg, number
          })
        } else { times++; }
        if (times > 2) break;
      }
      return unreadMsg;
    }
  })
}

module.exports = handleHtmlGetMsg;
