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
let pinchStartDistance = 0;
let pinchStartScale = 1;

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
      // Ждём загрузки изображения
      imagePreview.onload = function() {
        const frameRect = frame.getBoundingClientRect();
        const frameWidth = frameRect.width;
        const frameHeight = frameRect.height;
        const imageWidth = imagePreview.naturalWidth;
        const imageHeight = imagePreview.naturalHeight;
        // Рассчитываем масштаб, чтобы изображение влезло в окно
        let initialScale = Math.min(frameWidth / imageWidth, frameHeight / imageHeight);
        // Если изображение меньше окна, масштаб = 1
        if (imageWidth <= frameWidth && imageHeight <= frameHeight) {
          initialScale = 1;
        }
        // Центрируем изображение
        const scaledWidth = imageWidth * initialScale;
        const scaledHeight = imageHeight * initialScale;
        let initialTranslateX = (frameWidth - scaledWidth) / 2;
        let initialTranslateY = (frameHeight - scaledHeight) / 2;
        // Устанавливаем глобальные переменные
        translateX = initialTranslateX;
        translateY = initialTranslateY;
        scale = initialScale;
        // Применяем трансформацию
        imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
        imagePreview.style.transformOrigin = '0 0';
        imagePreview.classList.add('loaded');
        console.log('Картинка загружена и отмасштабирована, src установлен', { initialScale, translateX, translateY });
      };
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
  const touches = e.touches;
  if (touches.length === 1) {
    isDragging = true;
    startX = touches[0].clientX;
    startY = touches[0].clientY;
    initialTranslateX = translateX;
    initialTranslateY = translateY;
    imagePreview.style.transition = 'none';
    console.log('Начали тащить (сенсор, 1 палец)');
  } else if (touches.length === 2) {
    isDragging = false;
    // Начало зума пальцами
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    pinchStartDistance = Math.sqrt(dx * dx + dy * dy);
    pinchStartScale = scale;
    // Центр между пальцами
    const midX = (touches[0].clientX + touches[1].clientX) / 2 - frame.getBoundingClientRect().left;
    const midY = (touches[0].clientY + touches[1].clientY) / 2 - frame.getBoundingClientRect().top;
    imagePreview.style.transformOrigin = `${midX}px ${midY}px`;
    console.log('Начали зум пальцами');
  }
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
  e.preventDefault();
  const touches = e.touches;
  if (touches.length === 1 && isDragging) {
    const deltaX = touches[0].clientX - startX;
    const deltaY = touches[0].clientY - startY;
    translateX = initialTranslateX + deltaX;
    translateY = initialTranslateY + deltaY;
    imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  } else if (touches.length === 2) {
    // Зум пальцами
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scaleChange = distance / pinchStartDistance;
    scale = pinchStartScale * scaleChange;
    scale = Math.min(Math.max(0.01, scale), 10);
    console.log(`Зум пальцами: ${scale}`);
    imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  }
});

// Отпускаем
document.addEventListener('mouseup', function () {
  isDragging = false;
  imagePreview.style.transition = 'transform 0.05s ease-out';
  console.log('Отпустили (мышка)');
});

document.addEventListener('touchend', function (e) {
  isDragging = false;
  if (e.touches.length < 2) {
    imagePreview.style.transformOrigin = '0 0';
    imagePreview.style.transition = 'transform 0.05s ease-out';
    console.log('Отпустили (сенсор или конец зума пальцами)');
  }
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
    scale += 0.05; // Зум вперёд
  } else {
    scale -= 0.05; // Зум назад
  }
  scale = Math.min(Math.max(0.01, scale), 10);
  console.log(`Зум колесом: ${scale}`);

  // Корректируем translate, чтобы компенсировать смещение из-за transform-origin
  translateX = mouseX - preZoomImageX * scale;
  translateY = mouseY - preZoomImageY * scale;

  // Применяем трансформацию
  imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;

  // Сбрасываем transform-origin после зума
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
  const pixelRatio = window.devicePixelRatio || 1;

  // Рассчитываем координаты рамки относительно изображения
  let sx = (frameRect.left - imageRect.left) / scale;
  let sy = (frameRect.top - imageRect.top) / scale;
  let sWidth = frameRect.width / scale;
  let sHeight = frameRect.height / scale;

  console.log('Координаты для обрезки:', { sx, sy, sWidth, sHeight, scale, pixelRatio });

  // Проверяем корректность координат
  if (sWidth <= 0 || sHeight <= 0 || isNaN(sx) || isNaN(sy) || isNaN(sWidth) || isNaN(sHeight)) {
    console.error('Некорректные размеры области:', { sx, sy, sWidth, sHeight });
    alert('Ошибка: некорректная область изображения.');
    return;
  }

  const img = new Image();
  img.src = imagePreview.src;

  try {
    await new Promise((resolve, reject) => {
      img.onload = () => {
        console.log('Фотка для canvas загружена', { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
        resolve();
      };
      img.onerror = () => {
        console.error('Ошибка загрузки фотки для canvas');
        reject(new Error('Ошибка загрузки фотки для обработки'));
      };
    });

    // Проверяем, что координаты не выходят за пределы изображения
    sx = Math.max(0, Math.min(sx, img.naturalWidth - sWidth));
    sy = Math.max(0, Math.min(sy, img.naturalHeight - sHeight));
    sWidth = Math.min(sWidth, img.naturalWidth - sx);
    sHeight = Math.min(sHeight, img.naturalHeight - sy);

    console.log('Скорректированные координаты:', { sx, sy, sWidth, sHeight });

    // Рассчитываем пропорции для рендеринга
    const sourceAspect = sWidth / sHeight;
    const canvasAspect = canvas.width / canvas.height;
    let destWidth, destHeight, destX, destY;

    // Масштабируем, чтобы изображение влезло без растяжения
    const scaleFactor = Math.min(canvas.width / sWidth, canvas.height / sHeight);
    destWidth = sWidth * scaleFactor;
    destHeight = sHeight * scaleFactor;

    // Центрируем изображение
    destX = (canvas.width - destWidth) / 2;
    destY = (canvas.height - destHeight) / 2;

    console.log('Параметры рендеринга:', { destWidth, destHeight, destX, destY, scaleFactor });

    // Заполняем фон чёрным для letterbox
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем скруглённый прямоугольник и обрезаем
    const radius = 36; // Пропорционально разрешению
    roundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sWidth, sHeight, destX, destY, destWidth, destHeight);

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
