console.log('script.js loaded');

// Функция для рисования скруглённого прямоугольника
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

// Инициализация EmailJS
function initEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.error('EmailJS not loaded, retrying in 500ms');
    setTimeout(initEmailJS, 500);
    return;
  }
  try {
    emailjs.init("LLTnqHOpCj7sKSuda");
    console.log('EmailJS initialized');
  } catch (error) {
    console.error('EmailJS initialization failed:', error);
  }
}
initEmailJS();

const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const nameInput = document.getElementById('nameInput');
const commentInput = document.getElementById('commentInput');
const frame = document.getElementById('frame');
const submitButton = document.getElementById('submitButton');

let isDragging = false;
let startX, startY;
let translateX = 0;
let translateY = 0;
let scale = 1;
let initialTranslateX = 0;
let initialTranslateY = 0;

// Обработчик кнопки отправки
submitButton.addEventListener('click', submitImage);

// Загрузка изображения
imageUpload.addEventListener('change', function (e) {
  console.log('File input changed');
  const file = e.target.files[0];
  if (!file) {
    console.log('No file selected');
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    alert('Файл слишком большой! Максимум 25 МБ. Пожалуйста, уменьшите размер файла.');
    console.log('File too large:', file.size);
    return;
  }
  if (!file.type.startsWith('image/')) {
    alert('Пожалуйста, выберите изображение (PNG, JPEG и т.д.).');
    console.log('Invalid file type:', file.type);
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      console.log('FileReader loaded data');
      imagePreview.src = event.target.result;
      scale = 1;
      translateX = 0;
      translateY = 0;
      initialTranslateX = 0;
      initialTranslateY = 0;
      imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
      imagePreview.classList.add('loaded');
      console.log('Image loaded successfully, src set');
    } catch (error) {
      console.error('Error setting image:', error);
      alert('Ошибка при загрузке изображения.');
    }
  };
  reader.onerror = function (error) {
    console.error('FileReader error:', error);
    alert('Ошибка при чтении файла.');
  };
  reader.readAsDataURL(file);
  console.log('FileReader started reading:', file.name);
});

// Перетаскивание мышью
imagePreview.addEventListener('mousedown', function (e) {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  initialTranslateX = translateX;
  initialTranslateY = translateY;
  imagePreview.style.transition = 'none';
  console.log('Drag started (mouse)');
});

// Перетаскивание сенсором
imagePreview.addEventListener('touchstart', function (e) {
  e.preventDefault();
  isDragging = true;
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
  initialTranslateX = translateX;
  initialTranslateY = translateY;
  imagePreview.style.transition = 'none';
  console.log('Drag started (touch)');
});

// Движение
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

// Конец перетаскивания
document.addEventListener('mouseup', function () {
  isDragging = false;
  imagePreview.style.transition = 'transform 0.05s ease-out';
  console.log('Drag ended (mouse)');
});

document.addEventListener('touchend', function () {
  isDragging = false;
  imagePreview.style.transition = 'transform 0.05s ease-out';
  console.log('Drag ended (touch)');
});

// Масштабирование колесом мыши
imagePreview.addEventListener('wheel', function (e) {
  e.preventDefault();
  if (e.deltaY < 0) {
    scale += 0.1;
  } else {
    scale -= 0.1;
  }
  scale = Math.min(Math.max(0.01, scale), 25);
  imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  console.log(`Scale updated to: ${scale}`);
});

// Отправка изображения
function submitImage() {
  if (!imagePreview.src || !imagePreview.classList.contains('loaded')) {
    alert('Сначала загрузите изображение!');
    console.log('No image loaded');
    return;
  }
  if (!nameInput.value.trim()) {
    alert('Пожалуйста, введите ваше имя.');
    console.log('No name entered');
    return;
  }
  if (typeof emailjs === 'undefined') {
    alert('EmailJS не загружен. Пожалуйста, попробуйте позже.');
    console.log('EmailJS not loaded');
    return;
  }

  console.log('Submit button clicked');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1011; // ~300 DPI
  canvas.height = 638;

  const frameRect = frame.getBoundingClientRect();
  const imageRect = imagePreview.getBoundingClientRect();

  const sx = (frameRect.left - imageRect.left) / scale;
  const sy = (frameRect.top - imageRect.top) / scale;
  const sWidth = frameRect.width / scale;
  const sHeight = frameRect.height / scale;

  const img = new Image();
  img.src = imagePreview.src;

  img.onload = () => {
    try {
      console.log('Canvas image loaded');
      // Рисуем скруглённый прямоугольник и обрезаем
      const radius = 30;
      roundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);
      ctx.clip();
      // Рисуем изображение
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      const base64data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      const base64SizeKB = (base64data.length * 3 / 4 / 1024).toFixed(2);
      console.log('Base64 data size:', base64SizeKB, 'KB');

      // Проверка размера base64-данных
      if (base64SizeKB > 2000) {
        alert('Обрезанное изображение слишком большое для отправки (более 2 МБ). Пожалуйста, уменьшите масштаб или используйте менее детализированное изображение.');
        console.log('Base64 data too large:', base64SizeKB, 'KB');
        return;
      }

      console.log('Sending EmailJS request');
      emailjs.send('service_91166rkvva2', 'template_1e7wmua', {
        name: nameInput.value,
        comment: commentInput.value,
        image_data: base64data
      }).then(() => {
        alert('Заказ отправлен на почту!');
        console.log('Order sent via EmailJS');
      }).catch((error) => {
        console.error('Ошибка отправки:', error);
        alert('Ошибка при отправке заказа: ' + (error.text || 'Неизвестная ошибка'));
      });

      canvas.toBlob((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cropped_image.jpg';
        link.click();
        window.URL.revokeObjectURL(url);
        console.log('Image downloaded, size:', (blob.size / 1024).toFixed(2), 'KB');
      }, 'image/jpeg', 0.7);
    } catch (error) {
      console.error('Error processing canvas:', error);
      alert('Ошибка при обработке изображения.');
    }
  };
  img.onerror = function () {
    console.error('Error loading image for canvas');
    alert('Ошибка при загрузке изображения для обработки.');
  };
}
