// Получаем элементы DOM
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const frameColorInput = document.getElementById('frameColor');
const colorValue = document.getElementById('colorValue');
const shareFacebookBtn = document.getElementById('shareFacebook');
const shareTelegramBtn = document.getElementById('shareTelegram');
const shareInstagramBtn = document.getElementById('shareInstagram');
const downloadBtn = document.getElementById('downloadBtn');

// Параметры картинки
let frameColor = '#4a90e2';
const frameWidth = 8;
const padding = 30;
let imageWidth, imageHeight;

// Инициализация размера canvas
function initCanvas() {
    const container = document.querySelector('.preview-container');
    const containerHeight = container.clientHeight - 20; // минус padding
    
    // Альбомная ориентация: соотношение сторон 16:9
    imageWidth = Math.floor(containerHeight * 16 / 9);
    imageHeight = containerHeight;
    
    // Ограничиваем максимальную ширину шириной контейнера
    const containerWidth = container.clientWidth - 20;
    if (imageWidth > containerWidth) {
        imageWidth = containerWidth;
        imageHeight = Math.floor(imageWidth * 9 / 16);
    }
    
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    
    drawImage();
}

// Функция для подбора размера шрифта
function getOptimalFontSize(text, maxWidth, maxHeight, minFontSize = 16, maxFontSize = 120) {
    if (!text || text.trim().length === 0) {
        return 40;
    }
    
    const words = text.split(' ').filter(word => word.length > 0);
    if (words.length === 0) {
        return 40;
    }
    
    let fontSize = maxFontSize;
    let bestFitSize = minFontSize;
    
    // Бинарный поиск для более эффективного подбора размера
    while (fontSize >= minFontSize) {
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        
        // Разбиваем текст на строки
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width <= maxWidth && i < words.length - 1) {
                currentLine = testLine;
            } else {
                if (currentLine && metrics.width > maxWidth) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    lines.push(testLine);
                    currentLine = '';
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        // Проверяем, помещается ли весь текст по высоте и ширине
        const lineHeight = fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const maxLineWidth = lines.length > 0 ? Math.max(...lines.map(line => {
            ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            return ctx.measureText(line).width;
        })) : 0;
        
        if (totalHeight <= maxHeight && maxLineWidth <= maxWidth) {
            bestFitSize = fontSize;
            break;
        } else {
            fontSize -= 3;
        }
    }
    
    return Math.max(bestFitSize, minFontSize);
}

// Функция для разбивки текста на строки
function wrapText(text, maxWidth, fontSize) {
    if (!text || text.trim().length === 0) {
        return ['Your text here'];
    }
    
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const words = text.split(' ').filter(word => word.length > 0);
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width <= maxWidth) {
            currentLine = testLine;
            // Если это последнее слово, добавляем строку
            if (i === words.length - 1) {
                lines.push(currentLine);
            }
        } else {
            // Если текущая строка не пуста, сохраняем её и начинаем новую
            if (currentLine) {
                lines.push(currentLine);
                currentLine = words[i];
                // Проверяем, не слишком ли длинное слово
                const wordMetrics = ctx.measureText(words[i]);
                if (wordMetrics.width > maxWidth && words[i].length > 1) {
                    // Если слово слишком длинное, пытаемся его разбить (упрощенная версия)
                    lines.push(words[i]);
                    currentLine = '';
                }
            } else {
                // Если даже одно слово не помещается, все равно добавляем его
                lines.push(words[i]);
                currentLine = '';
            }
            
            // Если это последнее слово и оно осталось в currentLine
            if (i === words.length - 1 && currentLine) {
                lines.push(currentLine);
            }
        }
    }
    
    return lines.length > 0 ? lines : ['Your text here'];
}

// Функция рисования картинки
function drawImage() {
    const text = textInput.value.trim() || 'Your text here';
    
    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фон (белый)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем рамку
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(
        frameWidth / 2,
        frameWidth / 2,
        canvas.width - frameWidth,
        canvas.height - frameWidth
    );
    
    // Область для текста (с отступами от рамки и padding)
    const textAreaWidth = canvas.width - (frameWidth + padding) * 2;
    const textAreaHeight = canvas.height - (frameWidth + padding) * 2;
    
    // Получаем оптимальный размер шрифта
    const fontSize = getOptimalFontSize(text, textAreaWidth, textAreaHeight);
    
    // Разбиваем текст на строки
    const lines = wrapText(text, textAreaWidth, fontSize);
    
    // Настраиваем шрифт
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Рисуем текст по центру
    const startX = canvas.width / 2;
    const startY = canvas.height / 2;
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startTextY = startY - (totalHeight / 2) + (lineHeight / 2);
    
    lines.forEach((line, index) => {
        const y = startTextY + (index * lineHeight);
        ctx.fillText(line, startX, y);
    });
}

// Обработчик изменения текста
textInput.addEventListener('input', drawImage);

// Обработчик изменения цвета рамки
frameColorInput.addEventListener('input', (e) => {
    frameColor = e.target.value;
    colorValue.textContent = frameColor;
    drawImage();
});

// Функция для скачивания картинки
function downloadImage() {
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `social-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}

// Функция для шаринга
function shareImage(platform) {
    canvas.toBlob((blob) => {
        const file = new File([blob], 'social-image.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                title: 'Social media image',
                files: [file]
            }).catch(err => {
                console.log('Share error:', err);
                downloadImage();
            });
        } else {
            // Fallback: download the image
            if (platform === 'facebook') {
                downloadImage();
                alert('Image downloaded. Please upload it to Facebook manually.');
            } else if (platform === 'telegram') {
                downloadImage();
                alert('Image downloaded. Please open Telegram and send it.');
            } else if (platform === 'instagram') {
                downloadImage();
                alert('Image downloaded. Please upload it to Instagram manually.');
            }
        }
    }, 'image/png');
}

// Обработчики кнопок
downloadBtn.addEventListener('click', downloadImage);

shareFacebookBtn.addEventListener('click', () => shareImage('facebook'));
shareTelegramBtn.addEventListener('click', () => shareImage('telegram'));
shareInstagramBtn.addEventListener('click', () => shareImage('instagram'));

// Инициализация при загрузке страницы
window.addEventListener('load', () => {
    initCanvas();
    drawImage();
});

// Перерисовка при изменении размера окна
window.addEventListener('resize', () => {
    initCanvas();
});

