// Notepad functionality
let notepadOpen = false;

function toggleNotepad() {
    const modal = document.getElementById('notepadModal');
    if (notepadOpen) {
        closeNotepad();
    } else {
        openNotepad();
    }
}

function openNotepad() {
    const modal = document.getElementById('notepadModal');
    const textarea = document.getElementById('notepadText');
    
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    notepadOpen = true;
    
    // Load saved content
    const saved = localStorage.getItem('notepadContent');
    if (saved) {
        textarea.value = saved;
        setNotepadSaveButtonState(true);
    }
    
    // Focus textarea
    setTimeout(() => textarea.focus(), 100);
    
    // Close when clicking overlay
    modal.onclick = function(event) {
        if (event.target === modal.querySelector('.notepad-overlay')) {
            closeNotepad();
        }
    };
}

function closeNotepad() {
    const modal = document.getElementById('notepadModal');
    const textarea = document.getElementById('notepadText');
    
    // Save content
    localStorage.setItem('notepadContent', textarea.value);
    
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    notepadOpen = false;
}

function updateNotepadFontSize(size) {
    const textarea = document.getElementById('notepadText');
    textarea.style.fontSize = size + 'px';
    localStorage.setItem('notepadFontSize', size);
}

function updateNotepadColor(color) {
    const textarea = document.getElementById('notepadText');
    textarea.style.color = color;
    localStorage.setItem('notepadColor', color);
}

function updateNotepadFont(font) {
    const textarea = document.getElementById('notepadText');
    textarea.style.fontFamily = font;
    localStorage.setItem('notepadFont', font);
}

function saveNotepad() {
    const textarea = document.getElementById('notepadText');
    const saveButton = document.getElementById('notepadSaveBtn');
    if (!textarea) return;
    localStorage.setItem('notepadContent', textarea.value);
    if (saveButton) {
        saveButton.textContent = '✅ تم الحفظ';
        saveButton.style.opacity = '1';
    }
}

function insertSymbol(symbol) {
    const textarea = document.getElementById('notepadText');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    textarea.value = value.slice(0, start) + symbol + value.slice(end);
    const newPosition = start + symbol.length;
    textarea.selectionStart = textarea.selectionEnd = newPosition;
    textarea.focus();
    localStorage.setItem('notepadContent', textarea.value);
    const saveButton = document.getElementById('notepadSaveBtn');
    if (saveButton) {
        saveButton.textContent = '💾 حفظ';
        saveButton.style.opacity = '1';
    }
}

function setNotepadSaveButtonState(saved) {
    const saveButton = document.getElementById('notepadSaveBtn');
    if (!saveButton) return;
    if (saved) {
        saveButton.textContent = '✅ تم الحفظ';
        saveButton.style.opacity = '1';
    } else {
        saveButton.textContent = '💾 حفظ';
        saveButton.style.opacity = '0.95';
    }
}

// Load saved preferences on page load
window.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('notepadText');
    const saveButton = document.getElementById('notepadSaveBtn');

    const savedSize = localStorage.getItem('notepadFontSize');
    if (savedSize && textarea) {
        textarea.style.fontSize = savedSize + 'px';
        document.getElementById('fontSizeSelect').value = savedSize;
    }

    const savedColor = localStorage.getItem('notepadColor');
    if (savedColor && textarea) {
        textarea.style.color = savedColor;
    }

    const savedFont = localStorage.getItem('notepadFont');
    if (savedFont && textarea) {
        textarea.style.fontFamily = savedFont;
        document.getElementById('fontFamilySelect').value = savedFont;
    }

    const savedContent = localStorage.getItem('notepadContent');
    if (savedContent && textarea) {
        textarea.value = savedContent;
    }

    if (textarea) {
        textarea.addEventListener('input', function() {
            localStorage.setItem('notepadContent', textarea.value);
            setNotepadSaveButtonState(false);
        });
    }

    if (saveButton) {
        saveButton.addEventListener('click', saveNotepad);
    }
});

// Close modal when pressing Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && notepadOpen) {
        closeNotepad();
    }
});
