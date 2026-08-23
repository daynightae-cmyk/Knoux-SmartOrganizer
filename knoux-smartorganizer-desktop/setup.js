#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

console.log("🚀 Knoux SmartOrganizer PRO - Setup Script");
console.log("=".repeat(50));

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);

  log("🔍 Checking Node.js version...", "cyan");
  log(`   Current version: ${nodeVersion}`, "blue");

  if (majorVersion < 16) {
    log(
      "❌ Error: Node.js 16 or higher is required for this application.",
      "red",
    );
    log("   Please update Node.js and try again.", "yellow");
    process.exit(1);
  }

  log("✅ Node.js version check passed", "green");
}

function checkSystemRequirements() {
  log("\n🔍 Checking system requirements...", "cyan");

  const platform = os.platform();
  const arch = os.arch();
  const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);

  log(`   Platform: ${platform}`, "blue");
  log(`   Architecture: ${arch}`, "blue");
  log(`   Total Memory: ${totalMem} GB`, "blue");

  if (totalMem < 4) {
    log(
      "⚠️  Warning: Less than 4GB RAM detected. Performance may be affected.",
      "yellow",
    );
  }

  // Check for required system dependencies
  const requiredCommands = ["python3", "make", "g++"];
  const missingCommands = [];

  for (const cmd of requiredCommands) {
    try {
      execSync(`which ${cmd}`, { stdio: "ignore" });
      log(`   ✅ ${cmd} found`, "green");
    } catch (error) {
      missingCommands.push(cmd);
      log(`   ❌ ${cmd} not found`, "red");
    }
  }

  if (missingCommands.length > 0) {
    log("\n⚠️  Missing system dependencies:", "yellow");
    log("   The following commands are required for building native modules:");
    missingCommands.forEach((cmd) => log(`   - ${cmd}`, "yellow"));

    if (platform === "darwin") {
      log("\n   On macOS, install Xcode Command Line Tools:", "blue");
      log("   xcode-select --install", "cyan");
    } else if (platform === "linux") {
      log("\n   On Ubuntu/Debian:", "blue");
      log("   sudo apt-get install build-essential python3", "cyan");
      log("\n   On CentOS/RHEL:", "blue");
      log("   sudo yum groupinstall 'Development Tools'", "cyan");
    } else if (platform === "win32") {
      log("\n   On Windows, install Visual Studio Build Tools:", "blue");
      log(
        "   https://visualstudio.microsoft.com/visual-cpp-build-tools/",
        "cyan",
      );
    }

    log(
      "\n   You may proceed, but installation might fail without these dependencies.",
      "yellow",
    );
  }

  log("✅ System requirements check completed", "green");
}

function createDirectories() {
  log("\n📁 Creating application directories...", "cyan");

  const directories = [
    path.join(os.homedir(), "KnouxOrganizer"),
    path.join(os.homedir(), "KnouxOrganizer", "images"),
    path.join(os.homedir(), "KnouxOrganizer", "images", "raw"),
    path.join(os.homedir(), "KnouxOrganizer", "images", "processed"),
    path.join(os.homedir(), "KnouxOrganizer", "images", "classified"),
    path.join(os.homedir(), "KnouxOrganizer", "images", "duplicates"),
    path.join(os.homedir(), "KnouxOrganizer", "images", "rejected"),
    path.join(os.homedir(), "KnouxOrganizer", "logs"),
    path.join(os.homedir(), "KnouxOrganizer", "temp"),
  ];

  directories.forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`   ✅ Created: ${dir}`, "green");
      } else {
        log(`   📁 Exists: ${dir}`, "blue");
      }
    } catch (error) {
      log(`   ❌ Failed to create: ${dir}`, "red");
      log(`      Error: ${error.message}`, "red");
    }
  });

  log("✅ Directory creation completed", "green");
}

