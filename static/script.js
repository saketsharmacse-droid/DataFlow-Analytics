// DataFlow Analytics Script

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.getAttribute('data-section');
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(section + '-section').classList.add('active');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(nav => {
            nav.classList.remove('active');
        });
        this.classList.add('active');
    });
});

// Manual Data Entry Toggle
function toggleManualEntry() {
    const manualCard = document.getElementById('manualEntryCard');
    const toolsCard = document.getElementById('toolsCard');
    const resultsCard = document.getElementById('resultsCard');
    
    if (manualCard.style.display === 'none' || manualCard.style.display === '') {
        manualCard.style.display = 'block';
        toolsCard.style.display = 'none';
        resultsCard.style.display = 'none';
    } else {
        manualCard.style.display = 'none';
    }
}

// Data Table Management
let dataRows = 1;

function addRow() {
    dataRows++;
    const table = document.getElementById('dataTable');
    const row = document.createElement('div');
    row.className = 'data-row';
    row.innerHTML = `
        <input type="text" placeholder="Column ${dataRows}" class="data-input">
        <input type="number" placeholder="Value" class="data-input">
        <button onclick="removeRow(this)">Remove</button>
    `;
    table.appendChild(row);
}

function removeRow(button) {
    button.parentElement.remove();
    dataRows--;
}

// Analyze Manual Data
function analyzeManualData() {
    // Show tools card
    document.getElementById('toolsCard').style.display = 'block';
    document.getElementById('resultsCard').style.display = 'none';
}

// Modal Functions
function showSmoothingModal() {
    document.getElementById('smoothingModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Apply Smoothing
function applySmoothing() {
    // Show results
    document.getElementById('resultsCard').style.display = 'block';
    closeModal('smoothingModal');
}

// Placeholder functions for other tools
function showBinningModal() {
    alert('Binning modal not implemented yet');
}

function showNormalizationModal() {
    alert('Normalization modal not implemented yet');
}

function downloadResults() {
    alert('Download functionality not implemented yet');
}

// PDF Functions
function mergePDFs() {
    alert('PDF merging not implemented yet');
}

function convertJpgToPdf() {
    alert('JPG to PDF conversion not implemented yet');
}

function convertPdfToJpg() {
    alert('PDF to JPG conversion not implemented yet');
}

// File Upload Handling
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Show tools and results
        document.getElementById('toolsCard').style.display = 'block';
        document.getElementById('resultsCard').style.display = 'block';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Add initial data row
    addRow();
});
