# Dockerfile for Python Flask Microservice (Lab Syllabus Exercise)
FROM python:3.12-slim

# Create system user for secure non-root execution
RUN useradd -m -r appuser && mkdir -p /app/data && chown -R appuser:appuser /app

WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app.py ./
COPY migrations ./migrations
RUN chown -R appuser:appuser /app

USER appuser

ENV PORT=5000
ENV FLASK_DB_PATH=/app/data/complaints_flask.db
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://localhost:{os.getenv(\"PORT\", \"5000\")}/health')" || exit 1

CMD ["python", "app.py"]
