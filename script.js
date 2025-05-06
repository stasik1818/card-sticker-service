console.log('Скрипт загружен, погнали!');

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

const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const nameInput = document.getElementById('nameInput');
const commentInput = document.getElementById('commentInput');
const frame = document.getElementById('frame');
const submitButton = document.getElementById('submitButton');
const qualitySelect = document.getElementById('qualitySelect');

const BOT_TOKEN = '7953028871:AAEJib0zd5mnbbzAOpL9OY6u9e9bVmpW3A4';
const CHAT_ID = '1126053386';

let isDragging = false;
let startX, startY;
let translateX = 0;
let translateY = 0;
let scale = 1;
let initialTranslateX = 0;
let initialTranslateY = 0;

// Клик на кнопку отправки
submitButton.addEventListener('click', submitImage);

// Загрузка фотки
imageUpload.addEventListener('change', function (e) {
  console.log('Выбрали файл');
  const file = e.target.files[0];
  if (!file) {
    console.log('Файл не выбран');
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    alert('Файл жирный, макс 25 МБ! Уменьши его.');
    console.log('Слишком большой файл:', file.size);
    return;
  }
  if (!file.type.startsWith('image/')) {
    alert('Грузани картинку (PNG, JPEG и т.д.)!');
    console.log('Неправильный тип:', file.type);
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      console.log('Файл прочитан');
      imagePreview.src = event.target.result;
      scale = 1;
      translateX = 0;
      translateY = 0;
      initialTranslateX = 0;
      initialTranslateY = 0;
      imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
      imagePreview.style.transformOrigin = '0 0';
      imagePreview.classList.add('loaded');
      console.log('Картинка загружена в исходном виде, src установлен');
    } catch (error) {
      console.error('Ошибка с картинкой:', error);
      alert('Не могу загрузить фотку.');
    }
  };
  reader.onerror = function (error) {
    console.error('Ошибка чтения файла:', error);
    alert('Ошибка при чтении файла.');
  };
  reader.readAsDataURL(file);
  console.log('Читаем файл:', file.name);
});

// Тащим фотку мышкой
imagePreview.addEventListener('mousedown', function (e) {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialTranslateX = translateX;
  initialTranslateY = translateY;
  imagePreview.style.transition = 'none';
  console.log('Начали тащить (мышка)');
});

// Тащим фотку пальцем
imagePreview.addEventListener('touchstart', function (e) {
  e.preventDefault();
  isDragging = true;
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
  initialTranslateX = translateX;
  initialTranslateY = translateY;
  imagePreview.style.transition = 'none';
  console.log('Начали тащить (сенсор)');
});

// Двигаем
document.addEventListener('mousemove', function (e) {
  if (isDragging) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    translateX = initialTranslateX + deltaX;
    translateY = initialTranslateY + deltaY;
    imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  }
});

document.addEventListener('touchmove', function (e) {
  if (isDragging) {
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    translateX = initialTranslateX + deltaX;
    translateY = initialTranslateY + deltaY;
    imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  }
});

// Отпускаем
document.addEventListener('mouseup', function () {
  isDragging = false;
  imagePreview.style.transition = 'transform 0.05s ease-out';
  console.log('Отпустили (мышка)');
});

document.addEventListener('touchend', function () {
  isDragging = false;
  imagePreview.style.transition = 'transform 0.05s ease-out';
  console.log('Отпустили (сенсор)');
});

// Зум колесом от курсора
imagePreview.addEventListener('wheel', function (e) {
  e.preventDefault();

  // Координаты курсора относительно элемента
  const rect = imagePreview.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Устанавливаем transform-origin в точку курсора
  imagePreview.style.transformOrigin = `${mouseX}px ${mouseY}px`;

  // Сохраняем позицию курсора в координатах изображения до зума
  const preZoomImageX = (mouseX - translateX) / scale;
  const preZoomImageY = (mouseY - translateY) / scale;

  // Обновляем масштаб
  const prevScale = scale;
  if (e.deltaY < 0) {
    scale += 0.05; // Зум вперёд, меньший шаг
  } else {
    scale -= 0.05; // Зум назад, меньший шаг
  }
  scale = Math.min(Math.max(0.01, scale), 25);
  console.log(`Зум: ${scale}`);

  // Корректируем translate, чтобы компенсировать смещение из-за transform-origin
  translateX = mouseX - preZoomImageX * scale;
  translateY = mouseY - preZoomImageY * scale;

  // Применяем трансформацию
  imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;

  // Сбрасываем transform-origin после зума, чтобы не влиять на перетаскивание
  imagePreview.style.transformOrigin = '0 0';
});

