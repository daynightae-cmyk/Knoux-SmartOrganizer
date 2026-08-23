#!/usr/bin/env node
/**
 * Knoux SmartOrganizer - EXE Build Script
 * Creates Windows executable using Electron Builder
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Knoux SmartOrganizer - EXE Build Process");
console.log("👨‍💻 Prof. Sadek Elgazar");
console.log("===============================================");

// Check if this is Windows
if (process.platform !== "win32") {
  console.log("⚠️  This build script is designed for Windows");
  console.log("💡 You can still build for Windows from other platforms");
}

// Ensure required directories exist
const requiredDirs = ["build", "assets", "tools", "models", "data", "logs"];

console.log("📁 Creating required directories...");
requiredDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  }
});

// Create Electron main process file
console.log("⚙️  Creating Electron configuration...");

const electronMain = `
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        minWidth: 1280,
        minHeight: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        title: 'Knoux SmartOrganizer',
        show: false,
        frame: true,
        titleBarStyle: 'default',
        backgroundThrottling: false
    });

    // Load the app
    const startUrl = isDev 
        ? 'http://localhost:8080' 
        : 'file://' + path.join(__dirname, '../build/index.html');
    
    mainWindow.loadURL(startUrl);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.maximize();
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers for tool execution
ipcMain.handle('execute-tool', async (event, toolId, args) => {
    try {
        console.log('Executing tool: ' + toolId);
        
        const pythonProcess = spawn('python', [
            path.join(__dirname, 'backend/tool-runner.py'),
            '--run', toolId
        ], {
            stdio: 'pipe',
            encoding: 'utf-8'
        });

        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (e) {
                        resolve({ success: true, output: stdout });
                    }
                } else {
                    reject(new Error('Tool execution failed: ' + stderr));
                }
            });
        });
    } catch (error) {
        console.error('Tool execution error:', error);
        throw error;
    }
});

app.setAppUserModelId('com.knoux.smartorganizer');
console.log('Knoux SmartOrganizer Electron App Started');
`;

fs.writeFileSync("electron-main.js", electronMain);

// Create preload script
const preloadScript = `
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    executeTool: (toolId, args) => ipcRenderer.invoke('execute-tool', toolId, args),
    getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
    platform: process.platform,
    versions: process.versions
});

console.log('Knoux SmartOrganizer Preload Script Loaded');
`;

fs.writeFileSync("preload.js", preloadScript);

// Create package.json for Electron
const electronPackage = {
  name: "knoux-smartorganizer",
  version: "2.0.0",
  description: "Advanced Windows File Organization Tool with AI",
  main: "electron-main.js",
  author: "Prof. Sadek Elgazar",
  license: "MIT",
  scripts: {
    electron: "electron .",
    "electron-build": "electron-builder",
    "build-exe": "npm run build && electron-builder --win --x64",
  },
  devDependencies: {
    electron: "^28.0.0",
    "electron-builder": "^24.9.1",
    "electron-is-dev": "^2.0.0",
  },
  build: {
    appId: "com.knoux.smartorganizer",
    productName: "Knoux SmartOrganizer",
    directories: {
      output: "dist",
      buildResources: "assets",
    },
    files: [
      "build/**/*",
      "electron-main.js",
      "preload.js",
      "backend/**/*",
      "tools/**/*",
      "models/**/*",
      "data/**/*",
      "node_modules/**/*",
      "package.json",
    ],
    win: {
      target: [
        {
          target: "nsis",
          arch: ["x64"],
        },
      ],
      icon: "assets/icon.ico",
      requestedExecutionLevel: "requireAdministrator",
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      shortcutName: "Knoux SmartOrganizer",
    },
  },
};

fs.writeFileSync(
  "package-electron.json",
  JSON.stringify(electronPackage, null, 2),
);

// Create README for deployment
const deploymentReadme = `# Knoux SmartOrganizer - Deployment Guide

## 📦 EXE Build Process

### Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- Windows 10/11 (for building Windows executable)

### Build Steps

1. **Install Dependencies**
   \`\`\`bash
   npm install
   npm install electron electron-builder electron-is-dev --save-dev
   \`\`\`

2. **Build React App**
   \`\`\`bash
   npm run build
   \`\`\`

3. **Create EXE**
   \`\`\`bash
   node build-exe.js
   \`\`\`

4. **Find Your EXE**
   - Check the \`dist\` folder
   - Install the NSIS installer or use the portable version

## 🛠️ Tool Scripts Included

### RemoveDuplicate PRO (20 tools)
- Smart Image Scanner (AI-powered)
- Video Duplicate Finder
- Audio Duplicate Detector
- Document Similarity Finder
- Binary File Duplicates
- And 15 more...

### System Cleaner (20 tools)
- Registry Optimizer (PowerShell)
- Startup Manager
- Service Optimizer
- Memory Cleaner
- Disk Analyzer
- And 15 more...

### Privacy Guard (7 tools)
- Browser History Cleaner
- Tracking Blocker
- Cookie Manager
- File Shredder
- Metadata Cleaner
- DNS Security
- VPN Manager

### Additional Sections
- Folder Master (7 tools)
- Text Analyzer (7 tools)
- Media Organizer (7 tools)
- Productivity Hub (7 tools)
- Smart Organizer (10 tools)
- Boost Mode (5 tools)
- Smart Advisor (5 tools)

## 🤖 AI Models Supported

- **GPT4All Falcon**: Local text generation
- **CLIP**: Image classification and analysis
- **Whisper**: Speech-to-text processing
- **SentenceTransformers**: Text similarity

## 💻 System Requirements

- **OS**: Windows 10/11
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 20GB free space
- **CPU**: Multi-core processor recommended
- **GPU**: Optional (for AI acceleration)

## 🚀 Features

✅ **Fully Offline**: No internet required
✅ **Real Tools**: PowerShell, Python, Node.js scripts
✅ **Live Preview**: Real-time system monitoring
✅ **AI Powered**: Local AI models
✅ **Glass UI**: Premium glassmorphism interface
✅ **95 Tools**: Across 10 specialized sections

## 👨‍💻 Author

**Prof. Sadek Elgazar**  
Advanced File Organization Specialist

---

© 2024 Knoux SmartOrganizer - The Ultimate Windows File Management Tool
`;

fs.writeFileSync("DEPLOYMENT_README.md", deploymentReadme);

console.log("✅ Build configuration completed!");
console.log("📋 Files created:");
console.log("   - electron-main.js (Electron main process)");
console.log("   - preload.js (Security bridge)");
console.log("   - package-electron.json (Electron config)");
console.log("   - DEPLOYMENT_README.md (Documentation)");
console.log("");
console.log("🎯 Next Steps:");
console.log(
  "1. npm install electron electron-builder electron-is-dev --save-dev",
);
console.log("2. npm run build");
console.log("3. npx electron-builder --win --x64");
console.log("");
console.log('🎉 Your EXE will be in the "dist" folder!');
console.log("👨‍💻 Created by Prof. Sadek Elgazar");
