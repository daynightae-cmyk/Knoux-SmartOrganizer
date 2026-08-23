# 🧠 Knoux SmartOrganizer PRO

**AI-Powered Photo Organization Tool** - Transform chaos into order with intelligent classification, smart renaming, and automated organization using cutting-edge artificial intelligence.

![Knoux SmartOrganizer](https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge&logo=artificial-intelligence)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3+-06B6D4?style=for-the-badge&logo=tailwindcss)

## ✨ Features

### 🤖 Core AI Features

- **Smart Classification** - Automatically categorize images (selfies, documents, nature, food, etc.)
- **AI Auto-Renaming** - Generate descriptive filenames based on image content
- **Face Detection** - Identify and count faces in images using face-api.js
- **Duplicate Detection** - Find similar/duplicate images using perceptual hashing
- **OCR Text Extraction** - Extract text from images using Tesseract.js
- **NSFW Detection** - Content filtering and safety classification
- **Smart Folder Organization** - Automatic categorization into organized folders

### 🎨 User Experience

- **Beautiful Modern UI** - Clean, responsive design with smooth animations
- **Real-time Processing** - Live progress tracking with AI status indicators
- **Drag & Drop Upload** - Easy bulk image upload with preview
- **Advanced Filtering** - Filter by category, size, date, content features
- **Export Results** - Download organization reports and statistics
- **Smart Suggestions** - AI-powered recommendations for better organization

### 🛠 Technical Features

- **Offline Capable** - Works completely offline once models are loaded
- **Web-based AI Models** - TensorFlow.js, face-api.js, Tesseract.js
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Theme** - Automatic theme switching
- **Performance Optimized** - Efficient processing with progress tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/knoux/smart-organizer.git
   cd smart-organizer
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

### Optional: AI Models Setup

For enhanced AI features, download the face detection models:

1. Visit [face-api.js models](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
2. Download all `.json` and `.bin` files
3. Place them in `public/models/face-api/`

The app works with fallback AI even without these models!

## 🎯 How to Use

### 1. Upload Images

- Drag and drop images onto the upload zone
- Or click to browse and select multiple images
- Supports: JPEG, PNG, GIF, WebP, BMP, SVG

### 2. Configure AI Processing

- Toggle features: Auto-rename, Face detection, Text extraction, Duplicate finding
- Adjust quality thresholds and processing options

### 3. Smart Organize

- Click the "Smart Organize" button
- Watch real-time AI analysis and classification
- View detailed processing statistics

### 4. Review and Filter

- Use smart filters to view categorized images
- Apply bulk actions to selected images
- Export results and organization reports

### 5. AI Suggestions

- Review AI-powered organization suggestions
- Apply recommendations with one click
- Improve organization over time

## 🏗 Architecture

### Frontend Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Radix UI** - Accessible UI primitives

### AI/ML Stack

- **TensorFlow.js** - Browser-based machine learning
- **face-api.js** - Face detection and recognition
- **Tesseract.js** - OCR text extraction
- **Custom Classification** - Rule-based image analysis

### Build Tools

- **Vite** - Fast development and building
- **Vitest** - Unit testing framework
- **ESLint + Prettier** - Code formatting and linting

## 📂 Project Structure

```
src/
├── components/ui/          # Reusable UI components
│   ├── image-dropzone.tsx  # Drag & drop upload
│   ├── image-grid.tsx      # Image display grid
│   ├── filter-sidebar.tsx  # Advanced filtering
│   └── ...
├── hooks/                  # Custom React hooks
│   └── use-image-organizer.ts
├── lib/                    # Utilities and AI engine
│   ├── ai-engine.ts        # Core AI processing
│   └── utils.ts            # Helper functions
├── pages/                  # Application pages
│   ├── Index.tsx           # Main organizer interface
│   └── NotFound.tsx        # 404 page
├── types/                  # TypeScript definitions
│   └── organizer.ts        # Core type definitions
└── ...
```

## 🔧 Configuration

### Environment Variables

No environment variables required - everything runs client-side!

### AI Model Configuration

Modify `src/lib/ai-engine.ts` to:

- Add new AI models
- Adjust classification thresholds
- Customize processing options

### UI Customization

Update `tailwind.config.ts` to:

- Change color schemes
- Modify spacing and typography
- Add custom animations

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Write TypeScript for type safety
- Use existing UI components when possible
- Add tests for new utilities
- Follow the existing code style
- Update documentation for new features

## 📚 API Reference

### `useImageOrganizer` Hook

Main hook for image processing and organization.

```typescript
const {
  images, // Array of processed images
  progress, // Processing progress state
  stats, // Processing statistics
  processImages, // Start AI processing
  addImages, // Add new images
  removeImage, // Remove specific image
  // ... more methods
} = useImageOrganizer();
```

### `AIEngine` Class

Core AI processing engine.

```typescript
const aiEngine = new AIEngine();
await aiEngine.analyzeImage(file); // Analyze single image
const category = aiEngine.categorizeImage(analysis);
const filename = aiEngine.generateSmartFilename(analysis);
```

## 🎨 Customization

### Adding New Categories

1. Update `ImageCategory` type in `src/types/organizer.ts`
2. Add category logic in `AIEngine.categorizeImage()`
3. Add icons and colors in UI components

### Custom AI Models

1. Add model loading in `AIEngine.initializeModels()`
2. Implement analysis logic in `AIEngine.analyzeImage()`
3. Update UI to show model status

## 🔒 Privacy & Security

- **100% Client-Side** - No data sent to external servers
- **Offline Capable** - Works without internet after initial load
- **Local Processing** - All AI runs in your browser
- **No Data Collection** - Your images never leave your device

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TensorFlow.js](https://www.tensorflow.org/js) - Machine learning in the browser
- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Face detection
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR text extraction
- [Radix UI](https://www.radix-ui.com/) - Accessible UI primitives
- [Lucide Icons](https://lucide.dev/) - Beautiful icons

---

**Built with ❤️ by Knoux Technologies**

_Transforming digital chaos into organized intelligence, one image at a time._
