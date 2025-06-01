console.log('Скрипт загружен, погнали!');

// Константы для карты
const CARD_RATIO = 85.60 / 53.98; // Соотношение сторон карты
const CHIP_POSITION = { x: 0.12, y: 0.08, width: 0.15, height: 0.1 }; // Позиция чипа

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
const qualitySelect = document.getElementById('qualitySelect');
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

// Обновление размеров фрейма
function updateFrameSize() {
  const containerWidth = Math.min(428, window.innerWidth * 0.9);
  const frameHeight = containerWidth / CARD_RATIO;
  frame.style.width = containerWidth + 'px';
  frame.style.height = frameHeight + 'px';
}

// Обновление чипа и рамки
function updateChipAndBorder() {
  const frameRect = frame.getBoundingClientRect();
  
  // Позиция чипа
  chip.style.width = frameRect.width * CHIP_POSITION.width + 'px';
  chip.style.height = frameRect.height * CHIP_POSITION.height + 'px';
  chip.style.left = frameRect.width * CHIP_POSITION.x + 'px';
  chip.style.top = frameRect.height * CHIP_POSITION.y + 'px';

  // Автоматический цвет рамки
  if (imagePreview.src) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1;
    canvas.height = 1;
    ctx.drawImage(imagePreview, 
      translateX + frameRect.width * 0.5, 
      translateY + frameRect.height * 0.5, 
      1, 1, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    frame.style.borderColor = luminance > 128 ? 
      'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
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
    imagePreview.src = event.target.result;
    imagePreview.onload = function() {
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

      translateX = (frameRect.width - imageWidth * initialScale) / 2;
      translateY = (frameRect.height - imageHeight * initialScale) / 2;
      scale = initialScale;

      imagePreview.style.transform = 
        `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      imagePreview.classList.add('loaded');
      updateChipAndBorder();
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
  const sx = (frameRect.left - imagePreview.getBoundingClientRect().left) / scale;
  const sy = (frameRect.top - imagePreview.getBoundingClientRect().top) / scale;
  const sWidth = frameRect.width / scale;
  const sHeight = frameRect.height / scale;

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
