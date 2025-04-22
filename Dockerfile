# Build stage
FROM python:3.12-slim

# Add metadata
LABEL maintainer="The Losers"
LABEL description="ComplianceAI Agent"
LABEL version="1.0.0"

WORKDIR /complianceai

COPY ./app /complianceai/app
COPY ./complianceUI /complianceai/complianceUI
COPY ./uv.lock /complianceai/uv.lock
COPY ./pyproject.toml /complianceai/pyproject.toml

# Install uv and dependencies
RUN apt-get update && apt-get install -y curl \
    && pip install --upgrade pip \
    && pip install uv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Initialize and sync dependencies
RUN pwd
RUN ls -la
RUN uv sync --verbose
# RUN . .venv/bin/activate

# Create non-root user
RUN useradd -m -u 1000 appuser

# Set proper permissions
RUN chown -R appuser:appuser /complianceai

# Clean up
RUN apt-get clean \
    && rm -rf /var/lib/apt/lists/*


# # Switch to non-root user
USER appuser

# Set environment variables
ENV PYTHONPATH=/complianceai \
    PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Run the application
CMD [".venv/bin/python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]