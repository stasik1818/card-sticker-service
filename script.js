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
const textName = document.getElementById('textName');
const textComment = document.getElementById('textComment');

// Безопасное хранение токена (в реальном проекте используйте сервер)
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
  frame.style.width = `${containerWidth}px`;
  frame.style.height = `${frameHeight}px`;
}

// Обновление чипа и рамки
function updateChipAndBorder() {
  const frameRect = frame.getBoundingClientRect();
  
  // Позиция чипа
  chip.style.width = `${frameRect.width * CHIP_POSITION.width}px`;
  chip.style.height = `${frameRect.height * CHIP_POSITION.height}px`;
  chip.style.left = `${frameRect.width * CHIP_POSITION.x}px`;
  chip.style.top = `${frameRect.height * CHIP_POSITION.y}px`;

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
        `translate3d(${translateX}px, ${translateY}px, 0) 
         scale(${scale})`;
      imagePreview.classList.add('loaded');
      updateChipAndBorder();
    };
  };
  reader.readAsDataURL(file);
});

// Обработчики текстовых полей
nameInput.addEventListener('input', function() {
  textName.textContent = this.value;
});

commentInput.addEventListener('input', function() {
  textComment.textContent = this.value;
});

// Функции для перемещения и масштабирования
function dragStart(e) {
  e.preventDefault();
  isDragging = true;
  startX = e.clientX - translateX;
  startY = e.clientY - translateY;
  imagePreview.style.cursor = 'grabbing';
}

function dragMove(e) {
  if (!isDragging) return;
  translateX = e.clientX - startX;
  translateY = e.clientY - startY;
  applyTransform();
}

function dragEnd() {
  isDragging = false;
  imagePreview.style.cursor = 'grab';
}

function touchStart(e) {
  if (e.touches.length === 1) {
    isDragging = true;
    startX = e.touches[0].clientX - translateX;
    startY = e.touches[0].clientY - translateY;
  } else if (e.touches.length === 2) {
    isDragging = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchStartDistance = Math.sqrt(dx * dx + dy * dy);
    pinchStartScale = scale;
  }
}

function touchMove(e) {
  if (isDragging && e.touches.length === 1) {
    translateX = e.touches[0].clientX - startX;
    translateY = e.touches[0].clientY - startY;
    applyTransform();
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    scale = pinchStartScale * distance / pinchStartDistance;
    scale = Math.max(0.5, Math.min(scale, 3));
    applyTransform();
  }
}

function touchEnd(e) {
  if (e.touches.length === 0) {
    isDragging = false;
  }
}

function zoom(e) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  const newScale = scale + delta;
  scale = Math.max(0.5, Math.min(newScale, 3));
  applyTransform();
}

function applyTransform() {
  imagePreview.style.transform = 
    `translate3d(${translateX}px, ${translateY}px, 0) 
     scale(${scale})`;
}

// Функция отправки изображения
async function submitImage() {
  if (!imagePreview.src || !nameInput.value.trim()) {
    alert('Заполните обязательные поля!');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Отправка...';
  
  try {
    // Создаем canvas для финального изображения
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 757;

    // Получаем координаты для обрезки
    const frameRect = frame.getBoundingClientRect();
    const sx = (frameRect.left - imagePreview.getBoundingClientRect().left) / scale;
    const sy = (frameRect.top - imagePreview.getBoundingClientRect().top) / scale;
    const sWidth = frameRect.width / scale;
    const sHeight = frameRect.height / scale;

    // Загружаем изображение
    const img = new Image();
    img.src = imagePreview.src;
    await new Promise((resolve) => img.onload = resolve);
    
    // Рисуем скругленную карту
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    roundedRect(ctx, 0, 0, canvas.width, canvas.height, 36);
    ctx.clip();
    
    // Масштабируем и рисуем изображение
    const scaleFactor = Math.min(
      canvas.width / sWidth, 
      canvas.height / sHeight
    );
    const destWidth = sWidth * scaleFactor;
    const destHeight = sHeight * scaleFactor;
    const destX = (canvas.width - destWidth) / 2;
    const destY = (canvas.height - destHeight) / 2;
    ctx.drawImage(img, sx, sy, sWidth, sHeight, destX, destY, destWidth, destHeight);

    // Рисуем чип
    const chipX = canvas.width * CHIP_POSITION.x;
    const chipY = canvas.height * CHIP_POSITION.y;
    const chipWidth = canvas.width * CHIP_POSITION.width;
    const chipHeight = canvas.height * CHIP_POSITION.height;
    
    ctx.fillStyle = '#d9c8a9';
    ctx.fillRect(chipX, chipY, chipWidth, chipHeight);
    
    // Рисуем текст
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(nameInput.value, canvas.width * 0.05, canvas.height * 0.9);
    
    ctx.font = '36px Arial';
    ctx.fillText(commentInput.value, canvas.width * 0.05, canvas.height * 0.8);

    // Определяем качество
    let quality = 0.8;
    let format = 'image/jpeg';
    switch(qualitySelect.value) {
      case 'jpeg-low': quality = 0.6; break;
      case 'jpeg-medium': quality = 0.8; break;
      case 'jpeg-high': quality = 0.95; break;
      case 'png': 
        format = 'image/png';
        quality = 1.0;
        break;
    }

    // Конвертируем в Blob и отправляем
    canvas.toBlob(blob => {
      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append('photo', blob, 'card.jpg');
      formData.append('caption', `Имя: ${nameInput.value}\nКомментарий: ${commentInput.value}`);

      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          alert('Изображение успешно отправлено!');
        } else {
          alert('Ошибка отправки: ' + JSON.stringify(data));
        }
      })
      .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка при отправке: ' + error.message);
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Отправить';
      });
    }, format, quality);
    
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Ошибка при обработке: ' + error.message);
    submitButton.disabled = false;
    submitButton.textContent = 'Отправить';
  }
}

// Инициализация обработчиков событий
submitButton.addEventListener('click', submitImage);
imagePreview.addEventListener('mousedown', dragStart);
imagePreview.addEventListener('touchstart', touchStart, { passive: false });
document.addEventListener('mousemove', dragMove);
document.addEventListener('touchmove', touchMove, { passive: false });
document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchend', touchEnd);
imagePreview.addEventListener('wheel', zoom, { passive: false });
