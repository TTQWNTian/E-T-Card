(function() {
    // ===== 弹窗管理 =====
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalImg = document.getElementById('modalImg');
    const modalButtons = document.getElementById('modalButtons');
    
    function showModal(title, desc, imgSrc, buttons) {
        modalTitle.textContent = title;
        modalDesc.textContent = desc || '';
        if (imgSrc) {
            modalImg.src = imgSrc;
            modalImg.style.display = 'block';
        } else {
            modalImg.style.display = 'none';
        }
        modalButtons.innerHTML = '';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.label;
            button.className = btn.className || 'btn-primary';
            button.addEventListener('click', btn.action);
            modalButtons.appendChild(button);
        });
        modalOverlay.classList.add('active');
    }
    
    function closeModal() {
        modalOverlay.classList.remove('active');
    }
    
    // ===== 全屏引导 =====
    function showFullscreenModal() {
        showModal(
            '电子透卡',
            '点击下方按钮进入全屏模式，获得更好的拍摄体验',
            null,
            [
            {
                label: '进入全屏',
                className: 'btn-primary btn-full',
                action: function() {
                    const el = document.documentElement;
                    if (el.requestFullscreen) {
                        el.requestFullscreen();
                    } else if (el.webkitRequestFullscreen) {
                        el.webkitRequestFullscreen();
                    } else if (el.msRequestFullscreen) {
                        el.msRequestFullscreen();
                    }
                    closeModal();
                    setTimeout(() => {
                        if (!cameraReady) {
                            initCamera();
                        }
                    }, 300);
                }
            }]
        );
    }
    
    // ===== 结果弹窗 =====
    function showResultModal(imageDataUrl) {
        showModal(
            '拍摄完成',
            '',
            imageDataUrl,
            [
            {
                label: '取消',
                className: 'btn-secondary',
                action: function() {
                    closeModal();
                    statusHint.textContent = '相机已就绪';
                }
            },
            {
                label: '保存',
                className: 'btn-primary',
                action: function() {
                    const link = document.createElement('a');
                    link.download = '电子透卡_' + new Date().getTime() + '.png';
                    link.href = imageDataUrl;
                    link.click();
                    statusHint.textContent = '已保存';
                    closeModal();
                }
            }]
        );
    }
    
    // ===== 透卡数据 =====
    const cardPresets = [
        { label: '无', dataUrl: null, width: 400, height: 400 },
        { label: '本当の愛', dataUrl: 'assets/cards/1.png', width: 1080, height: 1527 },
        { label: '测试1', dataUrl: 'test1.png', width: 800, height: 600 },
        { label: '测试2', dataUrl: 'test2.png', width: 1200, height: 800 },
        { label: '测试3', dataUrl: 'test3.png', width: 600, height: 900 },
    ];
    
    // ===== DOM引用 =====
    const video = document.getElementById('video');
    const cardCanvas = document.getElementById('cardCanvas');
    const ctx = cardCanvas.getContext('2d');
    const cardContainer = document.getElementById('cardContainer');
    const dashedBorder = document.getElementById('dashedBorder');
    const videoContainer = document.getElementById('videoContainer');
    const cardOptions = document.getElementById('cardOptions');
    const captureBtn = document.getElementById('captureBtn');
    const statusHint = document.getElementById('statusHint');
    const cardInfo = document.getElementById('cardInfo');
    
    // ===== 状态 =====
    let currentStream = null;
    let cameraReady = false;
    let activeIndex = 0;
    let selectedCardDataUrl = null;
    let cardWidth = 400,
        cardHeight = 400;
    
    // ===== 渲染透卡按钮 =====
    function renderCardButtons() {
        cardOptions.innerHTML = '';
        cardPresets.forEach((card, index) => {
            const btn = document.createElement('button');
            btn.dataset.index = index;
            btn.dataset.url = card.dataUrl || '';
            btn.dataset.w = card.width;
            btn.dataset.h = card.height;
            btn.className = (index === activeIndex) ? 'active' : '';
            btn.textContent = card.label;
            
            btn.addEventListener('click', function() {
                document.querySelectorAll('#cardOptions button').forEach(b => {
                    b.className = '';
                });
                this.className = 'active';
                
                activeIndex = parseInt(this.dataset.index);
                const selected = cardPresets[activeIndex];
                selectedCardDataUrl = selected.dataUrl;
                cardWidth = selected.width;
                cardHeight = selected.height;
                
                statusHint.textContent = '相机已就绪';
                
                updateCardSize(cardWidth, cardHeight);
                cardInfo.textContent = selected.dataUrl ? selected.label + ' (' + cardWidth + '×' + cardHeight + ')' : '无透卡';
                if (cameraReady) {
                    drawCard();
                }
            });
            cardOptions.appendChild(btn);
        });
    }
    
    // ===== 更新透卡尺寸 =====
    function updateCardSize(w, h) {
        const containerRect = videoContainer.getBoundingClientRect();
        const containerW = containerRect.width - 40;
        const containerH = containerRect.height - 40;
        
        const scaleX = containerW / w;
        const scaleY = containerH / h;
        const scale = Math.min(scaleX, scaleY, 1);
        
        const displayW = w * scale;
        const displayH = h * scale;
        
        cardContainer.style.width = displayW + 'px';
        cardContainer.style.height = displayH + 'px';
        
        cardCanvas.width = w;
        cardCanvas.height = h;
        cardCanvas.style.width = displayW + 'px';
        cardCanvas.style.height = displayH + 'px';
        
        dashedBorder.style.width = displayW + 'px';
        dashedBorder.style.height = displayH + 'px';
    }
    
    // ===== 绘制透卡 =====
    function drawCard() {
        const w = cardCanvas.width;
        const h = cardCanvas.height;
        ctx.clearRect(0, 0, w, h);
        
        if (!selectedCardDataUrl) {
            statusHint.textContent = '相机已就绪';
            return;
        }
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = selectedCardDataUrl;
        if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, 0, 0, w, h);
            statusHint.textContent = '相机已就绪';
        } else {
            img.onload = function() {
                ctx.drawImage(img, 0, 0, w, h);
                statusHint.textContent = '相机已就绪';
            };
            img.onerror = function() {
                statusHint.textContent = '透卡加载失败';
            };
        }
    }
    
    // ===== 初始化摄像头 =====
    async function initCamera() {
        try {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStream = stream;
            video.srcObject = stream;
            await video.play();
            
            cameraReady = true;
            statusHint.textContent = '相机已就绪';
            captureBtn.disabled = false;
            
            const defaultCard = cardPresets[0];
            selectedCardDataUrl = defaultCard.dataUrl;
            cardWidth = defaultCard.width;
            cardHeight = defaultCard.height;
            activeIndex = 0;
            updateCardSize(cardWidth, cardHeight);
            drawCard();
            document.querySelectorAll('#cardOptions button').forEach((b, i) => {
                b.className = (i === activeIndex) ? 'active' : '';
            });
            cardInfo.textContent = defaultCard.label + ' (' + cardWidth + '×' + cardHeight + ')';
        } catch (err) {
            statusHint.textContent = '无法访问摄像头';
            captureBtn.disabled = true;
            cameraReady = false;
        }
    }
    
    // ===== 拍照 =====
    function capturePhoto() {
        if (!cameraReady) {
            statusHint.textContent = '相机未就绪';
            return;
        }
        
        const w = cardCanvas.width;
        const h = cardCanvas.height;
        
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = w;
        captureCanvas.height = h;
        const cctx = captureCanvas.getContext('2d');
        
        const containerRect = videoContainer.getBoundingClientRect();
        const cardRect = cardContainer.getBoundingClientRect();
        
        const videoRect = video.getBoundingClientRect();
        const sx = (cardRect.left - videoRect.left) / videoRect.width * video.videoWidth;
        const sy = (cardRect.top - videoRect.top) / videoRect.height * video.videoHeight;
        const sw = cardRect.width / videoRect.width * video.videoWidth;
        const sh = cardRect.height / videoRect.height * video.videoHeight;
        
        cctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
        
        if (selectedCardDataUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = selectedCardDataUrl;
            if (img.complete && img.naturalWidth > 0) {
                cctx.drawImage(img, 0, 0, w, h);
                showResultModal(captureCanvas.toDataURL('image/png'));
            } else {
                img.onload = function() {
                    cctx.drawImage(img, 0, 0, w, h);
                    showResultModal(captureCanvas.toDataURL('image/png'));
                };
                img.onerror = function() {
                    statusHint.textContent = '透卡加载失败';
                    showResultModal(captureCanvas.toDataURL('image/png'));
                };
                return;
            }
        } else {
            showResultModal(captureCanvas.toDataURL('image/png'));
        }
    }
    
    // ===== 窗口自适应 =====
    function handleResize() {
        if (cameraReady) {
            updateCardSize(cardWidth, cardHeight);
        }
    }
    
    // ===== 事件绑定 =====
    captureBtn.addEventListener('click', capturePhoto);
    window.addEventListener('resize', handleResize);
    
    document.addEventListener('fullscreenchange', function() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (!cameraReady) {
                showFullscreenModal();
            }
        }
    });
    
    // ===== 启动 =====
    renderCardButtons();
    showFullscreenModal();
    
    setTimeout(() => {
        if (!cameraReady) {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                initCamera();
            }
        }
    }, 100);
    
    window.drawCard = drawCard;
})();