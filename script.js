console.log('Скрипт загружен!');

// Константы для карты и чипа
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;
const CARD_RATIO = CARD_WIDTH_MM / CARD_HEIGHT_MM;
const CHIP_LEFT_MM = 10; // 10 мм от левого края
const CHIP_TOP_MM = 19.5; // 19.5 мм от верхнего края
const CHIP_WIDTH_MM = 12; // 12 мм ширина
const CHIP_HEIGHT_MM = 9; // 9 мм высота
const CHIP_CORNER_RADIUS_MM = 1; // 1 мм закругления краёв

// Рисуем скруглённый прямоугольник для обрезки
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Элементы страницы
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const nameInput = document.getElementById('nameInput');
const commentInput = document.getElementById('commentInput');
const frame = document.getElementById('frame');
const submitButton = document.getElementById('submitButton');
const chip = document.getElementById('chip');

const BOT_TOKEN = '7953028871:AAEJib0zd5mnbbzAOpL9OY6u9e9bVmpW3A4';
const CHAT_ID = '1126053386';

// Переменные для управления изображением
let isDragging = false;
let startX, startY;
let translateX = 0;
let translateY = 0;
let scale = 1;
let initialTranslateX = 0;
let initialTranslateY = 0;
let pinchStartDistance = 0;
let pinchStartScale = 1;

// Инициализация размера фрейма
updateFrameSize();
updateChipAndBorder();

// Обновление размеров фрейма с сохранением пропорций карты
function updateFrameSize() {
  const maxWidth = Math.min(428, window.innerWidth * 0.9);
  const frameWidth = maxWidth;
  const frameHeight = frameWidth / CARD_RATIO;
  frame.style.width = frameWidth + 'px';
  frame.style.height = frameHeight + 'px';
}

// Обновление чипа и рамки
function updateChipAndBorder() {
  const frameRect = frame.getBoundingClientRect();
  const scale_frame = frameRect.width / CARD_WIDTH_MM;
  const chipLeft = CHIP_LEFT_MM * scale_frame;
  const chipTop = CHIP_TOP_MM * scale_frame;
  const chipWidth = CHIP_WIDTH_MM * scale_frame;
  const chipHeight = CHIP_HEIGHT_MM * scale_frame;
  const chipCornerRadius = CHIP_CORNER_RADIUS_MM * scale_frame;

  chip.style.left = chipLeft + 'px';
  chip.style.top = chipTop + 'px';
  chip.style.width = chipWidth + 'px';
  chip.style.height = chipHeight + 'px';
  chip.style.borderRadius = chipCornerRadius + 'px';

  if (imagePreview.src) {
    const fx = frameRect.width / 2;
    const fy = frameRect.height / 2;
    const px = (fx - translateX) / scale;
    const py = (fy - translateY) / scale;
    if (px >= 0 && px < imagePreview.naturalWidth && py >= 0 && py < imagePreview.naturalHeight) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1;
      canvas.height = 1;
      ctx.drawImage(imagePreview, px, py, 1, 1, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      frame.style.borderColor = luminance > 128 ? 
        'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
    } else {
      frame.style.borderColor = 'rgba(0,0,0,0.7)';
    }
  }
}

// Обработчик ресайза окна
window.addEventListener('resize', () => {
  updateFrameSize();
  updateChipAndBorder();
});

