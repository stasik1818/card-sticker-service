console.log('Скрипт загружен!');

// Точные размеры банковской карты в мм (стандарт ISO/IEC 7810)
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;
const CARD_RATIO = CARD_WIDTH_MM / CARD_HEIGHT_MM;

// Точное позиционирование чипа согласно стандарту EMV
const CHIP_X_MM = 7.0;    // от левого края
const CHIP_Y_MM = 9.0;    // от верхнего края
const CHIP_WIDTH_MM = 13.5;
const CHIP_HEIGHT_MM = 11.0;

// Рассчитываем пропорции чипа относительно карты
const CHIP_POSITION = { 
    x: CHIP_X_MM / CARD_WIDTH_MM,
    y: CHIP_Y_MM / CARD_HEIGHT_MM,
    width: CHIP_WIDTH_MM / CARD_WIDTH_MM,
    height: CHIP_HEIGHT_MM / CARD_HEIGHT_MM
};

console.log("Позиция чипа:", CHIP_POSITION);

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
let offsetX = 0;
let offsetY = 0;
let scale = 1;
let minScale = 1;
let imageWidth = 0;
let imageHeight = 0;

// Функция для скругленного прямоугольника
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

// Функция для отрисовки реалистичного чипа
function drawChip(ctx, x, y, width, height) {
    // Основа чипа (золотой градиент)
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, '#e6c260');
    gradient.addColorStop(1, '#d4af37');
    
    // Скругленные углы
    const cornerRadius = Math.min(width, height) * 0.15;
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius, y);
    ctx.lineTo(x + width - cornerRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
    ctx.lineTo(x + width, y + height - cornerRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
    ctx.lineTo(x + cornerRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
    ctx.lineTo(x, y + cornerRadius);
    ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    ctx.closePath();
    
    // Заливка и тень
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    
    // Сброс теней
    ctx.shadowColor = 'transparent';
    
    // Контакты (4 прямоугольника)
    const contactWidth = width * 0.08;
    const contactHeight = height * 0.5;
    const contactY = y + height * 0.25;
    const spacing = width * 0.05;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + spacing, contactY, contactWidth, contactHeight);
    ctx.fillRect(x + spacing*2 + contactWidth, contactY, contactWidth, contactHeight);
    ctx.fillRect(x + spacing*3 + contactWidth*2, contactY, contactWidth, contactHeight);
    ctx.fillRect(x + spacing*4 + contactWidth*3, contactY, contactWidth, contactHeight);
}

// Обновление размеров фрейма
function updateFrameSize() {
    const containerWidth = Math.min(428, window.innerWidth * 0.9);
    const frameHeight = Math.round(containerWidth / CARD_RATIO);
    frame.style.width = `${containerWidth}px`;
    frame.style.height = `${frameHeight}px`;
    
    // Центрируем изображение при изменении размеров
    if (imagePreview.classList.contains('loaded')) {
        positionImage();
    }
}

// Обновление чипа и рамки
function updateChipAndBorder() {
    const frameRect = frame.getBoundingClientRect();
    
    // Позиция чипа с точными размерами
    const chipWidth = Math.round(frameRect.width * CHIP_POSITION.width);
    const chipHeight = Math.round(frameRect.height * CHIP_POSITION.height);
    const chipLeft = Math.round(frameRect.width * CHIP_POSITION.x);
    const chipTop = Math.round(frameRect.height * CHIP_POSITION.y);
    
    chip.style.width = `${chipWidth}px`;
    chip.style.height = `${chipHeight}px`;
    chip.style.left = `${chipLeft}px`;
    chip.style.top = `${chipTop}px`;
}

// Позиционирование изображения
function positionImage() {
    const frameRect = frame.getBoundingClientRect();
    
    // Рассчитываем начальный масштаб
    minScale = Math.min(
        frameRect.width / imageWidth, 
        frameRect.height / imageHeight
    );
    
    // Если изображение меньше рамки
    if (imageWidth <= frameRect.width && imageHeight <= frameRect.height) {
        minScale = 1;
    }
    
    scale = minScale;
    
    // Центрируем изображение
    offsetX = (frameRect.width - imageWidth * scale) / 2;
    offsetY = (frameRect.height - imageHeight * scale) / 2;
    
    applyTransform();
}

// Применение трансформации
function applyTransform() {
    imagePreview.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

// Инициализация размеров
updateFrameSize();
updateChipAndBorder();

// Обработчик ресайза окна
window.addEventListener('resize', () => {
    updateFrameSize();
    updateChipAndBorder();
});

// Загрузка изображения
imageUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('Пожалуйста, выберите изображение!');
        return;
    }
    
    if (file.size > 25 * 1024 * 1024) {
        alert('Файл слишком большой, максимум 25 МБ!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        imagePreview.src = event.target.result;
        
        imagePreview.onload = function() {
            imageWidth = imagePreview.naturalWidth;
            imageHeight = imagePreview.naturalHeight;
            imagePreview.classList.add('loaded');
            positionImage();
            updateChipAndBorder();
        };
        
        imagePreview.onerror = function() {
            alert('Не удалось загрузить изображение');
        };
    };
    
    reader.onerror = function (error) {
        console.error('Ошибка чтения файла:', error);
        alert('Ошибка при чтении файла.');
    };
    
    reader.readAsDataURL(file);
});

