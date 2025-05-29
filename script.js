console.log('Скрипт загружен!');

// Точные размеры банковской карты в мм (стандарт ISO/IEC 7810)
const CARD_WIDTH_MM = 85.60;
const CARD_HEIGHT_MM = 53.98;
const CARD_RATIO = CARD_WIDTH_MM / CARD_HEIGHT_MM;

// Точное позиционирование чипа (в мм от краев)
const CHIP_X_MM = 6.3;    // от левого края
const CHIP_Y_MM = 8.0;    // от верхнего края
const CHIP_WIDTH_MM = 14.0;
const CHIP_HEIGHT_MM = 12.0;

// Рассчитываем пропорции чипа относительно карты
const CHIP_POSITION = { 
    x: CHIP_X_MM / CARD_WIDTH_MM,
    y: CHIP_Y_MM / CARD_HEIGHT_MM,
    width: CHIP_WIDTH_MM / CARD_WIDTH_MM,
    height: CHIP_HEIGHT_MM / CARD_HEIGHT_MM
};

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
function drawChip(ctx, x, y, width, height, bgColor) {
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
    
    // Подстраиваем цвет контактов под фон
    const isLight = bgColor[0] + bgColor[1] + bgColor[2] > 382; // 255*1.5
    const contactColor = isLight ? '#333333' : '#cccccc';
    
    ctx.fillStyle = contactColor;
    ctx.fillRect(x + spacing, contactY, contactWidth, contactHeight);
    ctx.fillRect(x + spacing*2 + contactWidth, contactY, contactWidth, contactHeight);
    ctx.fillRect(x + spacing*3 + contactWidth*2, contactY, contactWidth, contactHeight);
    ctx.fillRect(x + spacing*4 + contactWidth*3, contactY, contactWidth, contactHeight);
}

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
    
    // Позиция чипа с точными размерами
    chip.style.width = `${frameRect.width * CHIP_POSITION.width}px`;
    chip.style.height = `${frameRect.height * CHIP_POSITION.height}px`;
    chip.style.left = `${frameRect.width * CHIP_POSITION.x}px`;
    chip.style.top = `${frameRect.height * CHIP_POSITION.y}px`;

    // Автоматический цвет рамки
    if (imagePreview.src && imagePreview.classList.contains('loaded')) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 1;
        
        const frameRect = frame.getBoundingClientRect();
        const imgRect = imagePreview.getBoundingClientRect();
        
        const x = Math.max(0, Math.min(imgRect.width, translateX + frameRect.width * 0.5));
        const y = Math.max(0, Math.min(imgRect.height, translateY + frameRect.height * 0.5));
        
        ctx.drawImage(imagePreview, x, y, 1, 1, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        frame.style.borderColor = luminance > 128 ? 
            'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
    }
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
            const frameRect = frame.getBoundingClientRect();
            const imageWidth = imagePreview.naturalWidth;
            const imageHeight = imagePreview.naturalHeight;
            
            // Рассчитываем начальный масштаб
            let initialScale = Math.min(
                frameRect.width / imageWidth, 
                frameRect.height / imageHeight
            );
            
            // Если изображение меньше рамки
            if (imageWidth <= frameRect.width && imageHeight <= frameRect.height) {
                initialScale = 1;
            }

            // Центрируем изображение
            translateX = (frameRect.width - imageWidth * initialScale) / 2;
            translateY = (frameRect.height - imageHeight * initialScale) / 2;
            scale = initialScale;

            // Применяем трансформацию
            imagePreview.style.transform = `
                translate(${translateX}px, ${translateY}px) 
                scale(${scale})
            `;
            imagePreview.style.transformOrigin = '0 0';
            imagePreview.classList.add('loaded');
            
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
    initialTranslateX = translateX;
    initialTranslateY = translateY;
    imagePreview.style.transition = 'none';
});

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
    } else if (touches.length === 2) {
        isDragging = false;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        pinchStartDistance = Math.sqrt(dx * dx + dy * dy);
        pinchStartScale = scale;
        const midX = (touches[0].clientX + touches[1].clientX) / 2 - frame.getBoundingClientRect().left;
        const midY = (touches[0].clientY + touches[1].clientY) / 2 - frame.getBoundingClientRect().top;
        imagePreview.style.transformOrigin = `${midX}px ${midY}px`;
    }
});

