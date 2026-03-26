FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN for i in 1 2 3; do apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/* && break || sleep 5; done

# Create a non-root user for security
RUN useradd -m python

# Copy requirements and install
COPY requirements.txt .
RUN for i in 1 2 3; do pip install --default-timeout=100 --no-cache-dir -r requirements.txt && break || sleep 5; done

# Copy application code
COPY . .

# Set permissions and switch to user
RUN chown -R python:python /app
USER python

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=9000

EXPOSE 9000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000"]