// Загрузка изображения
imageUpload.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 25 * 1024 * 1024) {
    alert('Максимальный размер файла - 25 МБ!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    console.log('Файл загружен как dataURL:', event.target.result);
    imagePreview.src = event.target.result;
    imagePreview.onload = function() {
      console.log('Изображение загружено, размеры:', imagePreview.naturalWidth, 'x', imagePreview.naturalHeight);
      const frameRect = frame.getBoundingClientRect();
      const imageWidth = imagePreview.naturalWidth;
      const imageHeight = imagePreview.naturalHeight;

      let initialScale = Math.min(
        frameRect.width / imageWidth,
        frameRect.height / imageHeight
      );

      if (imageWidth <= frameRect.width && imageHeight <= frameRect.height) {
        initialScale = 1;
      }

      const scaledWidth = imageWidth * initialScale;
      const scaledHeight = imageHeight * initialScale;
      translateX = (frameRect.width - scaledWidth) / 2;
      translateY = (frameRect.height - scaledHeight) / 2;
      scale = initialScale;

      imagePreview.style.position = 'absolute';
      imagePreview.style.left = '0';
      imagePreview.style.top = '0';
      imagePreview.style.transformOrigin = '0 0';
      imagePreview.style.transform = 
        `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      imagePreview.classList.add('loaded');
      updateChipAndBorder();
    };
    reader.onerror = function() {
      console.error('Ошибка при чтении файла:', reader.error);
      alert('Ошибка при загрузке изображения!');
    };
  };
  reader.readAsDataURL(file);
});

// Обработчики событий для перемещения
function dragStart(e) {
  isDragging = true;
  startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
  initialTranslateX = translateX;
  initialTranslateY = translateY;
}

function dragMove(e) {
  if (!isDragging) return;
  const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
  const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
  const dx = clientX - startX;
  const dy = clientY - startY;
  translateX = initialTranslateX + dx;
  translateY = initialTranslateY + dy;
  imagePreview.style.transform = 
    `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  updateChipAndBorder();
}

function dragEnd() {
  isDragging = false;
}

// Обработчики событий для зума
function touchStart(e) {
  if (e.touches.length === 2) {
    isDragging = false;
    pinchStartDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    pinchStartScale = scale;
  } else {
    dragStart(e);
  }
}

function touchMove(e) {
  if (e.touches.length === 2) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    scale = pinchStartScale * (currentDistance / pinchStartDistance);
    imagePreview.style.transform = 
      `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    updateChipAndBorder();
  } else if (isDragging) {
    dragMove(e);
  }
}

function touchEnd() {
  isDragging = false;
}

// Обработчик зума колесом мыши
function zoom(e) {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.1 : -0.1;
  scale = Math.max(0.1, scale + delta);
  imagePreview.style.transform = 
    `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  updateChipAndBorder();
}

// Функция отправки изображения
async function submitImage() {
  if (!imagePreview.src || !nameInput.value.trim() || !document.querySelector('input[name="photoQuality"]:checked')) {
    alert('Заполните обязательные поля!');
    return;
  }

  const qualityValue = document.querySelector('input[name="photoQuality"]:checked').value;
  let type;
  let quality;
  switch (qualityValue) {
    case 'jpegLow':
      type = 'image/jpeg';
      quality = 0.3;
      break;
    case 'jpegMedium':
      type = 'image/jpeg';
      quality = 0.6;
      break;
    case 'jpegHigh':
      type = 'image/jpeg';
      quality = 0.9;
      break;
    case 'pngMax':
      type = 'image/png';
      break;
    default:
      type = 'image/png';
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1200;
  canvas.height = 757;

  const frameRect = frame.getBoundingClientRect();
  const frameStyle = window.getComputedStyle(frame);
  const borderLeftWidth = parseFloat(frameStyle.borderLeftWidth);
  const borderTopWidth = parseFloat(frameStyle.borderTopWidth);
  const borderRightWidth = parseFloat(frameStyle.borderRightWidth);
  const borderBottomWidth = parseFloat(frameStyle.borderBottomWidth);
  const contentLeft = frameRect.left + borderLeftWidth;
  const contentTop = frameRect.top + borderTopWidth;
  const contentWidth = frameRect.width - borderLeftWidth - borderRightWidth;
  const contentHeight = frameRect.height - borderTopWidth - borderBottomWidth;

  const sx = (contentLeft - imagePreview.getBoundingClientRect().left) / scale;
  const sy = (contentTop - imagePreview.getBoundingClientRect().top) / scale;
  const sWidth = contentWidth / scale;
  const sHeight = contentHeight / scale;

  const img = new Image();
  img.src = imagePreview.src;

  try {
    await new Promise((resolve) => img.onload = resolve);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    roundedRect(ctx, 0, 0, canvas.width, canvas.height, 36);
    ctx.clip();
    
    const scaleFactor = Math.min(
      canvas.width / sWidth, 
      canvas.height / sHeight
    );
    const destWidth = sWidth * scaleFactor;
    const destHeight = sHeight * scaleFactor;
    const destX = (canvas.width - destWidth) / 2;
    const destY = (canvas.height - destHeight) / 2;

    ctx.drawImage(img, sx, sy, sWidth, sHeight, destX, destY, destWidth, destHeight);

    // Отрисовка чипа с закругленными углами
    const chipImg = document.getElementById('chipImage');
    const scaleCanvasX = canvas.width / CARD_WIDTH_MM;
    const chipCanvasLeft = CHIP_LEFT_MM * scaleCanvasX;
    const chipCanvasTop = CHIP_TOP_MM * scaleCanvasX;
    const chipCanvasWidth = CHIP_WIDTH_MM * scaleCanvasX;
    const chipCanvasHeight = CHIP_HEIGHT_MM * scaleCanvasX;
    const chipCornerRadiusCanvas = CHIP_CORNER_RADIUS_MM * scaleCanvasX;
    
    ctx.save();
    roundedRect(ctx, chipCanvasLeft, chipCanvasTop, chipCanvasWidth, chipCanvasHeight, chipCornerRadiusCanvas);
    ctx.clip();
    
    await new Promise((resolve) => {
      chipImg.onload = resolve;
      if (chipImg.complete) resolve();
    });
    ctx.drawImage(chipImg, chipCanvasLeft, chipCanvasTop, chipCanvasWidth, chipCanvasHeight);
    
    ctx.restore();

    const blob = await new Promise(resolve => {
      if (type === 'image/jpeg') {
        canvas.toBlob(resolve, type, quality);
      } else {
        canvas.toBlob(resolve, type);
      }
    });

    const extension = type === 'image/jpeg' ? 'jpg' : 'png';
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', blob, `sticker.${extension}`);
    if (nameInput.value.trim()) {
      formData.append('caption', nameInput.value.trim() + (commentInput.value.trim() ? ' ' + commentInput.value.trim() : ''));
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.ok) {
      alert('Изображение успешно отправлено!');
    } else {
      alert('Ошибка при отправке: ' + data.description);
    }
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Ошибка при обработке: ' + error.message);
  }
}

// Инициализация обработчиков событий
submitButton.addEventListener('click', submitImage);
imagePreview.addEventListener('mousedown', dragStart);
imagePreview.addEventListener('touchstart', touchStart);
document.addEventListener('mousemove', dragMove);
document.addEventListener('touchmove', touchMove);
document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchend', touchEnd);
imagePreview.addEventListener('wheel', zoom);
