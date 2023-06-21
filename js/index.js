// 解决 click 事件的300ms延迟问题
// @ts-ignore
FastClick.attach(document.body);
(async function () {
  const baseBox = document.querySelector(`.header-box .base`);
  const playerButton = document.querySelector(`.header-box .player-button`);
  const wrapperBox = document.querySelector(`.wrapper`);
  const footerBox = document.querySelector(`.footer-box`);
  const currentBox = footerBox?.querySelector(`.current`);
  const durationBox = footerBox?.querySelector(`.duration`);
  const alreadyBox = footerBox?.querySelector(`.already`);
  const markImageBox = document.querySelector(`.mark-image`);
  const loadingBox = document.querySelector(`.loading-box`);
  const audioBox = document.querySelector(`#audioBox`);

  let wrapperList = [];
  let timer = null;
  let matchNum = 0; //记录历史匹配的数量。

  // 音乐控制
  const format = function format(time) {
    let minutes = Math.floor(time / 60);
    let seconds = Math.round(time - minutes * 60);
    // @ts-ignore
    minutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    // @ts-ignore
    seconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return {
      minutes,
      seconds,
    };
  };
  const playend = function playend() {
    clearInterval(timer);
    timer = null;

    // @ts-ignore
    currentBox.innerHTML = "00:00";
    // @ts-ignore
    alreadyBox.style.width = "0%";
    // @ts-ignore
    wrapperBox.style.transform = "translateY(0)";
    wrapperList.forEach((item) => {
      item.className = "";
    });
    matchNum = 0;
    // @ts-ignore
    playerButton.className = "player-button";
  };
  const handle = function handle() {
    let pH = wrapperList[0].offsetHeight;
    // @ts-ignore
    let { currentTime, duration } = audioBox;
    if (isNaN(currentTime) || isNaN(duration)) {
      return;
    }
    // 播放结束
    if (currentTime >= duration) {
      playend();
      return;
    }
    let { minutes: currentTimeMinutes, seconds: currentTimeSeconds } =
      format(currentTime);
    let { minutes: durationMinutes, seconds: durationSeconds } =
      format(duration);

    let ratio = Math.round((currentTime / duration) * 100);
    // console.log(`currentTime-->`, currentTime, duration);

    // 控制进度条。
    // @ts-ignore
    currentBox.innerHTML = `${currentTimeMinutes}:${currentTimeSeconds}`;
    // @ts-ignore
    durationBox.innerHTML = `${durationMinutes}:${durationSeconds}`;

    // @ts-ignore
    alreadyBox.style.width = `${ratio}%`;

    // 控制歌词:查找和当前播放时间匹配的歌词段落。
    let matchs = wrapperList.filter((item) => {
      let minutes = item.getAttribute("minutes");
      let seconds = item.getAttribute("seconds");
      return minutes === currentTimeMinutes && seconds === currentTimeSeconds;
    });
    if (matchs.length > 0) {
      // 让匹配的段落有选中样式，而其余的移除选中样式。
      wrapperList.forEach((item) => (item.className = ""));
      matchs.forEach((item) => (item.className = "active"));

      // 控制移动
      matchNum += matchs.length;
      if (matchNum > 3) {
        let offset = (matchNum - 3) * pH;
        // @ts-ignore
        wrapperBox.style.transform = `translateY(${-offset}px)`;
      }
    }
  };
  playerButton?.addEventListener("click", function () {
    console.log(audioBox);
    // @ts-ignore
    if (audioBox?.paused) {
      // 当前是暂停的：我们让其播放。
      // @ts-ignore
      audioBox.play();
      // playerButton.classList.add('move')
      playerButton.className = `player-button move`;
      handle();
      if (!timer) {
        timer = setInterval(handle, 1000);
      }

      return;
    }

    // 当前是播放的：我们让其暂停。
    // @ts-ignore
    audioBox?.pause();
    playerButton.className = `player-button`;
    clearInterval(timer);
    timer = null;
  });

  // 绑定数据
  const bindLyric = function bindLyric(lyric) {
    //处理歌词部分的特殊符号
    lyric = lyric.replace(/&#(\d+);/g, (value, $1) => {
      // console.log(`value-->`, value,$1);
      let instead = value;
      switch (+$1) {
        case 32:
          instead = " ";
          break;
        case 40:
          instead = "(";
          break;
        case 41:
          instead = ")";
          break;
        case 45:
          instead = "-";
          break;
        default:
      }
      return instead;
    });
    // console.log(`1. lyric-->`, lyric);

    // 解析歌词信息
    let arr = [
      // {
      //   minutes: "00",
      //   seconds: "01",
      //   text: "....",
      // },
    ];
    lyric.replace(
      /\[(\d+)&#58;(\d+)&#46;(?:\d+)\]([^&#?]+)(&#10;)?/g,
      (_, $1, $2, $3) => {
        // console.log(`value-->`, value,$1);
        let instead = _;
        // console.log(`-->`, $1, $2, $3);
        arr.push({
          minutes: $1,
          seconds: $2,
          text: $3,
        });
        return instead;
      }
    );
    // console.log(`arr-->`, arr);

    // 歌词绑定
    let str = ``;
    arr.forEach(({ minutes, seconds, text }) => {
      str += `<p minutes="${minutes}" seconds="${seconds}">
        ${text}
      </p>`;
    });
    // @ts-ignore
    wrapperBox.innerHTML = str;

    // 获取所有的p标签
    // @ts-ignore
    wrapperList = Array.from(wrapperBox?.querySelectorAll("p"));
    // console.log(`wrapperList-->`, wrapperList);
  };

  const binding = function binding(data) {
    let { title, author, duration, pic, audio, lyric } = data;

    // 1. 绑定头部基本信息。
    // @ts-ignore
    baseBox.innerHTML = `<div class="cover">
      <img src="${pic}" alt="" />
    </div>
    <div class="info">
      <h2 class="title">${title}</h2>
      <h3 class="author">${author}</h3>
    </div>`;

    // 2. 杂七杂八的内容。
    // @ts-ignore
    durationBox.innerHTML = duration;
    // @ts-ignore
    markImageBox.style.backgroundImage = `url(${pic})`;
    // @ts-ignore
    audioBox.src = audio;

    // 3. 绑定歌词信息。
    bindLyric(lyric);

    // 4. 关闭loading效果
    // @ts-ignore
    loadingBox.style.display = `none`;
  };

  // 向服务器发送请求，从服务器获取相关的数据。
  try {
    let { code, data } = await API.queryLyric();
    if (+code === 0) {
      // 请求成功：网络层和业务层都成功。
      binding(data);
      return;
    }
  } catch (error) {
    console.log(`error:-->`, error);
  }

  // 请求失败-网络层或业务层有一个失败了。
  alert(`网络繁忙，请刷新页面再试`);
})();
