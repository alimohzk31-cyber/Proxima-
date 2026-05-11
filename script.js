// Calculator logic
let expression = '';
let result = '';
let isDarkMode = false;
let history = [];

// DOM elements
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const body = document.body;

// Update display
function updateDisplay() {
    expressionEl.textContent = expression;
    resultEl.textContent = result;
}

// Append to expression
function appendToDisplay(value) {
    expression += value;
    updateDisplay();
    calculatePreview();
    saveAppState();
}

// Clear display
function clearDisplay() {
    expression = '';
    result = '';
    updateDisplay();
    saveAppState();
}

// Backspace
function backspace() {
    expression = expression.slice(0, -1);
    updateDisplay();
    calculatePreview();
    saveAppState();
}

// Calculate preview
function calculatePreview() {
    if (expression) {
        try {
            let expr = expression;
            // Replace functions
            expr = expr.replace(/sin\(/g, 'Math.sin(Math.PI/180*');
            expr = expr.replace(/cos\(/g, 'Math.cos(Math.PI/180*');
            expr = expr.replace(/tan\(/g, 'Math.tan(Math.PI/180*');
            expr = expr.replace(/log\(/g, 'Math.log10(');
            expr = expr.replace(/ln\(/g, 'Math.log(');
            expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
            expr = expr.replace(/\^/g, '**');
            expr = expr.replace(/!/g, '.factorial()');
            // Handle factorial
            expr = expr.replace(/(\d+)\.factorial\(\)/g, 'factorial($1)');
            result = eval(expr);
            if (isNaN(result) || !isFinite(result)) {
                result = 'Error';
            } else {
                result = parseFloat(result.toFixed(10));
            }
        } catch (e) {
            result = '';
        }
    } else {
        result = '';
    }
    updateDisplay();
}

// Calculate final result
function calculate() {
    calculatePreview();
    if (result !== 'Error' && result !== '' && expression) {
        addToHistory(expression, result);
        expression = result.toString();
        result = '';
        saveAppState();
    }
}

// Factorial function
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) {
        res *= i;
    }
    return res;
}

// History functions
function addToHistory(expr, res) {
    history.unshift(`${expr} = ${res}`);
    if (history.length > 10) history.pop();
    updateHistory();
    if (SQL_DATABASE) {
        saveCalculationToDatabase(expr, res);
    } else {
        localStorage.setItem('history', JSON.stringify(history));
    }
}

function updateHistory() {
    const histEl = document.getElementById('history');
    histEl.innerHTML = history.map(item => `<div>${item}</div>`).join('');
}

function clearHistory() {
    history = [];
    if (SQL_DATABASE) {
        SQL_DATABASE.run('DELETE FROM history');
        saveDatabase();
    } else {
        localStorage.removeItem('history');
    }
    updateHistory();
}

function showHistory() {
    updateHistoryModal();
    document.getElementById('historyModal').style.display = 'block';
    // Close modal when clicking outside
    document.getElementById('historyModal').onclick = function(event) {
        if (event.target === this) {
            closeHistoryModal();
        }
    };
}

function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

function closeWorkspaceHistoryModal() {
    document.getElementById('workspaceHistoryModal').style.display = 'none';
}

function showWorkspaceHistory() {
    updateWorkspaceHistoryModal();
    document.getElementById('workspaceHistoryModal').style.display = 'block';
    // Close modal when clicking outside
    document.getElementById('workspaceHistoryModal').onclick = function(event) {
        if (event.target === this) {
            closeWorkspaceHistoryModal();
        }
    };
}

function updateWorkspaceHistoryModal() {
    const histList = document.getElementById('workspaceHistoryList');
    const items = Array.from(canvasOverlay.children).map((item, index) => {
        const type = item.classList[1] || 'unknown';
        const content = item.querySelector('textarea, div')?.textContent || item.querySelector('textarea')?.value || 'رسم';
        return `<div class="history-item">
            <span>عنصر ${index + 1}: ${type} - ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}</span>
            <div class="history-actions">
                <button type="button" onclick="focusWorkspaceItem(${index})" title="التركيز">👁️</button>
                <button type="button" onclick="deleteWorkspaceItem(${index})" title="حذف">🗑️</button>
            </div>
        </div>`;
    });
    histList.innerHTML = items.join('');
}

function focusWorkspaceItem(index) {
    const items = Array.from(canvasOverlay.children);
    if (items[index]) {
        items[index].scrollIntoView({ behavior: 'smooth' });
        items[index].style.border = '2px solid #5cc7ff';
        setTimeout(() => items[index].style.border = '', 2000);
    }
    closeWorkspaceHistoryModal();
}

function deleteWorkspaceItem(index) {
    const items = Array.from(canvasOverlay.children);
    if (items[index]) {
        canvasOverlay.removeChild(items[index]);
    }
    updateWorkspaceHistoryModal();
}

function updateHistoryModal() {
    const histList = document.getElementById('historyList');
    histList.innerHTML = history.map((item, index) => `
        <div class="history-item">
            <span>${item}</span>
            <div class="history-actions">
                <button type="button" onclick="editHistoryItem(${index})" title="تعديل">✏️</button>
                <button type="button" onclick="deleteHistoryItem(${index})" title="حذف">🗑️</button>
            </div>
        </div>
    `).join('');
}

function editHistoryItem(index) {
    const item = history[index];
    const [expr] = item.split(' = ');
    expression = expr;
    result = '';
    expressionEl.textContent = expression;
    resultEl.textContent = result;
    closeHistoryModal();
}

function deleteHistoryItem(index) {
    const item = history[index];
    const [expr, res] = item.split(' = ');
    history.splice(index, 1);
    if (SQL_DATABASE) {
        SQL_DATABASE.run('DELETE FROM history WHERE expression = ? AND result = ?', [expr, res]);
        saveDatabase();
    } else {
        localStorage.setItem('history', JSON.stringify(history));
    }
    updateHistoryModal();
}

// Copy result
function copyResult() {
    if (result && result !== 'Error') {
        navigator.clipboard.writeText(result).then(() => {
            alert('Result copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = result;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Result copied to clipboard!');
        });
    }
}

// Toggle theme
function toggleTheme() {
    isDarkMode = !isDarkMode;
    body.classList.toggle('dark', isDarkMode);
    const themeBtn = document.querySelector('.theme-toggle');
    themeBtn.textContent = isDarkMode ? '☀️' : '🌙';
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key >= '0' && key <= '9') {
        appendToDisplay(key);
    } else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '%' || key === '.' || key === '(' || key === ')') {
        appendToDisplay(key);
    } else if (key === 'Enter' || key === '=') {
        calculate();
    } else if (key === 'Backspace') {
        backspace();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearDisplay();
    }
});

