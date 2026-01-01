# Use the Lambda Python 3.12 image with ARM64 architecture.
FROM public.ecr.aws/lambda/python:3.12-arm64

# Set the working directory for our application code.
WORKDIR /var/task

# Copy the trusted root certificate file.
COPY cacert.pem .

# Copy your requirements file first to take advantage of Docker caching.
COPY backend/requirements.txt .

# Add a new COPY instruction to include praw.ini
COPY backend/praw.ini .

# Install build dependencies required for compiling some Python packages.
RUN microdnf update -y && microdnf install -y \
    gcc \
    gcc-c++ \
    cmake \
    gfortran \
    libgfortran \
    openblas-devel \
    tar \
    gzip \
    zlib-devel \
    libjpeg-turbo-devel \
    libpng-devel \
    libtiff-devel \
    git \
    make \
    pkg-config \
    # Install runtime dependencies for the ML libraries
    libgfortran \
    libstdc++ \
    openblas \
    && microdnf clean all

# Set the cache directory for pip and other packages to a writable location.
ENV PIP_CACHE_DIR=/tmp/pip-cache
ENV BROTLI_HOME=/tmp/brotli
# ENV HF_HOME="/tmp/hf_cache"

# === SOILA: TROUBLESHOOTING MODEL ISSUE === #
ENV HF_HOME=/opt/hf_cache
ENV TRANSFORMERS_CACHE=/opt/hf_cache
ENV MODEL_DIR=/opt/models/m

# Upgrade pip and setuptools, then install all requirements in a single command.
# Using 'python -m pip' is more robust as it calls pip as a module,
# ensuring the correct interpreter and path are always used.
RUN python -m pip install --upgrade pip setuptools && \
    python -m pip install --no-cache-dir -r requirements.txt

# Add the key fix here. This sets the Python path to include our target directory.
# The python interpreter will now be able to find all installed packages.
ENV PYTHONPATH=/var/task

# Copy the rest of your application code.
COPY backend/ backend/

# Set environment variables for single-threaded performance.
# These variables should be set here as well as in the Lambda function's configuration.
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV SKLEARN_NO_OPENMP=True
ENV SCIPY_NO_OPENMP=True

# === SOILA: TROUBLESHOOTING MODEL ISSUE === #
# Bake the model into /opt (persisten image layer)
ARG HF_MODEL_ID=sentence-transformers/multi-qa-MiniLM-L6-cos-v1
RUN python - <<'PY'
import os
from huggingface_hub import snapshot_download
repo = os.environ.get("HF_MODEL_ID", "sentence-transformers/multi-qa-MiniLM-L6-cos-v1")
snapshot_download(
    repo_id=repo,
    local_dir=os.environ.get("MODEL_DIR", "/opt/models/m"),
    local_dir_use_symlinks=False
)
PY

# Pre-download the Hugging Face model during the build process
# to avoid runtime issues with the read-only file system.
# The 'download_model.py' script should download all necessary assets here.
# Make sure to create the directory before using it.
# RUN mkdir -p /tmp/hf_cache && \
#     python -u backend/download_model.py

# Tell the app where to load from
ENV LOCAL_MODEL_PATH=/opt/models/m

# Tell the requests library where to find the certificate bundle.
ENV REQUESTS_CA_BUNDLE="/var/task/cacert.pem"

# The CMD instruction specifies the command to run when the container starts.
# It should point to your Mangum handler, which is correct in your case.
# The python interpreter is the default ENTRYPOINT for this base image.
CMD ["backend.main.handler"]