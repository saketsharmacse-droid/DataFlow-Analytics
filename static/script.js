// Global variables
let currentData = null;
let currentFile = null;
let manualData = [];

// Sound effect
function playClickSound() {
    const sound = document.getElementById('clickSound');
    sound.currentTime = 0;
    sound.play().catch(e => console.log('Sound play failed:', e));
}

// Add click sound to all buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn, .tab-btn, .nav-link, .tool-item').forEach(btn => {
        btn.addEventListener('click', playClickSound);
    });
    
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            showSection(section);
        });
    });
    
    // File upload
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    fileInput.addEventListener('change', handleFileUpload);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload({ target: { files } });
        }
    });
    
    // PDF tools
    document.getElementById('pdfInput').addEventListener('change', handlePdfSelection);
    document.getElementById('jpgInput').addEventListener('change', handleJpgSelection);
    document.getElementById('pdfToJpgInput').addEventListener('change', handlePdfToJpgSelection);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            showTabContent(e.target.dataset.tab);
        });
    });
}

// Show section
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(`${sectionName}-section`).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    currentFile = file;
    const formData = new FormData();
    formData.append('file', file);
    
    showLoading('Analyzing your data...');
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentData = result;
            displayResults(result);
            document.getElementById('toolsCard').style.display = 'block';
            document.getElementById('resultsCard').style.display = 'block';
        } else {
            showError(result.error);
        }
    } catch (error) {
        showError('Failed to analyze data: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Toggle manual entry
function toggleManualEntry() {
    const card = document.getElementById('manualEntryCard');
    if (card.style.display === 'none') {
        card.style.display = 'block';
        initializeManualEntry();
    } else {
        card.style.display = 'none';
    }
}

// Initialize manual entry table
function initializeManualEntry() {
    const table = document.getElementById('dataTable');
    manualData = [
        { name: '', value1: '', value2: '' },
        { name: '', value1: '', value2: '' },
        { name: '', value1: '', value2: '' }
    ];
    
    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Name</th><th>Value 1</th><th>Value 2</th></tr></thead><tbody>';
    
    manualData.forEach((row, i) => {
        html += '<tr>';
        html += `<td><input type="text" onchange="updateManualData(${i}, 'name', this.value)"></td>`;
        html += `<td><input type="number" onchange="updateManualData(${i}, 'value1', this.value)"></td>`;
        html += `<td><input type="number" onchange="updateManualData(${i}, 'value2', this.value)"></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    table.innerHTML = html;
}

// Update manual data
function updateManualData(index, field, value) {
    manualData[index][field] = value;
}

// Add row
function addRow() {
    manualData.push({ name: '', value1: '', value2: '' });
    initializeManualEntry();
}

// Analyze manual data
async function analyzeManualData() {
    const filteredData = manualData.filter(row => 
        row.name && (row.value1 !== '' || row.value2 !== '')
    );
    
    if (filteredData.length === 0) {
        showError('Please enter some data first');
        return;
    }
    
    showLoading('Analyzing your data...');
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: filteredData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentData = result;
            displayResults(result);
            document.getElementById('toolsCard').style.display = 'block';
            document.getElementById('resultsCard').style.display = 'block';
        } else {
            showError(result.error);
        }
    } catch (error) {
        showError('Failed to analyze data: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Display results
function displayResults(data) {
    showTabContent('statistics');
}

// Show tab content
function showTabContent(tab) {
    const content = document.getElementById('resultsContent');
    
    if (tab === 'statistics') {
        let html = '<div class="stats-grid">';
        
        if (currentData && currentData.stats) {
            const stats = currentData.stats;
            const firstCol = Object.keys(stats)[0];
            
            if (firstCol && stats[firstCol]) {
                html += `<div class="stat-card"><h4>Count</h4><p>${stats[firstCol].count || 'N/A'}</p></div>`;
                html += `<div class="stat-card"><h4>Mean</h4><p>${(stats[firstCol].mean || 0).toFixed(2)}</p></div>`;
                html += `<div class="stat-card"><h4>Std Dev</h4><p>${(stats[firstCol].std || 0).toFixed(2)}</p></div>`;
                html += `<div class="stat-card"><h4>Min</h4><p>${(stats[firstCol].min || 0).toFixed(2)}</p></div>`;
                html += `<div class="stat-card"><h4>Max</h4><p>${(stats[firstCol].max || 0).toFixed(2)}</p></div>`;
            }
        }
        
        html += '</div>';
        content.innerHTML = html;
    } else if (tab === 'visualizations') {
        let html = '';
        
        if (currentData && currentData.charts) {
            Object.entries(currentData.charts).forEach(([type, imgData]) => {
                html += `<div class="chart-container">
                    <h4>${type.charAt(0).toUpperCase() + type.slice(1)} Chart</h4>
                    <img src="${imgData}" alt="${type} chart">
                </div>`;
            });
        }
        
        content.innerHTML = html || '<p>No visualizations available</p>';
    } else if (tab === 'correlation') {
        let html = '<h4>Correlation Matrix</h4>';
        
        if (currentData && currentData.correlation) {
            html += '<div class="stats-grid">';
            Object.entries(currentData.correlation).forEach(([col1, values]) => {
                Object.entries(values).forEach(([col2, corr]) => {
                    if (col1 !== col2) {
                        html += `<div class="stat-card">
                            <h4>${col1} vs ${col2}</h4>
                            <p>${corr.toFixed(3)}</p>
                        </div>`;
                    }
                });
            });
            html += '</div>';
        }
        
        content.innerHTML = html;
    }
}

// Smoothing modal
function showSmoothingModal() {
    if (!currentData) return;
    
    const modal = document.getElementById('smoothingModal');
    const select = document.getElementById('smoothColumn');
    
    select.innerHTML = '';
    currentData.columns.forEach(col => {
        select.innerHTML += `<option value="${col}">${col}</option>`;
    });
    
    modal.style.display = 'block';
}

// Apply smoothing
async function applySmoothing() {
    const column = document.getElementById('smoothColumn').value;
    const method = document.getElementById('smoothMethod').value;
    const window = parseInt(document.getElementById('smoothWindow').value);
    
    showLoading('Applying smoothing...');
    
    try {
        const response = await fetch('/api/smooth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: manualData.length > 0 ? manualData : null,
                column,
                method,
                window
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Smoothing applied successfully!');
            closeModal('smoothingModal');
        } else {
            showError(result.error);
        }
    } catch (error) {
        showError('Failed to apply smoothing: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Show binning modal
function showBinningModal() {
    showError('Please implement binning modal similar to smoothing');
}

// Show normalization modal
function showNormalizationModal() {
    showError('Please implement normalization modal similar to smoothing');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// PDF Tools
function handlePdfSelection(event) {
    const files = Array.from(event.target.files);
    displayFileList(files, 'pdfList');
    document.getElementById('mergePdfBtn').style.display = 'block';
}

async function mergePDFs() {
    const input = document.getElementById('pdfInput');
    const formData = new FormData();
    
    Array.from(input.files).forEach(file => {
        formData.append('files', file);
    });
    
    showLoading('Merging PDFs...');
    
    try {
        const response = await fetch('/api/merge-pdf', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const blob = await response.blob();
            downloadBlob(blob, 'merged.pdf');
            showSuccess('PDFs merged successfully!');
        } else {
            showError('Failed to merge PDFs');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// JPG to PDF
function handleJpgSelection(event) {
    const files = Array.from(event.target.files);
    displayFileList(files, 'jpgList');
    document.getElementById('convertJpgBtn').style.display = 'block';
}

async function convertJpgToPdf() {
    const input = document.getElementById('jpgInput');
    const formData = new FormData();
    
    Array.from(input.files).forEach(file => {
        formData.append('files', file);
    });
    
    showLoading('Converting to PDF...');
    
    try {
        const response = await fetch('/api/jpg-to-pdf', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const blob = await response.blob();
            downloadBlob(blob, 'converted.pdf');
            showSuccess('Images converted to PDF successfully!');
        } else {
            showError('Failed to convert images');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// PDF to JPG
function handlePdfToJpgSelection(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('pdfToJpgStatus').innerHTML = `<p>Selected: ${file.name}</p>`;
        document.getElementById('convertPdfBtn').style.display = 'block';
    }
}

async function convertPdfToJpg() {
    const input = document.getElementById('pdfToJpgInput');
    const formData = new FormData();
    formData.append('file', input.files[0]);
    
    showLoading('Converting PDF to images...');
    
    try {
        const response = await fetch('/api/pdf-to-jpg', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const blob = await response.blob();
            downloadBlob(blob, 'converted_images.zip');
            showSuccess('PDF converted to images successfully!');
        } else {
            showError('Failed to convert PDF');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Helper functions
function displayFileList(files, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="file-list">';
    
    files.forEach(file => {
        container.innerHTML += `<div class="file-item"><span>${file.name}</span></div>`;
    });
    
    container.innerHTML += '</div>';
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadResults() {
    if (!currentData) return;
    
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    downloadBlob(blob, 'analysis_results.json');
}

function showLoading(message) {
    // Implement loading overlay
    console.log('Loading:', message);
}

function hideLoading() {
    console.log('Loading complete');
}

function showError(message) {
    alert('Error: ' + message);
}

function showSuccess(message) {
    alert('Success: ' + message);
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}