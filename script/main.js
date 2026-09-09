(function () {
  // ===== 弹窗 =====
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalImg = document.getElementById("modalImg");
  const modalButtons = document.getElementById("modalButtons");

  function showModal(title, desc, imgSrc, buttons) {
    modalTitle.textContent = title;
    modalDesc.textContent = desc || "";
    modalImg.style.display = imgSrc ? "block" : "none";
    if (imgSrc) modalImg.src = imgSrc;
    modalButtons.innerHTML = "";
    buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.textContent = btn.label;
      button.className = btn.className || "btn-primary";
      button.addEventListener("click", btn.action);
      modalButtons.appendChild(button);
    });
    modalOverlay.classList.add("active");
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
  }

  // ===== 结果弹窗 =====
  function showResultModal(imageDataUrl) {
    showModal("拍摄完成", "", imageDataUrl, [
      {
        label: "取消",
        className: "btn-secondary",
        action: () => {
          closeModal();
          statusHint.textContent = "相机已就绪";
        },
      },
      {
        label: "保存",
        className: "btn-primary",
        action: () => {
          const link = document.createElement("a");
          link.download = "电子透卡_" + Date.now() + ".png";
          link.href = imageDataUrl;
          link.click();
          statusHint.textContent = "已保存";
          closeModal();
        },
      },
    ]);
  }

  // ===== 更多面板 =====
  const moreBtn = document.getElementById("moreBtn");
  const morePanel = document.getElementById("morePanel");
  const fullscreenStatus = document.getElementById("fullscreenStatus");

  moreBtn.addEventListener("click", () => morePanel.classList.toggle("open"));

  // 点击外部关闭
  document.addEventListener("click", (e) => {
    if (
      morePanel.classList.contains("open") &&
      !morePanel.contains(e.target) &&
      e.target !== moreBtn
    ) {
      morePanel.classList.remove("open");
    }
  });

  document.getElementById("fullscreenItem").addEventListener("click", () => {
    const el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      (
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.msRequestFullscreen
      )?.call(el);
      fullscreenStatus.textContent = "已开启";
      fullscreenStatus.className = "status-on";
    } else {
      (
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.msExitFullscreen
      )?.call(document);
      fullscreenStatus.textContent = "未开启";
      fullscreenStatus.className = "status-off";
    }
    morePanel.classList.remove("open");
  });

  document.addEventListener("fullscreenchange", () => {
    const isFull = !!(
      document.fullscreenElement || document.webkitFullscreenElement
    );
    fullscreenStatus.textContent = isFull ? "已开启" : "未开启";
    fullscreenStatus.className = isFull ? "status-on" : "status-off";
  });

  // ===== 透卡数据 =====
  const cardPresets = [
    { label: "无", dataUrl: null, width: 400, height: 400 },
    {
      label: "本当の愛",
      dataUrl: "assets/cards/1.png",
      width: 1080,
      height: 1527,
    },
    { label: "测试1", dataUrl: "test1.png", width: 800, height: 600 },
    { label: "测试2", dataUrl: "test2.png", width: 1200, height: 800 },
    { label: "测试3", dataUrl: "test3.png", width: 600, height: 900 },
  ];

  // ===== DOM引用 =====
  const video = document.getElementById("video");
  const cardCanvas = document.getElementById("cardCanvas");
  const ctx = cardCanvas.getContext("2d");
  const cardContainer = document.getElementById("cardContainer");
  const dashedBorder = document.getElementById("dashedBorder");
  const videoContainer = document.getElementById("videoContainer");
  const cardOptions = document.getElementById("cardOptions");
  const captureBtn = document.getElementById("captureBtn");
  const statusHint = document.getElementById("statusHint");
  const cardInfo = document.getElementById("cardInfo");

  let stream = null;
  let cameraReady = false;
  let activeIndex = 0;
  let cardData = null;
  let cardW = 400,
    cardH = 400;
  let resizeObserver = null;

  // ===== 检测透卡是否可加载 =====
  function checkCard(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(true);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  // ===== 切换透卡 =====
  async function switchCard(index) {
    const card = cardPresets[index];
    activeIndex = index;
    cardData = card.dataUrl;
    cardW = card.width;
    cardH = card.height;

    document.querySelectorAll("#cardOptions button").forEach((b, i) => {
      b.className = i === index ? "active" : "";
    });

    updateCardSize(cardW, cardH);

    if (!cardData) {
      cardInfo.textContent = "无透卡";
      statusHint.textContent = "相机已就绪";
      drawCard();
      return;
    }

    cardInfo.textContent = "加载中...";
    statusHint.textContent = "透卡加载中";

    const ok = await checkCard(cardData);
    if (ok) {
      cardInfo.textContent = card.label + " (" + cardW + "×" + cardH + ")";
      statusHint.textContent = "相机已就绪";
    } else {
      cardInfo.textContent = "加载失败";
      statusHint.textContent = "透卡加载失败";
    }
    drawCard();
  }

  // ===== 渲染透卡按钮 =====
  function renderCardButtons() {
    cardOptions.innerHTML = "";
    cardPresets.forEach((card, index) => {
      const btn = document.createElement("button");
      btn.textContent = card.label;
      btn.className = index === activeIndex ? "active" : "";
      btn.addEventListener("click", () => switchCard(index));
      cardOptions.appendChild(btn);
    });
  }

  // ===== 更新透卡尺寸 =====
  function updateCardSize(w, h) {
    const rect = videoContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const scale = Math.min((rect.width - 40) / w, (rect.height - 40) / h, 1);
    const dw = Math.max(w * scale, 1);
    const dh = Math.max(h * scale, 1);

    cardContainer.style.width = dw + "px";
    cardContainer.style.height = dh + "px";
    cardCanvas.width = w;
    cardCanvas.height = h;
    cardCanvas.style.width = dw + "px";
    cardCanvas.style.height = dh + "px";
    dashedBorder.style.width = dw + "px";
    dashedBorder.style.height = dh + "px";
  }

  // ===== 绘制透卡 =====
  function drawCard() {
    const w = cardCanvas.width,
      h = cardCanvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!cardData) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ctx.drawImage(img, 0, 0, w, h);
    img.onerror = () => {};
    img.src = cardData;
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    }
  }

  // ===== ResizeObserver 监听容器尺寸变化 =====
  function setupResizeObserver() {
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(() => {
      if (cameraReady) {
        updateCardSize(cardW, cardH);
        drawCard();
      }
    });
    resizeObserver.observe(videoContainer);
  }

  // ===== 初始化摄像头 =====
  async function initCamera() {
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      stream = s;
      video.srcObject = s;
      await video.play();

      cameraReady = true;
      statusHint.textContent = "相机已就绪";
      captureBtn.disabled = false;

      setupResizeObserver();

      switchCard(0);
    } catch (err) {
      statusHint.textContent = "无法访问摄像头";
      captureBtn.disabled = true;
      cameraReady = false;
    }
  }

  // ===== 拍照 =====
  function capturePhoto() {
    if (!cameraReady) {
      statusHint.textContent = "相机未就绪";
      return;
    }

    const w = cardCanvas.width,
      h = cardCanvas.height;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cx = c.getContext("2d");

    const vr = video.getBoundingClientRect();
    const cr = cardContainer.getBoundingClientRect();
    const sx = ((cr.left - vr.left) / vr.width) * video.videoWidth;
    const sy = ((cr.top - vr.top) / vr.height) * video.videoHeight;
    const sw = (cr.width / vr.width) * video.videoWidth;
    const sh = (cr.height / vr.height) * video.videoHeight;

    cx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);

    if (cardData) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        cx.drawImage(img, 0, 0, w, h);
        showResultModal(c.toDataURL("image/png"));
      };
      img.onerror = () => {
        statusHint.textContent = "透卡加载失败";
        showResultModal(c.toDataURL("image/png"));
      };
      img.src = cardData;
      if (img.complete && img.naturalWidth > 0) {
        cx.drawImage(img, 0, 0, w, h);
        showResultModal(c.toDataURL("image/png"));
      }
    } else {
      showResultModal(c.toDataURL("image/png"));
    }
  }

  // ===== 窗口自适应 =====
  window.addEventListener("resize", () => {
    if (cameraReady) {
      updateCardSize(cardW, cardH);
      drawCard();
    }
  });

  // ===== 事件绑定 =====
  captureBtn.addEventListener("click", capturePhoto);

  // ===== 启动 =====
  renderCardButtons();
  setTimeout(initCamera, 100);

  window.drawCard = drawCard;
})();