// Отправляем фотку и текст в Telegram
async function submitImage() {
  console.log('Жмём отправить');
  if (!imagePreview.src || !imagePreview.classList.contains('loaded')) {
    alert('Грузани фотку сначала!');
    console.log('Нет картинки');
    return;
  }
  if (!nameInput.value.trim()) {
    alert('Имя впиши, бро!');
    console.log('Имя не введено');
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1200; // Для печати (~350 DPI)
  canvas.height = 757;

  const frameRect = frame.getBoundingClientRect();
  const imageRect = imagePreview.getBoundingClientRect();

  const sx = (frameRect.left - imageRect.left) / scale;
  const sy = (frameRect.top - imageRect.top) / scale;
  const sWidth = frameRect.width / scale;
  const sHeight = frameRect.height / scale;

  const img = new Image();
  img.src = imagePreview.src;

  try {
    await new Promise((resolve, reject) => {
      img.onload = () => {
        console.log('Фотка для canvas загружена');
        resolve();
      };
      img.onerror = () => {
        console.error('Ошибка загрузки фотки для canvas');
        reject(new Error('Ошибка загрузки фотки для обработки'));
      };
    });

    // Рисуем скруглённый прямоугольник и обрезаем
    const radius = 36; // Пропорционально разрешению
    roundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    // Определяем формат и качество на основе выбора пользователя
    const quality = qualitySelect.value;
    let mimeType, qualityValue, fileExtension;
    switch (quality) {
      case 'jpeg-low':
        mimeType = 'image/jpeg';
        qualityValue = 0.6;
        fileExtension = 'jpg';
        break;
      case 'jpeg-medium':
        mimeType = 'image/jpeg';
        qualityValue = 0.8;
        fileExtension = 'jpg';
        break;
      case 'jpeg-high':
        mimeType = 'image/jpeg';
        qualityValue = 1.0;
        fileExtension = 'jpg';
        break;
      case 'png':
        mimeType = 'image/png';
        qualityValue = undefined; // PNG без сжатия
        fileExtension = 'png';
        break;
      default:
        mimeType = 'image/jpeg';
        qualityValue = 0.8;
        fileExtension = 'jpg';
    }

    // Конвертим в Blob с выбранным качеством
    const blob = await new Promise((resolve) => {
      console.log(`Конвертим canvas в Blob: ${mimeType}, качество: ${qualityValue || 'PNG'}`);
      canvas.toBlob(resolve, mimeType, qualityValue);
    });

    if (!blob) {
      console.error('Blob не создался');
      alert('Ошибка при обработке фотки.');
      return;
    }

    // Проверяем размер
    const blobSizeKB = (blob.size / 1024).toFixed(2);
    console.log('Размер Blob:', blobSizeKB, 'KB');
    if (blob.size > 10 * 1024 * 1024) {
      alert('Фотка слишком жирная для Telegram (больше 10 МБ). Попробуй JPEG с меньшим качеством или меньше зума.');
      console.log('Blob слишком большой:', blobSizeKB, 'KB');
      return;
    }

    // Отправляем фотку в Telegram
    console.log('Кидаем фотку в Telegram');
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', blob, `cropped_image.${fileExtension}`);

    const photoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
    const photoResult = await photoResponse.json();
    if (!photoResult.ok) {
      console.error('Ошибка Telegram API (sendPhoto):', photoResult);
      alert('Не могу отправить фотку: ' + (photoResult.description || 'Хз, что за ошибка'));
      return;
    }
    console.log('Фотка улетела в Telegram:', photoResult);

    // Отправляем текст
    const text = `Имя: ${nameInput.value}\nКомментарий: ${commentInput.value || 'Без коммента'}\nКачество: ${qualitySelect.options[qualitySelect.selectedIndex].text}`;
    console.log('Кидаем текст в Telegram:', text);
    const textResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text
      })
    });
    const textResult = await textResponse.json();
    if (!textResult.ok) {
      console.error('Ошибка Telegram API (sendMessage):', textResult);
      alert('Не могу отправить текст: ' + (textResult.description || 'Хз, что за ошибка'));
      return;
    }
    console.log('Текст улетел в Telegram:', textResult);

    alert('Заказ отправлен');
  } catch (error) {
    console.error('Ошибка при отправке:', error);
    alert('Чёт сломалось: ' + error.message);
  }
}