// Обработчики событий для перемещения и масштабирования
imagePreview.addEventListener('mousedown', function (e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    imagePreview.style.transition = 'none';
});

imagePreview.addEventListener('touchstart', function (e) {
    e.preventDefault();
    const touches = e.touches;
    if (touches.length === 1) {
        isDragging = true;
        startX = touches[0].clientX;
        startY = touches[0].clientY;
        imagePreview.style.transition = 'none';
    }
});

document.addEventListener('mousemove', function (e) {
    if (isDragging) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;
        
        offsetX += deltaX;
        offsetY += deltaY;
        
        applyTransform();
    }
});

document.addEventListener('touchmove', function (e) {
    e.preventDefault();
    const touches = e.touches;
    if (touches.length === 1 && isDragging) {
        const deltaX = touches[0].clientX - startX;
        const deltaY = touches[0].clientY - startY;
        startX = touches[0].clientX;
        startY = touches[0].clientY;
        
        offsetX += deltaX;
        offsetY += deltaY;
        
        applyTransform();
    }
});

document.addEventListener('mouseup', function () {
    isDragging = false;
    imagePreview.style.transition = 'transform 0.1s ease-out';
});

document.addEventListener('touchend', function () {
    isDragging = false;
    imagePreview.style.transition = 'transform 0.1s ease-out';
});

imagePreview.addEventListener('wheel', function (e) {
    e.preventDefault();

    const rect = frame.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const prevScale = scale;
    
    if (e.deltaY < 0) {
        scale *= 1.1; // Увеличение
    } else {
        scale *= 0.9; // Уменьшение
    }
    
    // Ограничиваем масштаб
    scale = Math.max(minScale, Math.min(scale, 10));
    
    // Корректируем смещение для сохранения позиции под курсором
    offsetX = mouseX - (mouseX - offsetX) * (scale / prevScale);
    offsetY = mouseY - (mouseY - offsetY) * (scale / prevScale);
    
    applyTransform();
});

// Отправка данных
async function submitImage() {
    if (!imagePreview.src || !imagePreview.classList.contains('loaded')) {
        alert('Пожалуйста, загрузите изображение!');
        return;
    }
    
    if (!nameInput.value.trim()) {
        alert('Пожалуйста, введите ваше имя!');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Фиксированный размер области кадрирования в пикселях
    const cropWidth = 1200;
    const cropHeight = Math.round(cropWidth / CARD_RATIO);
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const frameRect = frame.getBoundingClientRect();
    
    // Рассчитываем видимую область изображения
    const visibleWidth = frameRect.width / scale;
    const visibleHeight = frameRect.height / scale;
    
    const sx = -offsetX / scale;
    const sy = -offsetY / scale;
    
    const img = new Image();
    img.src = imagePreview.src;
    
    try {
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Ошибка загрузки изображения'));
        });

        // Заполняем фон
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем скругленный прямоугольник
        const radius = 36;
        roundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);
        ctx.clip();
        
        // Рисуем изображение без искажений
        ctx.drawImage(
            img, 
            sx, sy, 
            visibleWidth, visibleHeight,
            0, 0,
            canvas.width, canvas.height
        );
        
        // Определяем позицию чипа
        const chipX = canvas.width * CHIP_POSITION.x;
        const chipY = canvas.height * CHIP_POSITION.y;
        const chipWidth = canvas.width * CHIP_POSITION.width;
        const chipHeight = canvas.height * CHIP_POSITION.height;
        
        // Рисуем чип
        drawChip(ctx, chipX, chipY, chipWidth, chipHeight);

        // Конвертируем в нужный формат
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
                qualityValue = undefined;
                fileExtension = 'png';
                break;
            default:
                mimeType = 'image/jpeg';
                qualityValue = 0.8;
                fileExtension = 'jpg';
        }

        // Конвертируем в blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, mimeType, qualityValue);
        });

        if (!blob) {
            throw new Error('Не удалось создать изображение');
        }

        // Проверяем размер файла
        if (blob.size > 10 * 1024 * 1024) {
            alert('Изображение слишком большое для Telegram (макс. 10 МБ)');
            return;
        }

        // Отправляем в Telegram
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('photo', blob, `card_sticker.${fileExtension}`);
        
        const photoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });
        
        const photoResult = await photoResponse.json();
        if (!photoResult.ok) {
            throw new Error(photoResult.description || 'Ошибка при отправке фото');
        }
        
        // Отправляем текстовую информацию
        const text = `Имя: ${nameInput.value}\nКомментарий: ${commentInput.value || '-'}\nКачество: ${qualitySelect.options[qualitySelect.selectedIndex].text}`;
        
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
            throw new Error(textResult.description || 'Ошибка при отправке текста');
        }
        
        alert('Заказ успешно отправлен!');
        
    } catch (error) {
        console.error('Ошибка при отправке:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Назначаем обработчик кнопки
submitButton.addEventListener('click', submitImage);
