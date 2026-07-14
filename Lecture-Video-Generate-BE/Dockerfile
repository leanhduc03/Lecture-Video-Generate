FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    poppler-utils \
    libreoffice-java-common \
    git \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --default-timeout=200 --retries 10 -r requirements.txt

# Copy application code
COPY . .

# Tạo TẤT CẢ thư mục cần thiết theo cấu trúc hiện tại
RUN mkdir -p \
    static/ppt_images \
    static/outputs \
    uploads \
    output/presentations

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]