const imageUpload = document.getElementById('image-upload');
const convertButton = document.getElementById('convert-button');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('preview-image');
const sourceInfo = document.getElementById('source-info');
const message = document.getElementById('message');
const formatButtons = document.querySelectorAll('.format-option');
const card = document.querySelector('.card');
const downloadButton = document.getElementById('download-button');

let selectedFile = null;
let selectedFormat = 'png';
let lastPointerTime = 0;
let lastBlob = null;
let lastFilename = '';

formatButtons.forEach((button) => {
    const setActive = (e) => {
        if (e && e.timeStamp) lastPointerTime = e.timeStamp || Date.now();
        formatButtons.forEach((option) => option.classList.remove('active'));
        button.classList.add('active');
        selectedFormat = button.dataset.format;
    };

    button.addEventListener('pointerdown', setActive);
    button.addEventListener('click', (e) => {
        if (Date.now() - lastPointerTime < 400) return;
        setActive(e);
    });
});

const allowedTypes = ['image/jpeg', 'image/png', 'image/jfif'];

function showMessage(text, type = 'error') {
    message.textContent = text;
    message.style.color = type === 'error' ? '#f87171' : '#86efac';
}

function resetPreview() {
    preview.classList.add('hidden');
    previewImage.src = '';
    sourceInfo.textContent = '';
    showMessage('');
}

imageUpload.addEventListener('change', () => {
    const file = imageUpload.files[0];
    if (!file) {
        selectedFile = null;
        convertButton.disabled = true;
        resetPreview();
        return;
    }

    if (!allowedTypes.includes(file.type)) {
        selectedFile = null;
        convertButton.disabled = true;
        resetPreview();
        showMessage('Only JPG, PNG, and JFIF files are supported.');
        return;
    }

    selectedFile = file;
    convertButton.disabled = false;
    lastBlob = null;
    lastFilename = '';
    if (downloadButton) downloadButton.disabled = true;
    showMessage('Ready to convert.', 'success');

    const reader = new FileReader();
    reader.onload = () => {
        previewImage.src = reader.result;
        sourceInfo.textContent = `Source file: ${file.name} · ${Math.round(file.size / 1024)} KB`;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
}

function convertImage() {
    if (!selectedFile) {
        showMessage('Please select an image first.');
        return;
    }

    const outputFormat = selectedFormat;
    const outputMime = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
    const outputExtension = outputFormat === 'jfif' ? 'jfif' : outputFormat;
    
    // Auto-generate filename from the original file
    const originalName = (selectedFile.name && selectedFile.name.lastIndexOf('.') > 0)
        ? selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'))
        : selectedFile.name;
    const filename = `${originalName}.${outputExtension}`;

    const reader = new FileReader();

    reader.onload = () => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');

            if (outputMime === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (!blob) {
                    showMessage('Conversion failed. Please try a different file.');
                    return;
                }

                // store blob and enable download button
                lastBlob = blob;
                lastFilename = filename;
                if (downloadButton) downloadButton.disabled = false;
                showMessage('Conversion complete. Tap Download to save the file.', 'success');
            }, outputMime, 0.95);
        };

        image.onerror = () => {
            showMessage('Unable to load the selected image.');
        };

        image.src = reader.result;
    };

    reader.onerror = () => {
        showMessage('Unable to read the selected file.');
    };

    reader.readAsDataURL(selectedFile);
}

function handleConvertTrigger() {
    convertButton.textContent = 'Converting...';
    convertButton.disabled = true;
    convertImage();
    setTimeout(() => {
        convertButton.textContent = 'Convert';
        convertButton.disabled = !selectedFile;
    }, 700);
}

convertButton.addEventListener('pointerup', (e) => {
    lastPointerTime = e.timeStamp || Date.now();
    handleConvertTrigger();
});

convertButton.addEventListener('click', (e) => {
    if (Date.now() - lastPointerTime < 400) return;
    handleConvertTrigger();
});

async function triggerDownload() {
    if (!lastBlob || !lastFilename) {
        showMessage('No converted file available. Please convert first.');
        return;
    }

    if (window.showSaveFilePicker) {
        try {
            const extension = lastFilename.split('.').pop();
            const opts = {
                suggestedName: lastFilename,
                types: [
                    {
                        description: 'Image file',
                        accept: {
                            [lastBlob.type || 'application/octet-stream']: ['.' + extension]
                        }
                    }
                ]
            };

            const handle = await window.showSaveFilePicker(opts);
            const writable = await handle.createWritable();
            await writable.write(lastBlob);
            await writable.close();
            showMessage('File saved.', 'success');
            // auto-refresh after successful save
            setTimeout(() => autoRefresh(), 600);
            return;
        } catch (err) {
            // fallback to anchor method
        }
    }

    const url = URL.createObjectURL(lastBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = lastFilename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
        // auto-refresh after fallback download
        autoRefresh();
    }, 1500);
}

function autoRefresh() {
    if (!card) {
        // fallback: hard reload
        window.location.reload();
        return;
    }
    card.classList.add('fade-out');
    setTimeout(() => {
        window.location.reload();
    }, 600);
}

if (downloadButton) {
    downloadButton.addEventListener('pointerup', (e) => {
        lastPointerTime = e.timeStamp || Date.now();
        triggerDownload();
    });

    downloadButton.addEventListener('click', (e) => {
        if (Date.now() - lastPointerTime < 400) return;
        triggerDownload();
    });
}
