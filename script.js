// Get DOM elements
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const textColorInput = document.getElementById('textColor');
const shareBtn = document.getElementById('shareBtn');

// Image parameters
let textColor = '#333333';
let backgroundImage = ''; // Path to background image, empty string means no image
const padding = 30;

// Fixed canvas resolution
const imageWidth = 480;
const imageHeight = 320;

// Initialize canvas size
function initCanvas() {
    // Canvas always has fixed resolution
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    
    // Scale via CSS - don't change canvas element size
    const container = document.querySelector('.preview-container');
    const containerWidth = container.clientWidth - 20;
    const containerHeight = container.clientHeight - 20;
    
    // Calculate scale to fit container
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY);
    
    canvas.style.width = (imageWidth * scale) + 'px';
    canvas.style.height = (imageHeight * scale) + 'px';
    
    drawImage();
}

// Function to calculate optimal font size (preserves line breaks)
function getOptimalFontSize(text, maxWidth, maxHeight, minFontSize = 16, maxFontSize = 120) {
    if (!text || text.trim().length === 0) {
        return 40;
    }
    
    let fontSize = maxFontSize;
    let bestFitSize = minFontSize;
    
    // Binary search for more efficient size calculation
    while (fontSize >= minFontSize) {
        ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        
        // Split by line breaks first
        const paragraphs = text.split('\n');
        const lines = [];
        
        // Process each paragraph separately
        paragraphs.forEach(paragraph => {
            if (paragraph.trim().length === 0) {
                lines.push('');
                return;
            }
            
            // Normal word wrapping
            const words = paragraph.split(' ').filter(word => word.length > 0);
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
        });
        
        // Check if all text fits in height and width
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

// Function to wrap text into lines, preserving line breaks
function wrapText(text, maxWidth, fontSize) {
    if (!text || text.trim().length === 0) {
        return ['Your text here'];
    }
    
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const allLines = [];
    
    // First, split by actual line breaks (\n)
    const paragraphs = text.split('\n');
    
    // Process each paragraph separately
    paragraphs.forEach(paragraph => {
        if (paragraph.trim().length === 0) {
            // Empty line - add it as empty line
            allLines.push('');
            return;
        }
        
        // Normal word wrapping
        // Split paragraph into words
        const words = paragraph.split(' ').filter(word => word.length > 0);
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width <= maxWidth) {
                currentLine = testLine;
                // If this is the last word, add the line
                if (i === words.length - 1) {
                    allLines.push(currentLine);
                }
            } else {
                // If current line is not empty, save it and start a new one
                if (currentLine) {
                    allLines.push(currentLine);
                    currentLine = words[i];
                    // Check if word is too long
                    const wordMetrics = ctx.measureText(words[i]);
                    if (wordMetrics.width > maxWidth && words[i].length > 1) {
                        // If word is too long, add it anyway
                        allLines.push(words[i]);
                        currentLine = '';
                    }
                } else {
                    // If even one word doesn't fit, add it anyway
                    allLines.push(words[i]);
                    currentLine = '';
                }
                
                // If this is the last word and it remained in currentLine
                if (i === words.length - 1 && currentLine) {
                    allLines.push(currentLine);
                }
            }
        }
    });
    
    return allLines.length > 0 ? allLines : ['Your text here'];
}


// Function to draw image
function drawImage() {
    const text = textInput.value.trim() || 'Your text here';
    
    // Save context state
    ctx.save();
    
    // Reset clipping path to full canvas - start with fresh state
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Load and draw background image
    if (backgroundImage) {
        const img = new Image();
        // Only set crossOrigin for HTTP/HTTPS, not for file:// protocol
        if (window.location.protocol !== 'file:') {
            img.crossOrigin = "anonymous"; // Allow canvas export with CORS
        }
        img.onload = () => {
            ctx.restore();
            ctx.save();
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Draw text on top of image
            drawTextOnCanvas();
        };
        img.onerror = () => {
            // If image fails to load, show white background
            ctx.restore();
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawTextOnCanvas();
        };
        img.src = backgroundImage;
        return; // Exit early, text will be drawn in onload callback
    } else {
        // No image selected - show white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        ctx.save();
        
        // Draw text
        drawTextOnCanvas();
    }
}

// Function to draw text (extracted for reuse)
function drawTextOnCanvas() {
    ctx.save();
    
    const text = textInput.value.trim() || 'Your text here';
    
    // Text area (with padding)
    const textAreaWidth = canvas.width - padding * 2;
    const textAreaHeight = canvas.height - padding * 2;
    
    // Get optimal font size
    const fontSize = getOptimalFontSize(text, textAreaWidth, textAreaHeight);
    
    // Split text into lines
    const lines = wrapText(text, textAreaWidth, fontSize);
    
    // Set font
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text centered
    const startX = canvas.width / 2;
    const startY = canvas.height / 2;
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startTextY = startY - (totalHeight / 2) + (lineHeight / 2);
    
    lines.forEach((line, index) => {
        const y = startTextY + (index * lineHeight);
        ctx.fillText(line, startX, y);
    });
    
    ctx.restore();
}

// Text input handler
textInput.addEventListener('input', drawImage);

// Text color change handler
textColorInput.addEventListener('input', (e) => {
    textColor = e.target.value;
    drawImage();
});

// Background image selection handlers
const imageButtons = document.querySelectorAll('.image-btn');
imageButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        imageButtons.forEach(b => b.classList.remove('active'));
        const button = e.currentTarget;
        button.classList.add('active');
        backgroundImage = button.dataset.image || '';
        drawImage();
    });
});


// Function to download image
function downloadImage() {
    // Try toBlob first (may throw SecurityError for tainted canvas)
    try {
        canvas.toBlob((blob) => {
            if (!blob) {
                // Fallback to toDataURL if blob is null
                fallbackToDataURL();
                return;
            }
            try {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `social-image-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                fallbackToDataURL();
            }
        }, 'image/png');
    } catch (e) {
        // Fallback to toDataURL if toBlob throws synchronously (tainted canvas)
        fallbackToDataURL();
    }
}

// Fallback function to use toDataURL
function fallbackToDataURL() {
    try {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `social-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (err) {
        // If both methods fail, show alert
        alert('Cannot export image due to browser security restrictions.\n\nPlease use a local web server:\n- Python: python -m http.server 8000\n- Node.js: npx http-server\n- VS Code: Live Server extension\n\nThen open http://localhost:8000 instead of file://');
    }
}

// Function to share image
function shareImage() {
    try {
        canvas.toBlob((blob) => {
            if (!blob) {
                // Fallback to download if toBlob fails
                downloadImage();
                return;
            }
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
                downloadImage();
            }
        }, 'image/png');
    } catch (e) {
        // Fallback to download if toBlob fails
        downloadImage();
    }
}

// Button handler
shareBtn.addEventListener('click', shareImage);

// Initialize on page load
window.addEventListener('load', () => {
    initCanvas();
    drawImage();
});

// Redraw on window resize (only scale preview)
window.addEventListener('resize', () => {
    const container = document.querySelector('.preview-container');
    const containerWidth = container.clientWidth - 20;
    const containerHeight = container.clientHeight - 20;
    
    // Calculate scale to fit container
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY);
    
    canvas.style.width = (imageWidth * scale) + 'px';
    canvas.style.height = (imageHeight * scale) + 'px';
    // Don't redraw canvas image - it has fixed size
});

