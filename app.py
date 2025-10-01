from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from PyPDF2 import PdfMerger, PdfReader
from PIL import Image
import io
import base64
from scipy import stats
from sklearn.preprocessing import StandardScaler
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Set seaborn style
sns.set_style("whitegrid")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    try:
        if 'file' in request.files:
            file = request.files['file']
            df = pd.read_excel(file) if file.filename.endswith('.xlsx') else pd.read_csv(file)
        else:
            data = request.json['data']
            df = pd.DataFrame(data)
        
        # Basic statistics
        stats_summary = df.describe().to_dict()
        
        # Correlation matrix
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        correlation = df[numeric_cols].corr().to_dict() if len(numeric_cols) > 1 else {}
        
        # Generate visualizations
        charts = generate_charts(df)
        
        return jsonify({
            'success': True,
            'stats': stats_summary,
            'correlation': correlation,
            'charts': charts,
            'columns': df.columns.tolist(),
            'shape': df.shape
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/smooth', methods=['POST'])
def smooth_data():
    try:
        data = request.json
        df = pd.DataFrame(data['data'])
        column = data['column']
        method = data.get('method', 'moving_average')
        window = data.get('window', 3)
        
        if method == 'moving_average':
            df[f'{column}_smoothed'] = df[column].rolling(window=window).mean()
        elif method == 'exponential':
            df[f'{column}_smoothed'] = df[column].ewm(span=window).mean()
        elif method == 'savgol':
            from scipy.signal import savgol_filter
            df[f'{column}_smoothed'] = savgol_filter(df[column].fillna(0), window, 2)
        
        return jsonify({'success': True, 'data': df.to_dict('records')})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/binning', methods=['POST'])
def bin_data():
    try:
        data = request.json
        df = pd.DataFrame(data['data'])
        column = data['column']
        bins = data.get('bins', 5)
        method = data.get('method', 'equal_width')
        
        if method == 'equal_width':
            df[f'{column}_binned'] = pd.cut(df[column], bins=bins, labels=False)
        elif method == 'equal_frequency':
            df[f'{column}_binned'] = pd.qcut(df[column], q=bins, labels=False, duplicates='drop')
        
        return jsonify({'success': True, 'data': df.to_dict('records')})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/normalize', methods=['POST'])
def normalize_data():
    try:
        data = request.json
        df = pd.DataFrame(data['data'])
        columns = data['columns']
        
        scaler = StandardScaler()
        df[columns] = scaler.fit_transform(df[columns])
        
        return jsonify({'success': True, 'data': df.to_dict('records')})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/merge-pdf', methods=['POST'])
def merge_pdfs():
    try:
        files = request.files.getlist('files')
        merger = PdfMerger()
        
        for file in files:
            merger.append(file)
        
        output = io.BytesIO()
        merger.write(output)
        output.seek(0)
        merger.close()
        
        return send_file(output, mimetype='application/pdf', as_attachment=True, download_name='merged.pdf')
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/jpg-to-pdf', methods=['POST'])
def jpg_to_pdf():
    try:
        files = request.files.getlist('files')
        images = []
        
        for file in files:
            img = Image.open(file)
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            images.append(img)
        
        output = io.BytesIO()
        images[0].save(output, format='PDF', save_all=True, append_images=images[1:])
        output.seek(0)
        
        return send_file(output, mimetype='application/pdf', as_attachment=True, download_name='converted.pdf')
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/pdf-to-jpg', methods=['POST'])
def pdf_to_jpg():
    try:
        from pdf2image import convert_from_bytes
        file = request.files['file']
        images = convert_from_bytes(file.read())
        
        zip_buffer = io.BytesIO()
        import zipfile
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            for i, img in enumerate(images):
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='JPEG')
                zip_file.writestr(f'page_{i+1}.jpg', img_buffer.getvalue())
        
        zip_buffer.seek(0)
        return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name='converted_images.zip')
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

def generate_charts(df):
    charts = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    if len(numeric_cols) >= 1:
        # Bar chart
        plt.figure(figsize=(10, 6))
        df[numeric_cols[0]].value_counts().head(10).plot(kind='bar', color='#667eea')
        plt.title(f'Distribution of {numeric_cols[0]}')
        plt.tight_layout()
        charts['bar'] = fig_to_base64(plt.gcf())
        plt.close()
        
        # Histogram
        plt.figure(figsize=(10, 6))
        plt.hist(df[numeric_cols[0]].dropna(), bins=30, color='#764ba2', alpha=0.7)
        plt.title(f'Histogram of {numeric_cols[0]}')
        plt.tight_layout()
        charts['histogram'] = fig_to_base64(plt.gcf())
        plt.close()
    
    if len(numeric_cols) >= 2:
        # Scatter plot
        plt.figure(figsize=(10, 6))
        plt.scatter(df[numeric_cols[0]], df[numeric_cols[1]], alpha=0.6, color='#f093fb')
        plt.xlabel(numeric_cols[0])
        plt.ylabel(numeric_cols[1])
        plt.title('Scatter Plot')
        plt.tight_layout()
        charts['scatter'] = fig_to_base64(plt.gcf())
        plt.close()
        
        # Pie chart (if applicable)
        if len(df) <= 20:
            plt.figure(figsize=(10, 6))
            df[numeric_cols[0]].value_counts().head(5).plot(kind='pie', autopct='%1.1f%%', colors=sns.color_palette('pastel'))
            plt.title(f'Pie Chart of {numeric_cols[0]}')
            plt.tight_layout()
            charts['pie'] = fig_to_base64(plt.gcf())
            plt.close()
    
    return charts

def fig_to_base64(fig):
    buffer = io.BytesIO()
    fig.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
    buffer.seek(0)
    img_str = base64.b64encode(buffer.read()).decode()
    return f'data:image/png;base64,{img_str}'

if __name__ == '__main__':
    app.run(debug=True, port=5000)