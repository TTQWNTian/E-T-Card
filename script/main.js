(function() {
    // ===== 禁止长按菜单和右键菜单 =====
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("selectstart", (e) => e.preventDefault());
    document.addEventListener("dragstart", (e) => e.preventDefault());
    document.addEventListener(
        "touchstart",
        (e) => {
            if (e.touches.length > 1) e.preventDefault();
        }, {
            passive: false
        },
    );

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

    // ===== 日期格式化 =====
    function formatDate() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return (
            d.getFullYear() +
            "-" +
            pad(d.getMonth() + 1) +
            "-" +
            pad(d.getDate()) +
            "_" +
            pad(d.getHours()) +
            "-" +
            pad(d.getMinutes()) +
            "-" +
            pad(d.getSeconds())
        );
    }

    // ===== 结果弹窗 =====
    function showResultModal(imageDataUrl) {
        showModal("拍摄完成", "", imageDataUrl, [{
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
                    link.download = "电子透卡_" + formatDate() + ".png";
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

    document.addEventListener("click", (e) => {
        if (
            morePanel.classList.contains("open") &&
            !morePanel.contains(e.target) &&
            !moreBtn.contains(e.target)
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

    // ===== 内置透卡数据 =====
    const cardPresets = [{
            label: "无",
            dataUrl: null,
            width: 400,
            height: 400
        },
        {
            label: "本当の愛",
            dataUrl: "assets/cards/本当の愛.png",
            width: 1080,
            height: 1527,
        },
        {
            label: "晋江の稲妻",
            dataUrl: "assets/cards/晋江の稲妻.png",
            width: 1080,
            height: 1440,
        },
        {
            label: "戒指",
            dataUrl: "assets/cards/戒指.png",
            width: 1080,
            height: 1080,
        }
    ];

    // ===== 滤镜数据 =====
    const filterPresets = [{
            label: "原色"
        },
        {
            label: "环境色"
        },
        {
            label: "暖阳",
            color: {
                r: 255,
                g: 140,
                b: 60
            },
            alpha: 0.35
        },
        {
            label: "冷月",
            color: {
                r: 80,
                g: 140,
                b: 255
            },
            alpha: 0.35
        },
        {
            label: "晚霞",
            color: {
                r: 255,
                g: 100,
                b: 80
            },
            alpha: 0.35
        },
        {
            label: "深海",
            color: {
                r: 40,
                g: 100,
                b: 160
            },
            alpha: 0.4
        },
        {
            label: "森野",
            color: {
                r: 60,
                g: 140,
                b: 90
            },
            alpha: 0.35
        },
        {
            label: "樱粉",
            color: {
                r: 255,
                g: 160,
                b: 190
            },
            alpha: 0.35
        },
        {
            label: "紫霞",
            color: {
                r: 150,
                g: 100,
                b: 220
            },
            alpha: 0.35
        },
    ];

    // ===== 背景特效数据 =====
    const bgEffectPresets = [{
            label: "无"
        },
        {
            label: "马赛克",
            type: "mosaic",
            value: 16,
            min: 2,
            max: 60
        },
        {
            label: "黑白",
            type: "gray"
        },
    ];

    // ===== DOM引用 =====
    const video = document.getElementById("video");
    const bgCanvas = document.getElementById("bgCanvas");
    const bgCtx = bgCanvas.getContext("2d");
    const cardCanvas = document.getElementById("cardCanvas");
    const ctx = cardCanvas.getContext("2d");
    const cardContainer = document.getElementById("cardContainer");
    const dashedBorder = document.getElementById("dashedBorder");
    const videoContainer = document.getElementById("videoContainer");
    const filterOptions = document.getElementById("filterOptions");
    const captureBtn = document.getElementById("captureBtn");
    const statusHint = document.getElementById("statusHint");
    const cardInfo = document.getElementById("cardInfo");
    const galleryBtn = document.getElementById("galleryBtn");
    const galleryPanel = document.getElementById("galleryPanel");
    const galleryGrid = document.getElementById("galleryGrid");
    const galleryCloseBtn = document.getElementById("galleryCloseBtn");
    const cardFileInput = document.getElementById("cardFileInput");
    const reservedBtn = document.getElementById("reservedBtn");
    const bgEffectPanel = document.getElementById("bgEffectPanel");
    const bgEffectList = document.getElementById("bgEffectList");
    const bgEffectSliderWrap = document.getElementById("bgEffectSliderWrap");
    const bgEffectSlider = document.getElementById("bgEffectSlider");

    // ===== 状态 =====
    let stream = null;
    let cameraReady = false;
    let activeCardIndex = 0;
    let activeFilterIndex = 0;
    let activeBgEffectIndex = 0;
    let bgEffectValue = 12;
    let cardData = null;
    let cardW = 400,
        cardH = 400;
    let resizeObserver = null;
    let previewBaseWidth = 360;

    // ===== IndexedDB =====
    const DB_NAME = "etcard";
    const DB_STORE = "cards";
    let db = null;
    let localCards = [];

    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(DB_STORE)) {
                    d.createObjectStore(DB_STORE, {
                        keyPath: "id",
                        autoIncrement: true
                    });
                }
            };
            req.onsuccess = (e) => {
                db = e.target.result;
                resolve(db);
            };
            req.onerror = () => reject(req.error);
        });
    }

    function dbAdd(card) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE, "readwrite");
            const req = tx.objectStore(DB_STORE).add(card);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    function dbGetAll() {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE, "readonly");
            const req = tx.objectStore(DB_STORE).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    function dbDelete(id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE, "readwrite");
            const req = tx.objectStore(DB_STORE).delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async function loadLocalCards() {
        try {
            if (!db) await openDB();
            localCards = await dbGetAll();
        } catch (e) {
            localCards = [];
        }
    }

    function getAllCards() {
        return cardPresets.concat(localCards);
    }

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

    // ===== 更新相册按钮缩略图 =====
    function updateGalleryBtn() {
        if (cardData) {
            galleryBtn.style.backgroundImage = `url("${cardData}")`;
        } else {
            galleryBtn.style.backgroundImage = "";
        }
    }

    // ===== 切换透卡 =====
    async function switchCard(index) {
        const all = getAllCards();
        const card = all[index];
        if (!card) return;

        activeCardIndex = index;
        cardData = card.dataUrl;
        cardW = card.width;
        cardH = card.height;

        updateCardSize(cardW, cardH);
        updateGalleryBtn();

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

    // ===== 长按检测 =====
    function bindLongPress(el, callback) {
        let timer = null;
        let triggered = false;

        const start = () => {
            triggered = false;
            timer = setTimeout(() => {
                triggered = true;
                callback();
            }, 400);
        };

        const cancel = () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        };

        el.addEventListener("touchstart", start, {
            passive: true
        });
        el.addEventListener("touchend", cancel);
        el.addEventListener("touchcancel", cancel);
        el.addEventListener("touchmove", cancel);

        el.addEventListener("mousedown", start);
        el.addEventListener("mouseup", cancel);
        el.addEventListener("mouseleave", cancel);

        el.addEventListener(
            "click",
            (e) => {
                if (triggered) {
                    e.stopPropagation();
                    e.preventDefault();
                    triggered = false;
                }
            },
            true,
        );
    }

    // ===== 渲染相册 =====
    let renderScheduled = false;

    function renderGallery() {
        if (renderScheduled) return;
        renderScheduled = true;
        queueMicrotask(() => {
            renderScheduled = false;
            renderGalleryNow();
        });
    }

    function renderGalleryNow() {
        galleryGrid.innerHTML = "";
        const all = getAllCards();
        const builtinCount = cardPresets.length;

        all.forEach((card, index) => {
            const item = document.createElement("div");
            item.className =
                "gallery-item" + (index === activeCardIndex ? " active" : "");
            item.dataset.index = index;

            if (card.dataUrl) {
                const img = document.createElement("img");
                img.src = card.dataUrl;
                img.alt = card.label;
                item.appendChild(img);
            } else {
                const empty = document.createElement("span");
                empty.className = "gallery-empty";
                empty.textContent = "无";
                item.appendChild(empty);
            }

            const label = document.createElement("span");
            label.className = "gallery-label";
            label.textContent = card.label;
            item.appendChild(label);

            item.addEventListener("click", () => {
                switchCard(index);
                renderGallery();
                galleryPanel.classList.remove("open");
            });

            if (index >= builtinCount) {
                bindLongPress(item, () => {
                    const localIndex = index - builtinCount;
                    confirmDelete(localIndex);
                });
            }

            galleryGrid.appendChild(item);
        });

        const addItem = document.createElement("div");
        addItem.className = "gallery-item gallery-add";
        addItem.innerHTML = `
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        `;
        addItem.addEventListener("click", () => cardFileInput.click());
        galleryGrid.appendChild(addItem);
    }

    // ===== 删除本地透卡 =====
    async function confirmDelete(localIndex) {
        const card = localCards[localIndex];
        if (!card) return;

        const ok = confirm('删除透卡 "' + card.label + '"？');
        if (!ok) return;

        try {
            await dbDelete(card.id);
            await loadLocalCards();

            const totalAll = getAllCards().length;

            if (activeCardIndex >= totalAll) {
                switchCard(totalAll - 1);
            } else if (activeCardIndex >= cardPresets.length) {
                const newIndex = Math.min(activeCardIndex, totalAll - 1);
                switchCard(newIndex);
            }

            renderGallery();
            statusHint.textContent = "已删除";
        } catch (e) {
            statusHint.textContent = "删除失败";
        }
    }

    // ===== 导入透卡 =====
    cardFileInput.addEventListener("change", async () => {
        const files = Array.from(cardFileInput.files);
        if (!files.length) return;

        statusHint.textContent = "导入中...";

        const readAsDataURL = (file) =>
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
            });

        const loadImage = (dataUrl) =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error("图片解码失败"));
                img.src = dataUrl;
            });

        let success = 0;
        let fail = 0;

        for (const file of files) {
            try {
                const dataUrl = await readAsDataURL(file);
                const img = await loadImage(dataUrl);
                const newCard = {
                    label: file.name.replace(/\.[^.]+$/, ""),
                    dataUrl,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                };
                await dbAdd(newCard);
                success++;
            } catch (e) {
                fail++;
            }
        }

        await loadLocalCards();

        const total = getAllCards().length;
        if (success > 0) {
            switchCard(total - 1);
        }
        renderGallery();

        statusHint.textContent =
            fail === 0 ?
            `已导入 ${success} 张` :
            `导入 ${success} 张，失败 ${fail} 张`;

        galleryPanel.classList.remove("open");
        cardFileInput.value = "";
    });

    // ===== 渲染滤镜按钮 =====
    function renderFilterButtons() {
        filterOptions.innerHTML = "";
        filterPresets.forEach((f, index) => {
            const btn = document.createElement("button");
            btn.textContent = f.label;
            btn.className = index === activeFilterIndex ? "active" : "";
            btn.addEventListener("click", () => {
                activeFilterIndex = index;
                renderFilterButtons();
                drawCard();
            });
            filterOptions.appendChild(btn);
        });
    }

    // ===== 渲染背景特效按钮 =====
    function renderBgEffectButtons() {
        bgEffectList.innerHTML = "";
        bgEffectPresets.forEach((f, index) => {
            const btn = document.createElement("button");
            btn.textContent = f.label;
            btn.className = index === activeBgEffectIndex ? "active" : "";
            btn.addEventListener("click", () => {
                activeBgEffectIndex = index;
                bgEffectValue = f.value || 0;
                renderBgEffectButtons();
                updateSliderVisibility();
            });
            bgEffectList.appendChild(btn);
        });
    }

    function updateSliderVisibility() {
        const f = bgEffectPresets[activeBgEffectIndex];
        if (f && f.min !== undefined && f.max !== undefined) {
            bgEffectSliderWrap.classList.add("visible");
            bgEffectSlider.min = f.min;
            bgEffectSlider.max = f.max;
            bgEffectSlider.value = bgEffectValue;
        } else {
            bgEffectSliderWrap.classList.remove("visible");
        }
    }

    bgEffectSlider.addEventListener("input", () => {
        bgEffectValue = parseInt(bgEffectSlider.value);
    });

    // ===== 背景特效面板开关 =====
    function openBgPanel() {
        const rect = reservedBtn.getBoundingClientRect();
        const panelWidth = 130;
        let left = rect.left + rect.width / 2 - panelWidth / 2;
        if (left < 8) left = 8;
        if (left + panelWidth > window.innerWidth - 8) {
            left = window.innerWidth - panelWidth - 8;
        }
        bgEffectPanel.style.left = left + "px";
        bgEffectPanel.style.bottom = window.innerHeight - rect.top + 8 + "px";
        bgEffectPanel.style.top = "auto";
        bgEffectPanel.classList.add("open");
    }

    function closeBgPanel() {
        bgEffectPanel.classList.remove("open");
    }

    reservedBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (bgEffectPanel.classList.contains("open")) {
            closeBgPanel();
        } else {
            openBgPanel();
        }
    });

    document.addEventListener("click", (e) => {
        if (
            bgEffectPanel.classList.contains("open") &&
            !bgEffectPanel.contains(e.target) &&
            !reservedBtn.contains(e.target)
        ) {
            closeBgPanel();
        }
    });

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

    // ===== 获取环境色 =====
    function sampleAmbientColor() {
        if (!cameraReady || !video.videoWidth) return null;
        try {
            const c = document.createElement("canvas");
            c.width = 32;
            c.height = 32;
            const cx = c.getContext("2d");
            cx.drawImage(video, 0, 0, 32, 32);
            const data = cx.getImageData(0, 0, 32, 32).data;
            let r = 0,
                g = 0,
                b = 0,
                count = 0;
            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
            return {
                r: Math.round(r / count),
                g: Math.round(g / count),
                b: Math.round(b / count),
            };
        } catch (e) {
            return null;
        }
    }

    // ===== 获取当前滤镜颜色 =====
    function getFilterColor() {
        const f = filterPresets[activeFilterIndex];
        if (!f) return null;
        if (f.label === "原色") return null;
        if (f.label === "环境色") {
            const c = sampleAmbientColor();
            if (!c) return null;
            return {
                r: c.r,
                g: c.g,
                b: c.b,
                alpha: 0.4
            };
        }
        if (!f.color) return null;
        return {
            r: f.color.r,
            g: f.color.g,
            b: f.color.b,
            alpha: f.alpha
        };
    }

    // ===== 绘制透卡 =====
    function drawCard() {
        const w = cardCanvas.width,
            h = cardCanvas.height;
        ctx.clearRect(0, 0, w, h);
        if (!cardData) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => drawCardWithFilter(img, w, h);
        img.onerror = () => {};
        img.src = cardData;
        if (img.complete && img.naturalWidth > 0) {
            drawCardWithFilter(img, w, h);
        }
    }

    function drawCardWithFilter(img, w, h) {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const color = getFilterColor();
        if (color) {
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha})`;
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = "source-over";
        }
    }

    // ===== 生成带滤镜的透卡图层 =====
    function buildCardLayer(img, w, h) {
        const layer = document.createElement("canvas");
        layer.width = w;
        layer.height = h;
        const lx = layer.getContext("2d");
        lx.drawImage(img, 0, 0, w, h);

        const color = getFilterColor();
        if (color) {
            lx.globalCompositeOperation = "source-atop";
            lx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha})`;
            lx.fillRect(0, 0, w, h);
            lx.globalCompositeOperation = "source-over";
        }
        return layer;
    }

    // ===== 应用背景特效 =====
    function applyBgEffectToCtx(cx, w, h, baseWidth) {
        const f = bgEffectPresets[activeBgEffectIndex];
        if (!f || f.label === "无") return;

        const ratio = w / (baseWidth || 360);

        if (f.type === "gray") {
            const imageData = cx.getImageData(0, 0, w, h);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const g = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = data[i + 1] = data[i + 2] = g;
            }
            cx.putImageData(imageData, 0, 0);
        } else if (f.type === "mosaic") {
            const block = Math.max(2, Math.round(bgEffectValue * ratio));
            const imageData = cx.getImageData(0, 0, w, h);
            const data = imageData.data;

            const cx0 = w / 2;
            const cy0 = h / 2;
            const cols = Math.ceil(w / block / 2) + 1;
            const rows = Math.ceil(h / block / 2) + 1;

            for (let gy = -rows; gy <= rows; gy++) {
                for (let gx = -cols; gx <= cols; gx++) {
                    const x = Math.round(cx0 + gx * block - block / 2);
                    const y = Math.round(cy0 + gy * block - block / 2);

                    const sx = Math.min(w - 1, Math.max(0, Math.round(cx0 + gx * block)));
                    const sy = Math.min(h - 1, Math.max(0, Math.round(cy0 + gy * block)));

                    const idx = (sy * w + sx) * 4;
                    const r = data[idx],
                        g = data[idx + 1],
                        b = data[idx + 2];

                    const x0 = Math.max(0, x);
                    const y0 = Math.max(0, y);
                    const x1 = Math.min(w, x + block);
                    const y1 = Math.min(h, y + block);

                    for (let py = y0; py < y1; py++) {
                        for (let px = x0; px < x1; px++) {
                            const p = (py * w + px) * 4;
                            data[p] = r;
                            data[p + 1] = g;
                            data[p + 2] = b;
                        }
                    }
                }
            }
            cx.putImageData(imageData, 0, 0);
        }
    }

    // ===== 视频 cover 绘制 =====
    function drawVideoCover(ctx, video, w, h) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return;
        const scale = Math.max(w / vw, h / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(video, dx, dy, dw, dh);
    }

    // ===== 预览背景实时渲染 =====
    let bgRendering = false;

    function renderBgFrame() {
        const f = bgEffectPresets[activeBgEffectIndex];
        if (!f || f.label === "无") {
            bgCanvas.classList.remove("visible");
            video.classList.remove("hidden");
            return;
        }

        bgCanvas.classList.add("visible");
        video.classList.add("hidden");

        const rect = videoContainer.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));

        if (bgCanvas.width !== w || bgCanvas.height !== h) {
            bgCanvas.width = w;
            bgCanvas.height = h;
            bgCanvas.style.width = w + "px";
            bgCanvas.style.height = h + "px";
        }

        previewBaseWidth = w;

        drawVideoCover(bgCtx, video, w, h);
        applyBgEffectToCtx(bgCtx, w, h, previewBaseWidth);
    }

    function startBgRenderLoop() {
        if (bgRendering) return;
        bgRendering = true;
        const loop = () => {
            if (cameraReady) renderBgFrame();
            requestAnimationFrame(loop);
        };
        loop();
    }

    // ===== ResizeObserver =====
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
                    width: {
                        ideal: 1280
                    },
                    height: {
                        ideal: 720
                    },
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
            startBgRenderLoop();
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

        // 以 videoContainer 为基准，映射到视频原始坐标
        const vr = videoContainer.getBoundingClientRect();
        const cr = cardCanvas.getBoundingClientRect();

        const relLeft = (cr.left - vr.left) / vr.width;
        const relTop = (cr.top - vr.top) / vr.height;
        const relW = cr.width / vr.width;
        const relH = cr.height / vr.height;

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const containerRatio = vr.width / vr.height;
        const videoRatio = vw / vh;

        let drawX, drawY, drawW, drawH;
        if (videoRatio > containerRatio) {
            drawH = vh;
            drawW = vh * containerRatio;
            drawX = (vw - drawW) / 2;
            drawY = 0;
        } else {
            drawW = vw;
            drawH = vw / containerRatio;
            drawX = 0;
            drawY = (vh - drawH) / 2;
        }

        const sx = drawX + relLeft * drawW;
        const sy = drawY + relTop * drawH;
        const sw = relW * drawW;
        const sh = relH * drawH;

        cx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
        applyBgEffectToCtx(cx, w, h, previewBaseWidth);

        if (cardData) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const cardLayer = buildCardLayer(img, w, h);
                cx.drawImage(cardLayer, 0, 0);
                showResultModal(c.toDataURL("image/png"));
            };
            img.onerror = () => {
                statusHint.textContent = "透卡加载失败";
                showResultModal(c.toDataURL("image/png"));
            };
            img.src = cardData;
            if (img.complete && img.naturalWidth > 0) {
                const cardLayer = buildCardLayer(img, w, h);
                cx.drawImage(cardLayer, 0, 0);
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
    galleryBtn.addEventListener("click", () => {
        renderGallery();
        galleryPanel.classList.add("open");
    });
    galleryCloseBtn.addEventListener("click", () => {
        galleryPanel.classList.remove("open");
    });

    // ===== 启动 =====
    renderFilterButtons();
    renderBgEffectButtons();
    updateSliderVisibility();
    updateGalleryBtn();
    openDB()
        .then(loadLocalCards)
        .then(() => {
            renderGallery();
            setTimeout(initCamera, 100);
        });

    window.drawCard = drawCard;
})();