const imageUpload = document.getElementById('image-upload');
const convertButton = document.getElementById('convert-button');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('preview-image');
const sourceInfo = document.getElementById('source-info');
const message = document.getElementById('message');
const formatButtons = document.querySelectorAll('.format-option');
const filenameInput = document.getElementById('filename-input');

let selectedFile = null;
let selectedFormat = 'png';

formatButtons.forEach((button) => {
    button.addEventListener('click', () => {
        formatButtons.forEach((option) => option.classList.remove('active'));
        button.classList.add('active');
        selectedFormat = button.dataset.format;
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
    
    // Generate filename
    let filename = filenameInput.value.trim();
    if (!filename) {
        // Auto-generate from original filename
        const originalName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
        filename = `${originalName}.${outputExtension}`;
    } else {
        // Add extension if not present
        if (!filename.toLowerCase().endsWith(`.${outputExtension}`)) {
            filename = `${filename}.${outputExtension}`;
        }
    }

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

                downloadBlob(blob, filename);
                showMessage('Conversion complete. The file was downloaded.', 'success');
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

convertButton.addEventListener('click', () => {
    convertButton.textContent = 'Converting...';
    convertButton.disabled = true;
    convertImage();
    setTimeout(() => {
        convertButton.textContent = 'Convert and download';
        convertButton.disabled = !selectedFile;
    }, 700);
});