// Notebook and theme state
let isNotebookOpen = false;
let workspaceTool = 'pen';
let workspaceColor = '#5cc7ff';
let workspaceBrushSize = 4;
let workspaceOpacity = 1;
let workspaceDrawing = false;
let currentStroke = null;
let lastWorkspacePoint = { x: 0, y: 0 };
let workspaceActions = [];
let workspaceRedoStack = [];
let toolbarExpanded = false;
let toolbarTimeout = null;
let SQL_DATABASE = null;
const DB_STORAGE_KEY = 'calculatorSqliteDb';

const notebookPanel = document.getElementById('notebookPanel');
const workspaceCanvas = document.getElementById('workspaceCanvas');
const canvasOverlay = document.getElementById('canvasOverlay');
const colorPickerMenu = document.getElementById('colorPickerMenu');
const shapesMenu = document.getElementById('shapesMenu');
const mathSymbolsPanel = document.getElementById('mathSymbolsPanel');
const workspaceToolLabel = document.getElementById('workspaceToolLabel');
const toolSettingsPanel = document.getElementById('toolSettingsPanel');
const toolbar = document.getElementById('floatingToolbar');
const workspaceCtx = workspaceCanvas.getContext('2d');

function toggleNotebook() {
    isNotebookOpen = !isNotebookOpen;
    notebookPanel.classList.toggle('open', isNotebookOpen);
}

function openNotebook() {
    isNotebookOpen = true;
    notebookPanel.classList.add('open');
}

function closeNotebook() {
    isNotebookOpen = false;
    notebookPanel.classList.remove('open');
}

function minimizeNotebook() {
    notebookPanel.classList.toggle('minimized');
}

function expandNotebook() {
    notebookPanel.classList.toggle('expanded');
}

