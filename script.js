// Get DOM elements
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const backgroundColorInput = document.getElementById('backgroundColor');
const frameColorInput = document.getElementById('frameColor');
const textColorInput = document.getElementById('textColor');
const shareBtn = document.getElementById('shareBtn');

// Image parameters
let backgroundColor = '#ffffff';
let frameColor = '#4a90e2';
let textColor = '#333333';
let frameStyle = 'solid';
const frameWidth = 8;
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

// Function to draw frame preview on mini canvas (with fixed colors)
function drawFramePreview(canvasEl, style) {
    const previewCtx = canvasEl.getContext('2d');
    const previewWidth = canvasEl.width;
    const previewHeight = canvasEl.height;
    
    // Fixed colors for preview (not from settings)
    const previewBgColor = '#ffffff';
    const previewFrameColor = '#667eea';
    const previewFrameWidth = 3;
    
    // Clear and fill background
    previewCtx.clearRect(0, 0, previewWidth, previewHeight);
    previewCtx.fillStyle = previewBgColor;
    previewCtx.fillRect(0, 0, previewWidth, previewHeight);
    
    // Set frame color
    previewCtx.strokeStyle = previewFrameColor;
    previewCtx.fillStyle = previewFrameColor;
    previewCtx.lineWidth = previewFrameWidth;
    
    const x = previewFrameWidth / 2;
    const y = previewFrameWidth / 2;
    const w = previewWidth - previewFrameWidth;
    const h = previewHeight - previewFrameWidth;
    
    switch(style) {
        case 'solid':
            previewCtx.strokeRect(x, y, w, h);
            break;
            
        case 'dashed':
            previewCtx.setLineDash([8, 5]);
            previewCtx.strokeRect(x, y, w, h);
            previewCtx.setLineDash([]);
            break;
            
        case 'quote':
            const lineY1 = y + 10;
            const lineY2 = y + h - 10;
            const centerX = x + w / 2;
            const lineStartX = x + 10;
            const lineEndX = x + w - 10;
            const decorationRadius = 2.5;
            
            previewCtx.beginPath();
            previewCtx.moveTo(lineStartX, lineY1);
            previewCtx.lineTo(centerX - 8, lineY1);
            previewCtx.stroke();
            
            previewCtx.beginPath();
            previewCtx.arc(centerX, lineY1, decorationRadius, 0, Math.PI * 2);
            previewCtx.fill();
            
            previewCtx.beginPath();
            previewCtx.moveTo(centerX + 8, lineY1);
            previewCtx.lineTo(lineEndX, lineY1);
            previewCtx.stroke();
            
            previewCtx.beginPath();
            previewCtx.moveTo(lineStartX, lineY2);
            previewCtx.lineTo(centerX - 8, lineY2);
            previewCtx.stroke();
            
            previewCtx.beginPath();
            previewCtx.arc(centerX, lineY2, decorationRadius, 0, Math.PI * 2);
            previewCtx.fill();
            
            previewCtx.beginPath();
            previewCtx.moveTo(centerX + 8, lineY2);
            previewCtx.lineTo(lineEndX, lineY2);
            previewCtx.stroke();
            break;
            
        case 'caution':
            const tapeWidth = 8;
            const stripeWidth = 4;
            const angle = 35;
            const angleRad = angle * Math.PI / 180;
            const yellowColor = '#ffd700';
            const blackColor = '#000000';
            
            previewCtx.lineWidth = 1;
            previewCtx.save();
            
            previewCtx.beginPath();
            previewCtx.rect(x - tapeWidth, y - tapeWidth, w + tapeWidth * 2, h + tapeWidth * 2);
            previewCtx.rect(x + tapeWidth, y + tapeWidth, w - tapeWidth * 2, h - tapeWidth * 2);
            previewCtx.clip('evenodd');
            
            const tapeCenterX = x + w / 2;
            const tapeCenterY = y + h / 2;
            
            const maxDim = Math.max(w + tapeWidth * 2, h + tapeWidth * 2);
            const diagonalLength = Math.sqrt(2) * maxDim;
            const numStripes = Math.ceil(diagonalLength / stripeWidth) + 2;
            const startOffset = -numStripes * stripeWidth / 2;
            
            for (let i = 0; i < numStripes; i++) {
                const offset = startOffset + i * stripeWidth;
                const isYellow = i % 2 === 0;
                previewCtx.fillStyle = isYellow ? yellowColor : blackColor;
                
                const stripeLength = diagonalLength * 2;
                const halfLength = stripeLength / 2;
                
                previewCtx.save();
                previewCtx.translate(tapeCenterX, tapeCenterY);
                previewCtx.rotate(angleRad);
                
                previewCtx.beginPath();
                previewCtx.rect(-halfLength, offset - stripeWidth / 2, stripeLength, stripeWidth);
                previewCtx.fill();
                
                previewCtx.restore();
            }
            
            previewCtx.restore();
            break;
    }
}

