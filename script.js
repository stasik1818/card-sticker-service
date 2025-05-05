console.log('script.js loaded');

// Ждём загрузки EmailJS
function initEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.error('EmailJS not loaded, retrying in 500ms');
    setTimeout(initEmailJS, 500);
    return;
  }
  emailjs.init("LLTnqHOpCj7sKSuda").then(() => {
    console.log('EmailJS initialized');
  }).catch((error) => {
    console.error('EmailJS initialization failed:', error);
  });
}
initEmailJS();

const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const nameInput = document.getElementById('nameInput');
const commentInput = document.getElementById('commentInput');
const frame = document.getElementById('frame');
let isDragging = false;
let offsetX, offsetY;
let scale = 1;
let translateX = 0;
let translateY = 0;

// Плавное перетаскивание
function updatePosition(clientX, clientY) {
  if (!isDragging) return;
  const frameRect = frame.getBoundingClientRect();
  translateX = clientX - offsetX - frameRect.left;
  translateY = clientY - offsetY - frameRect.top;
  imagePreview.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
}

// Загрузка изображения
imageUpload.addEventListener('change', function (e) {
  console.log('File input changed');
  const file = e.target.files[0];
  if (!file) {
    console.log('No file selected');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('Файл слишком большой! Максимум 10 МБ.');
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
  offsetX = e.clientX - translateX;
  offsetY = e.clientY - translateY;
  imagePreview.style.transition = 'none';
  console.log('Drag started (mouse)');
});

// Перетаскивание сенсором
imagePreview.addEventListener('touchstart', function (e) {
  e.preventDefault();
  isDragging = true;
  const touch = e.touches[0];
  offsetX = touch.clientX - translateX;
  offsetY = touch.clientY - translateY;
  imagePreview.style.transition = 'none';
  console.log('Drag started (touch)');
});

// Движение
document.addEventListener('mousemove', function (e) {
  if (isDragging) {
    requestAnimationFrame(() => updatePosition(e.clientX, e.clientY));
  }
});

document.addEventListener('touchmove', function (e) {
  if (isDragging) {
    e.preventDefault();
    const touch = e.touches[0];
    requestAnimationFrame(() => updatePosition(touch.clientX, touch.clientY));
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
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      const base64data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      console.log('Base64 data size:', (base64data.length * 3 / 4 / 1024).toFixed(2), 'KB');

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