function notebookUndo() {
    if (workspaceActions.length === 0) return;
    const action = workspaceActions.pop();
    workspaceRedoStack.push(action);
    if (action.type === 'draw') {
        redrawWorkspace();
    } else if (action.type === 'element' && action.element) {
        action.element.remove();
    }
}

function notebookRedo() {
    const action = workspaceRedoStack.pop();
    if (!action) return;
    workspaceActions.push(action);
    if (action.type === 'draw') {
        replayAction(action);
    } else if (action.type === 'element' && action.element) {
        canvasOverlay.appendChild(action.element);
    }
}

function setWorkspaceTool(tool, label = '') {
    workspaceTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool));
    if (workspaceToolLabel) {
        workspaceToolLabel.textContent = label || tool;
    }
    if (tool !== 'select') {
        shapesMenu.classList.remove('show');
        mathSymbolsPanel.classList.remove('show');
    }
    if (toolSettingsPanel) {
        toolSettingsPanel.style.display = toolbarExpanded ? 'grid' : 'none';
    }
}

function toggleShapesMenu() {
    shapesMenu.classList.toggle('show');
    colorPickerMenu.classList.remove('show');
    mathSymbolsPanel.classList.remove('show');
    showToolbar();
}

function toggleColorPicker() {
    colorPickerMenu.classList.toggle('show');
    shapesMenu.classList.remove('show');
    mathSymbolsPanel.classList.remove('show');
    showToolbar();
}

function setWorkspaceColor(color) {
    workspaceColor = color;
    document.querySelectorAll('.color-option').forEach(el => el.classList.toggle('active', el.dataset.color === color));
    if (workspaceTool === 'pen' || workspaceTool === 'brush') {
        showToolbar();
    }
}

function toggleSymbolsPanel() {
    mathSymbolsPanel.classList.toggle('show');
    shapesMenu.classList.remove('show');
    colorPickerMenu.classList.remove('show');
    setSymbolCategory('alnum');
    showToolbar();
}

function setSymbolCategory(category) {
    document.querySelectorAll('.symbol-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    document.querySelectorAll('.symbol-category').forEach(group => {
        group.classList.toggle('active', group.dataset.category === category);
    });
}

function toggleToolbarExpand() {
    toolbarExpanded = !toolbarExpanded;
    toolbar.classList.toggle('collapsed', !toolbarExpanded);
    toolbar.classList.toggle('expanded', toolbarExpanded);
    if (toolSettingsPanel) {
        toolSettingsPanel.style.display = toolbarExpanded ? 'grid' : 'none';
    }
}

function showToolbar() {
    if (toolbar) {
        toolbar.classList.remove('hidden');
    }
    if (toolbarTimeout) {
        clearTimeout(toolbarTimeout);
    }
}

function scheduleHideToolbar() {
    if (toolbarTimeout) {
        clearTimeout(toolbarTimeout);
    }
    toolbarTimeout = setTimeout(() => {
        if (toolbar) toolbar.classList.add('hidden');
    }, 2200);
}

function updateWorkspaceBrushSize(value) {
    workspaceBrushSize = parseInt(value, 10) || 4;
}

function updateWorkspaceOpacity(value) {
    workspaceOpacity = parseFloat(value) / 100;
    workspaceCanvas.style.opacity = workspaceOpacity;
}

function insertSymbolToCanvas(symbol) {
    createWorkspaceElement('symbol', symbol);
}

function insertShape(type) {
    createWorkspaceElement('shape', type);
}

function insertEquationMode() {
    const equation = prompt('أدخل معادلة ذكية', 'F = ma');
    if (equation) {
        createWorkspaceElement('equation', equation);
    }
}

function insertSymbolsPanel() {
    mathSymbolsPanel.classList.toggle('show');
    shapesMenu.classList.remove('show');
    colorPickerMenu.classList.remove('show');
    setSymbolCategory('alnum');
}

function insertQuickFormula() {
    createWorkspaceElement('equation', 'V = I × R');
}

function createStickyNote() {
    createWorkspaceElement('note', 'ملاحظة لاصقة جديدة');
}

function saveWorkspaceSnapshot() {
    const dataUrl = workspaceCanvas.toDataURL('image/png');
    const image = new Image();
    image.src = dataUrl;
    const popup = window.open('');
    if (popup) {
        popup.document.write(`<img src="${dataUrl}" style="width:100%;height:auto;display:block;">`);
    }
}