// Functions for drawing different frame types
function drawFrame(style) {
    // Reset any previous clipping path - start fresh
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.clip();
    ctx.restore();
    
    // Save context state before drawing frame
    ctx.save();
    
    ctx.strokeStyle = frameColor;
    ctx.fillStyle = frameColor;
    ctx.lineWidth = frameWidth;
    
    const x = frameWidth / 2;
    const y = frameWidth / 2;
    const w = canvas.width - frameWidth;
    const h = canvas.height - frameWidth;
    
    switch(style) {
        case 'solid':
            ctx.setLineDash([]);
            ctx.strokeRect(x, y, w, h);
            break;
            
        case 'dashed':
            ctx.setLineDash([15, 10]);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);
            break;
            
        case 'quote':
            ctx.setLineDash([]);
            const lineY1 = y + 20; // Top line
            const lineY2 = y + h - 20; // Bottom line
            const centerX = x + w / 2;
            const lineStartX = x + 30;
            const lineEndX = x + w - 30;
            const decorationRadius = 5;
            
            // Top line left of decoration
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineY1);
            ctx.lineTo(centerX - 15, lineY1);
            ctx.stroke();
            
            // Decorative element at top (circle)
            ctx.beginPath();
            ctx.arc(centerX, lineY1, decorationRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Top line right of decoration
            ctx.beginPath();
            ctx.moveTo(centerX + 15, lineY1);
            ctx.lineTo(lineEndX, lineY1);
            ctx.stroke();
            
            // Bottom line left of decoration
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineY2);
            ctx.lineTo(centerX - 15, lineY2);
            ctx.stroke();
            
            // Decorative element at bottom (circle)
            ctx.beginPath();
            ctx.arc(centerX, lineY2, decorationRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Bottom line right of decoration
            ctx.beginPath();
            ctx.moveTo(centerX + 15, lineY2);
            ctx.lineTo(lineEndX, lineY2);
            ctx.stroke();
            break;
            
        case 'caution':
            const tapeWidth = 20; // Tape width at the edge
            const stripeWidth = 10; // Width of each stripe
            const angle = 35; // Angle in degrees (not 45 to make it more noticeable)
            const angleRad = angle * Math.PI / 180;
            const yellowColor = '#ffd700'; // Yellow color
            const blackColor = '#000000'; // Black color
            
            ctx.lineWidth = 1;
            ctx.save();
            
            // Create drawing area - ring around the edge
            ctx.beginPath();
            ctx.rect(x - tapeWidth, y - tapeWidth, w + tapeWidth * 2, h + tapeWidth * 2);
            ctx.rect(x + tapeWidth, y + tapeWidth, w - tapeWidth * 2, h - tapeWidth * 2);
            ctx.clip('evenodd');
            
            // Move origin to center for convenience
            const tapeCenterX = x + w / 2;
            const tapeCenterY = y + h / 2;
            
            // Draw diagonal stripes covering the entire area
            // Calculate number of stripes needed to cover the entire area
            const maxDim = Math.max(w + tapeWidth * 2, h + tapeWidth * 2);
            const diagonalLength = Math.sqrt(2) * maxDim;
            const numStripes = Math.ceil(diagonalLength / stripeWidth) + 2;
            
            // Calculate offset for stripe start
            const startOffset = -numStripes * stripeWidth / 2;
            
            for (let i = 0; i < numStripes; i++) {
                const offset = startOffset + i * stripeWidth; // Remove multiplication by 2 so stripes are continuous without gaps
                const isYellow = i % 2 === 0;
                ctx.fillStyle = isYellow ? yellowColor : blackColor;
                
                // Draw slanted stripe covering the entire visible area
                // Use large parallelogram at an angle
                const stripeLength = diagonalLength * 2;
                const halfLength = stripeLength / 2;
                
                ctx.save();
                ctx.translate(tapeCenterX, tapeCenterY);
                ctx.rotate(angleRad);
                
                ctx.beginPath();
                ctx.rect(-halfLength, offset - stripeWidth / 2, stripeLength, stripeWidth);
                ctx.fill();
                
                ctx.restore();
            }
            
            ctx.restore();
            // Restore frame drawing parameters after clipping
            ctx.fillStyle = frameColor;
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = frameWidth;
            ctx.setLineDash([]);
            break;
    }
    
    // Restore context state after drawing frame
    ctx.restore();
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
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Restore and save again before drawing frame
    ctx.restore();
    
    // Draw frame (it will manage its own clipping and state)
    drawFrame(frameStyle);
    
    // Save state for text drawing
    ctx.save();
    
    // Text area (with offsets from frame and padding)
    const textAreaWidth = canvas.width - (frameWidth + padding) * 2;
    const textAreaHeight = canvas.height - (frameWidth + padding) * 2;
    
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
    
    // Restore context state
    ctx.restore();
}

// Text input handler
textInput.addEventListener('input', drawImage);

// Background color change handler
backgroundColorInput.addEventListener('input', (e) => {
    backgroundColor = e.target.value;
    drawImage();
});

// Frame color change handler
frameColorInput.addEventListener('input', (e) => {
    frameColor = e.target.value;
    drawImage();
});

// Text color change handler
textColorInput.addEventListener('input', (e) => {
    textColor = e.target.value;
    drawImage();
});

// Frame style selection handlers
const frameStyleButtons = document.querySelectorAll('.frame-style-btn');
frameStyleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        frameStyleButtons.forEach(b => b.classList.remove('active'));
        // Use currentTarget instead of target to always get the button, not child elements
        const button = e.currentTarget;
        button.classList.add('active');
        frameStyle = button.dataset.frame;
        drawImage();
    });
});

// Function to download image
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

// Function to share image
function shareImage() {
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
                downloadImage();
        }
    }, 'image/png');
}

// Button handler
shareBtn.addEventListener('click', shareImage);

// Initialize frame previews
function initFramePreviews() {
    const previewCanvases = document.querySelectorAll('.frame-preview');
    previewCanvases.forEach(canvas => {
        const frameType = canvas.dataset.frameType;
        drawFramePreview(canvas, frameType);
    });
}

// Initialize on page load
window.addEventListener('load', () => {
    initCanvas();
    drawImage();
    initFramePreviews();
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

