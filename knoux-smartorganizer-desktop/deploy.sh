#!/bin/bash

# 🚀 Knoux SmartOrganizer PRO - Deployment Script
# This script builds the application for distribution

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions for colored output
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Header
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              Knoux SmartOrganizer PRO - Deploy              ║"
echo "║                   Desktop App Builder                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    log_error "package.json not found. Please run this script from the project root."
    exit 1
fi

if [[ ! -f "main.js" ]]; then
    log_error "main.js not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Environment check
log_step "Checking environment..."

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="16.0.0"

if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi

# Simple version comparison
if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
    log_error "Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION or newer"
    exit 1
fi

log_success "Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm --version)
log_success "npm version: $NPM_VERSION"

# Step 2: Clean previous builds
log_step "Cleaning previous builds..."

if [[ -d "dist" ]]; then
    rm -rf dist
    log_info "Removed existing dist directory"
fi

if [[ -d "node_modules" ]]; then
    log_info "Cleaning node_modules for fresh install..."
    rm -rf node_modules
fi

# Step 3: Install dependencies
log_step "Installing production dependencies..."

npm ci --only=production

if [[ $? -ne 0 ]]; then
    log_error "Failed to install dependencies"
    exit 1
fi

log_success "Dependencies installed successfully"

# Step 4: Install dev dependencies for building
log_step "Installing build dependencies..."

npm install electron-builder --save-dev

if [[ $? -ne 0 ]]; then
    log_error "Failed to install build dependencies"
    exit 1
fi

log_success "Build dependencies installed"

# Step 5: Create assets directory if it doesn't exist
log_step "Preparing assets..."

if [[ ! -d "assets" ]]; then
    mkdir -p assets
    log_info "Created assets directory"
fi

# Create a simple icon if one doesn't exist
if [[ ! -f "assets/icon.png" ]]; then
    log_warning "No icon found at assets/icon.png"
    log_info "You should add an icon file (256x256 PNG) for better branding"
fi

# Step 6: Verify critical files
log_step "Verifying application files..."

CRITICAL_FILES=("main.js" "preload.js" "ui/index.html" "ui/app.js" "package.json")

for file in "${CRITICAL_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        log_error "Critical file missing: $file"
        exit 1
    fi
    log_success "Found: $file"
done

# Step 7: Build the application
log_step "Building application..."

# Detect platform and build accordingly
OS="$(uname -s)"
case "${OS}" in
    Linux*)     
        log_info "Building for Linux..."
        npm run build -- --linux
        ;;
    Darwin*)    
        log_info "Building for macOS..."
        npm run build -- --mac
        ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*)     
        log_info "Building for Windows..."
        npm run build -- --win
        ;;
    *)          
        log_warning "Unknown OS: ${OS}. Building for current platform..."
        npm run build
        ;;
esac

if [[ $? -ne 0 ]]; then
    log_error "Build failed"
    exit 1
fi

log_success "Build completed successfully"

# Step 8: Display results
log_step "Build results:"

if [[ -d "dist" ]]; then
    echo
    log_info "Built files:"
    ls -la dist/
    
    # Calculate total size
    TOTAL_SIZE=$(du -sh dist/ | cut -f1)
    log_info "Total build size: $TOTAL_SIZE"
    
    # Find executable files
    echo
    log_info "Executable files:"
    find dist/ -type f -executable -o -name "*.exe" -o -name "*.dmg" -o -name "*.AppImage" | while read file; do
        if [[ -f "$file" ]]; then
            SIZE=$(du -sh "$file" | cut -f1)
            echo -e "  ${GREEN}📦 $(basename "$file")${NC} (${SIZE})"
        fi
    done
else
    log_error "dist directory not found after build"
    exit 1
fi

# Step 9: Create deployment package
log_step "Creating deployment package..."

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PACKAGE_NAME="knoux-smartorganizer-pro_${TIMESTAMP}"

if [[ -d "dist" ]]; then
    # Copy README and other important files to dist
    cp README.md dist/ 2>/dev/null || true
    cp START.md dist/ 2>/dev/null || true
    
    # Create a release package
    cd dist
    
    if command -v zip &> /dev/null; then
        zip -r "../${PACKAGE_NAME}.zip" .
        cd ..
        log_success "Created release package: ${PACKAGE_NAME}.zip"
    else
        cd ..
        tar -czf "${PACKAGE_NAME}.tar.gz" -C dist .
        log_success "Created release package: ${PACKAGE_NAME}.tar.gz"
    fi
fi

# Step 10: Final instructions
echo
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     🎉 BUILD SUCCESSFUL!                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

log_info "What's next:"
echo "  1. Find your executable in the 'dist' directory"
echo "  2. Test the executable on your target system"
echo "  3. Distribute the executable to users"
echo

log_info "Distribution tips:"
echo "  • The executable is self-contained"
echo "  • Users don't need to install Node.js"
echo "  • First run will download AI models (requires internet)"
echo "  • Provide the README.md for user instructions"
echo

log_warning "Important notes:"
echo "  • AI models will be downloaded on first run (~2-3GB)"
echo "  • Users need 8GB+ RAM for optimal performance"
echo "  • Antivirus software might flag the executable (false positive)"
echo

log_success "Deployment completed successfully!"

# Step 11: Optional - Generate checksums
if command -v sha256sum &> /dev/null; then
    log_step "Generating checksums..."
    find dist/ -type f \( -name "*.exe" -o -name "*.dmg" -o -name "*.AppImage" \) -exec sha256sum {} \; > checksums.txt
    log_success "Checksums saved to checksums.txt"
fi

echo
log_info "Happy deploying! 🚀"