function exportWorkspace() {
    const data = {
        actions: workspaceActions,
        elements: Array.from(canvasOverlay.children).map(item => ({
            type: item.classList[1], // draggable note or symbol or shape
            content: item.querySelector('textarea, div')?.textContent || item.querySelector('textarea')?.value || '',
            x: item.style.left,
            y: item.style.top
        })),
        timestamp: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workspace-export.json';
    a.click();
    URL.revokeObjectURL(url);
}

function clearWorkspace() {
    workspaceCtx.clearRect(0, 0, workspaceCanvas.width, workspaceCanvas.height);
    Array.from(canvasOverlay.children).forEach(child => child.remove());
    workspaceActions = [];
    workspaceRedoStack = [];
}

function createWorkspaceElement(kind, content, x = 140, y = 140) {
    const item = document.createElement('div');
    item.className = `workspace-item draggable ${kind}`;
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;
    item.style.transform = 'translate(0, 0)';
    item.innerHTML = `<div class="item-handle">↕</div>`;

    if (kind === 'note') {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        item.appendChild(textarea);
    } else {
        const text = document.createElement('div');
        text.className = 'item-text';
        text.textContent = content;
        item.appendChild(text);
    }

    canvasOverlay.appendChild(item);
    enableDragForElement(item);
    workspaceActions.push({ type: 'element', kind, element: item });
    workspaceRedoStack = [];
}

function enableDragForElement(item) {
    let dragState = null;

    item.addEventListener('pointerdown', (event) => {
        if (event.target.closest('.item-handle') || item.classList.contains('draggable')) {
            dragState = {
                x: event.clientX - item.offsetLeft,
                y: event.clientY - item.offsetTop
            };
            item.classList.add('dragging');
            item.setPointerCapture(event.pointerId);
        }
    });

    item.addEventListener('pointermove', (event) => {
        if (!dragState) return;
        item.style.left = `${event.clientX - dragState.x}px`;
        item.style.top = `${event.clientY - dragState.y}px`;
    });

    item.addEventListener('pointerup', () => {
        if (!dragState) return;
        dragState = null;
        item.classList.remove('dragging');
    });
}

function getWorkspacePointerPosition(event) {
    const rect = workspaceCanvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

function startWorkspaceDrawing(event) {
    const point = getWorkspacePointerPosition(event);
    if (workspaceTool === 'text') {
        createWorkspaceElement('note', 'اكتب هنا', point.x, point.y);
        return;
    }
    if (!['pen', 'brush', 'eraser'].includes(workspaceTool)) return;
    workspaceDrawing = true;
    currentStroke = {
        type: 'draw',
        tool: workspaceTool,
        color: workspaceColor,
        width: workspaceBrushSize,
        points: [point]
    };
    lastWorkspacePoint = point;
}

function stopWorkspaceDrawing() {
    if (workspaceDrawing && currentStroke) {
        workspaceActions.push(currentStroke);
        workspaceRedoStack = [];
        currentStroke = null;
    }
    workspaceDrawing = false;
}

function drawWorkspaceLine(event) {
    if (!workspaceDrawing || !currentStroke) return;
    const point = getWorkspacePointerPosition(event);
    currentStroke.points.push(point);

    if (currentStroke.tool === 'eraser') {
        workspaceCtx.globalCompositeOperation = 'destination-out';
        workspaceCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        workspaceCtx.globalCompositeOperation = 'source-over';
        workspaceCtx.strokeStyle = currentStroke.color;
    }
    workspaceCtx.lineCap = 'round';
    workspaceCtx.lineJoin = 'round';
    workspaceCtx.lineWidth = currentStroke.width;
    workspaceCtx.beginPath();
    workspaceCtx.moveTo(lastWorkspacePoint.x, lastWorkspacePoint.y);
    workspaceCtx.lineTo(point.x, point.y);
    workspaceCtx.stroke();
    lastWorkspacePoint = point;
}

function initializeWorkspaceCanvas() {
    const ratio = window.devicePixelRatio || 1;
    workspaceCanvas.width = workspaceCanvas.offsetWidth * ratio;
    workspaceCanvas.height = workspaceCanvas.offsetHeight * ratio;
    workspaceCanvas.style.width = `${workspaceCanvas.offsetWidth}px`;
    workspaceCanvas.style.height = `${workspaceCanvas.offsetHeight}px`;
    workspaceCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    workspaceCtx.lineCap = 'round';
    workspaceCtx.lineJoin = 'round';
}

function redrawWorkspace() {
    workspaceCtx.clearRect(0, 0, workspaceCanvas.width, workspaceCanvas.height);
    workspaceActions.forEach(replayAction);
}

function replayAction(action) {
    if (action.type !== 'draw') return;
    workspaceCtx.globalCompositeOperation = action.tool === 'eraser' ? 'destination-out' : 'source-over';
    workspaceCtx.strokeStyle = action.tool === 'eraser' ? 'rgba(0,0,0,1)' : action.color;
    workspaceCtx.lineWidth = action.width;
    workspaceCtx.beginPath();
    const points = action.points;
    for (let i = 1; i < points.length; i += 1) {
        workspaceCtx.moveTo(points[i - 1].x, points[i - 1].y);
        workspaceCtx.lineTo(points[i].x, points[i].y);
    }
    workspaceCtx.stroke();
}

async function initDatabase() {
    const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
    const savedDb = localStorage.getItem(DB_STORAGE_KEY);
    if (savedDb) {
        const binary = atob(savedDb);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            buffer[i] = binary.charCodeAt(i);
        }
        SQL_DATABASE = new SQL.Database(buffer);
    } else {
        SQL_DATABASE = new SQL.Database();
    }
    SQL_DATABASE.run(`
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expression TEXT,
            result TEXT,
            created_at TEXT
        );
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            saved_at TEXT
        );
        CREATE TABLE IF NOT EXISTS state (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);
    loadHistoryFromDatabase();
}

function saveDatabase() {
    const data = SQL_DATABASE.export();
    const base64 = btoa(String.fromCharCode(...data));
    localStorage.setItem(DB_STORAGE_KEY, base64);
}

function saveCalculationToDatabase(expr, res) {
    SQL_DATABASE.run(
        'INSERT INTO history(expression,result,created_at) VALUES(?,?,?)',
        [expr, res, new Date().toISOString()]
    );
    saveDatabase();
}

function loadHistoryFromDatabase() {
    history = [];
    const stmt = SQL_DATABASE.prepare('SELECT expression, result FROM history ORDER BY id DESC LIMIT 20');
    while (stmt.step()) {
        const row = stmt.getAsObject();
        history.push(`${row.expression} = ${row.result}`);
    }
    stmt.free();
    updateHistory();
}

function loadNoteFromDatabase() {
    // legacy compatibility - note textarea no longer exists in the unified workspace
}

function saveAppState() {
    SQL_DATABASE.run(
        'REPLACE INTO state(key,value) VALUES(?,?)',
        ['lastExpression', expression]
    );
    SQL_DATABASE.run(
        'REPLACE INTO state(key,value) VALUES(?,?)',
        ['lastResult', result]
    );
    saveDatabase();
}

function restoreAppState() {
    const stmt = SQL_DATABASE.prepare('SELECT value FROM state WHERE key = ?');
    stmt.bind(['lastExpression']);
    if (stmt.step()) {
        expression = stmt.getAsObject().value;
    }
    stmt.reset();
    stmt.bind(['lastResult']);
    if (stmt.step()) {
        result = stmt.getAsObject().value;
    }
    stmt.free();
    updateDisplay();
}

// Load theme and saved state from localStorage
window.onload = async () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        toggleTheme();
    }
    await initDatabase();
    // Load history from localStorage if no database
    if (!SQL_DATABASE) {
        const savedHistory = localStorage.getItem('history');
        if (savedHistory) {
            history = JSON.parse(savedHistory);
            updateHistory();
        }
    }
    restoreAppState();
    initializeWorkspaceCanvas();
    setWorkspaceTool('pen', 'كتابة');
    workspaceCanvas.addEventListener('pointerdown', startWorkspaceDrawing);
    window.addEventListener('pointerup', stopWorkspaceDrawing);
    workspaceCanvas.addEventListener('pointermove', drawWorkspaceLine);
    workspaceCanvas.addEventListener('pointerleave', stopWorkspaceDrawing);
    window.addEventListener('resize', initializeWorkspaceCanvas);
};

// Save theme
function saveTheme() {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

// Modify toggleTheme to save
const originalToggle = toggleTheme;
toggleTheme = () => {
    originalToggle();
    saveTheme();
};