document.addEventListener('mousemove', function (e) {
    if (isDragging) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        translateX = initialTranslateX + deltaX;
        translateY = initialTranslateY + deltaY;
        imagePreview.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        updateChipAndBorder();
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
        imagePreview.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        updateChipAndBorder();
    } else if (touches.length === 2) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scaleChange = distance / pinchStartDistance;
        scale = pinchStartScale * scaleChange;
        scale = Math.min(Math.max(0.1, scale), 10);
        imagePreview.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        updateChipAndBorder();
    }
});

document.addEventListener('mouseup', function () {
    isDragging = false;
    imagePreview.style.transition = 'transform 0.05s ease-out';
});

document.addEventListener('touchend', function () {
    isDragging = false;
    imagePreview.style.transformOrigin = '0 0';
    imagePreview.style.transition = 'transform 0.05s ease-out';
});

imagePreview.addEventListener('wheel', function (e) {
    e.preventDefault();

    const rect = imagePreview.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    imagePreview.style.transformOrigin = `${mouseX}px ${mouseY}px`;

    const preZoomImageX = (mouseX - translateX) / scale;
    const preZoomImageY = (mouseY - translateY) / scale;

    const prevScale = scale;
    if (e.deltaY < 0) {
        scale += 0.05;
    } else {
        scale -= 0.05;
    }
    scale = Math.min(Math.max(0.1, scale), 10);

    translateX = mouseX - preZoomImageX * scale;
    translateY = mouseY - preZoomImageY * scale;

    imagePreview.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    imagePreview.style.transformOrigin = '0 0';
    
    updateChipAndBorder();
});

// Получение цвета фона для чипа
function getChipBackgroundColor(ctx, x, y, width, height) {
    const sampleSize = 5;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Создаем временный canvas для анализа цвета
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = sampleSize;
    tempCanvas.height = sampleSize;
    
    // Копируем область вокруг чипа
    tempCtx.drawImage(
        ctx.canvas,
        centerX - sampleSize/2, centerY - sampleSize/2,
        sampleSize, sampleSize,
        0, 0, sampleSize, sampleSize
    );
    
    // Анализируем средний цвет
    const data = tempCtx.getImageData(0, 0, sampleSize, sampleSize).data;
    let r = 0, g = 0, b = 0;
    
    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i+1];
        b += data[i+2];
    }
    
    const count = data.length / 4;
    return [
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count)
    ];
}

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
    
    // Рассчитываем область кадрирования в координатах исходного изображения
    const sx = -translateX / scale;
    const sy = -translateY / scale;
    const sWidth = frameRect.width / scale;
    const sHeight = frameRect.height / scale;

    const img = new Image();
    img.src = imagePreview.src;
    img.crossOrigin = 'anonymous';
    
    try {
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Ошибка загрузки изображения'));
        });

        // Заполняем фон
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем скругленный прямоугольник
        const radius = 36; // Пропорционально разрешению
        roundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);
        ctx.clip();
        
        // Рисуем изображение без искажений
        ctx.drawImage(img, 
            sx, sy, sWidth, sHeight, // Область исходного изображения
            0, 0, canvas.width, canvas.height // На весь canvas
        );
        
        // Определяем позицию чипа
        const chipX = canvas.width * CHIP_POSITION.x;
        const chipY = canvas.height * CHIP_POSITION.y;
        const chipWidth = canvas.width * CHIP_POSITION.width;
        const chipHeight = canvas.height * CHIP_POSITION.height;
        
        // Получаем цвет фона для адаптации чипа
        const bgColor = getChipBackgroundColor(ctx, chipX, chipY, chipWidth, chipHeight);
        
        // Рисуем чип с адаптацией под фон
        drawChip(ctx, chipX, chipY, chipWidth, chipHeight, bgColor);

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