function installDependencies() {
  log("\n📦 Installing dependencies...", "cyan");
  log("   This may take several minutes...", "yellow");

  try {
    // First, install basic dependencies
    log("   Installing core dependencies...", "blue");
    execSync("npm install --production", {
      stdio: "inherit",
      cwd: __dirname,
    });

    log("✅ Dependencies installed successfully", "green");
  } catch (error) {
    log("❌ Failed to install dependencies", "red");
    log(`   Error: ${error.message}`, "red");
    log("\n🔧 Troubleshooting tips:", "yellow");
    log("   1. Make sure you have Node.js 16+ installed", "blue");
    log("   2. Check your internet connection", "blue");
    log("   3. Try running: npm cache clean --force", "blue");
    log("   4. Try deleting node_modules and package-lock.json", "blue");
    process.exit(1);
  }
}

function createDesktopShortcut() {
  log("\n🖥️  Creating desktop shortcut...", "cyan");

  const platform = os.platform();
  const appPath = __dirname;
  const desktopPath = path.join(os.homedir(), "Desktop");

  try {
    if (platform === "win32") {
      // Windows shortcut
      const shortcutPath = path.join(
        desktopPath,
        "Knoux SmartOrganizer PRO.bat",
      );
      const shortcutContent = `@echo off
cd /d "${appPath}"
npm start
pause`;
      fs.writeFileSync(shortcutPath, shortcutContent);
      log("   ✅ Windows shortcut created", "green");
    } else if (platform === "darwin") {
      // macOS shortcut
      const shortcutPath = path.join(
        desktopPath,
        "Knoux SmartOrganizer PRO.command",
      );
      const shortcutContent = `#!/bin/bash
cd "${appPath}"
npm start`;
      fs.writeFileSync(shortcutPath, shortcutContent);
      fs.chmodSync(shortcutPath, "755");
      log("   ✅ macOS shortcut created", "green");
    } else {
      // Linux shortcut
      const shortcutPath = path.join(
        desktopPath,
        "knoux-smartorganizer-pro.desktop",
      );
      const shortcutContent = `[Desktop Entry]
Version=1.0
Type=Application
Name=Knoux SmartOrganizer PRO
Comment=AI-powered image organizer
Exec=bash -c "cd '${appPath}' && npm start"
Icon=${path.join(appPath, "assets", "icon.png")}
Terminal=true
Categories=Graphics;Photography;`;
      fs.writeFileSync(shortcutPath, shortcutContent);
      fs.chmodSync(shortcutPath, "755");
      log("   ✅ Linux shortcut created", "green");
    }
  } catch (error) {
    log("⚠️  Could not create desktop shortcut", "yellow");
    log(`   Error: ${error.message}`, "yellow");
  }
}

function displayCompletion() {
  log("\n" + "=".repeat(50), "cyan");
  log("🎉 SETUP COMPLETED SUCCESSFULLY!", "green");
  log("=".repeat(50), "cyan");

  log("\n📋 What's next:", "bright");
  log("   1. Place your images in the 'raw' folder:", "blue");
  log(
    `      ${path.join(os.homedir(), "KnouxOrganizer", "images", "raw")}`,
    "cyan",
  );
  log("\n   2. Start the application:", "blue");
  log("      npm start", "cyan");
  log("      (or use the desktop shortcut)", "blue");

  log("\n📁 Important folders:", "bright");
  log(`   • Raw images: ~/KnouxOrganizer/images/raw`, "blue");
  log(`   • Processed: ~/KnouxOrganizer/images/processed`, "blue");
  log(`   • Classified: ~/KnouxOrganizer/images/classified`, "blue");
  log(`   • Logs: ~/KnouxOrganizer/logs`, "blue");

  log("\n⚠️  First run note:", "yellow");
  log(
    "   The first time you run the app, it will download AI models",
    "yellow",
  );
  log(
    "   This may take 5-10 minutes depending on your internet speed",
    "yellow",
  );
  log("   The models will be cached locally for future use", "yellow");

  log("\n🆘 Need help?", "bright");
  log("   • Check the logs folder for detailed operation logs", "blue");
  log("   • Ensure you have at least 4GB free space for AI models", "blue");
  log("   • For issues, check: npm run dev (development mode)", "blue");

  log("\n🚀 Ready to organize your images intelligently!", "green");
}

function main() {
  try {
    checkNodeVersion();
    checkSystemRequirements();
    createDirectories();
    installDependencies();
    createDesktopShortcut();
    displayCompletion();
  } catch (error) {
    log("\n❌ Setup failed:", "red");
    log(`   ${error.message}`, "red");
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
