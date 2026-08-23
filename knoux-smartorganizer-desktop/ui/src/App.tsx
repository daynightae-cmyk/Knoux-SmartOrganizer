import React, { useState, useEffect } from "react";
import "./App.css";

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: {
      organizeImages: () => Promise<any>;
      getStats: () => Promise<any>;
      openFolder: (folderType: string) => Promise<void>;
      selectRawFolder: () => Promise<any>;
      onProgressUpdate: (callback: (event: any, data: any) => void) => void;
      onNewImage: (callback: (event: any, data: any) => void) => void;
      removeProgressListener: () => void;
      removeNewImageListener: () => void;
    };
  }
}

interface ProcessingProgress {
  current: number;
  total: number;
  currentFile: string;
}

interface Stats {
  rawImages: number;
  categorized: Record<string, number>;
  basePath: string;
}

interface Results {
  total: number;
  processed: number;
  successful: number;
  errors: number;
  categories: Record<string, number>;
  processingTime: number;
  sessionId: string;
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Load initial stats
    loadStats();

    // Setup progress listener
    window.electronAPI.onProgressUpdate((event, data) => {
      setProgress(data);
    });

    // Setup new image listener
    window.electronAPI.onNewImage((event, imagePath) => {
      console.log("New image detected:", imagePath);
      loadStats(); // Refresh stats when new image is added
    });

    // Cleanup
    return () => {
      window.electronAPI.removeProgressListener();
      window.electronAPI.removeNewImageListener();
    };
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await window.electronAPI.getStats();
      if (statsData.error) {
        setError(statsData.error);
      } else {
        setStats(statsData);
        setError("");
      }
    } catch (err) {
      setError("Failed to load statistics");
    }
  };

  const handleOrganizeImages = async () => {
    setIsProcessing(true);
    setProgress(null);
    setResults(null);
    setError("");

    try {
      const result = await window.electronAPI.organizeImages();

      if (result.error) {
        setError(result.error);
      } else {
        setResults(result);
        await loadStats(); // Refresh stats after processing
      }
    } catch (err) {
      setError("Failed to organize images: " + (err as Error).message);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const result = await window.electronAPI.selectRawFolder();
      if (result.imported > 0) {
        await loadStats();
        alert(
          `Successfully imported ${result.imported} images from ${result.path}`,
        );
      }
    } catch (err) {
      setError("Failed to select folder: " + (err as Error).message);
    }
  };

  const openFolder = (folderType: string) => {
    window.electronAPI.openFolder(folderType);
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">🧠</div>
            <div>
              <h1>Knoux SmartOrganizer PRO</h1>
              <p>AI-Powered Desktop Photo Organizer</p>
            </div>
          </div>

          {stats && (
            <div className="stats-section">
              <div className="stat-item">
                <span className="stat-number">{stats.rawImages}</span>
                <span className="stat-label">Images in Raw</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {Object.values(stats.categorized).reduce((a, b) => a + b, 0)}
                </span>
                <span className="stat-label">Organized</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            {error.includes("No images found") && stats && (
              <div className="error-help">
                <p>
                  📁 Raw images folder: <code>{stats.basePath}/images/raw</code>
                </p>
                <button onClick={handleSelectFolder} className="import-button">
                  📂 Import Images from Folder
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Action Section */}
        <div className="action-section">
          <div className="organize-card">
            <h2>🎯 Smart Organization</h2>
            <p>Analyze and organize your images using 7 AI tools:</p>

            <div className="ai-tools">
              <div className="tool">📷 Image Classification</div>
              <div className="tool">🚫 NSFW Detection</div>
              <div className="tool">🙂 Face Recognition</div>
              <div className="tool">🧾 Text Extraction (OCR)</div>
              <div className="tool">🔁 Duplicate Detection</div>
              <div className="tool">🧠 Smart Descriptions</div>
              <div className="tool">🗂️ Auto Categorization</div>
            </div>

            <button
              onClick={handleOrganizeImages}
              disabled={isProcessing || (stats && stats.rawImages === 0)}
              className={`organize-button ${isProcessing ? "processing" : ""}`}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  نظّم الصور جاري...
                </>
              ) : (
                <>🚀 نظّم الصور</>
              )}
            </button>

            {progress && (
              <div className="progress-section">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  Processing {progress.current} of {progress.total}:{" "}
                  {progress.currentFile}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="results-section">
            <h2>📊 Processing Results</h2>
            <div className="results-grid">
              <div className="result-card">
                <div className="result-number">{results.successful}</div>
                <div className="result-label">Successfully Processed</div>
              </div>
              <div className="result-card">
                <div className="result-number">{results.errors}</div>
                <div className="result-label">Errors</div>
              </div>
              <div className="result-card">
                <div className="result-number">
                  {formatTime(results.processingTime)}
                </div>
                <div className="result-label">Processing Time</div>
              </div>
            </div>

            <div className="categories-section">
              <h3>📂 Categorization Results</h3>
              <div className="categories-grid">
                {Object.entries(results.categories).map(
                  ([category, count]) =>
                    count > 0 && (
                      <div key={category} className="category-item">
                        <span className="category-icon">
                          {category === "nsfw"
                            ? "🚫"
                            : category === "selfies"
                              ? "🤳"
                              : category === "documents"
                                ? "📄"
                                : category === "duplicates"
                                  ? "🔄"
                                  : category === "nature"
                                    ? "🌿"
                                    : category === "food"
                                      ? "🍕"
                                      : category === "screenshots"
                                        ? "📱"
                                        : "📁"}
                        </span>
                        <span className="category-name">{category}</span>
                        <span className="category-count">{count}</span>
                      </div>
                    ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* Folder Management */}
        <div className="folders-section">
          <h2>📁 Folder Management</h2>
          <div className="folder-buttons">
            <button onClick={() => openFolder("raw")} className="folder-button">
              📂 Open Raw Images
            </button>
            <button
              onClick={() => openFolder("classified")}
              className="folder-button"
            >
              🗂️ Open Classified
            </button>
            <button
              onClick={() => openFolder("renamed")}
              className="folder-button"
            >
              📝 Open Renamed
            </button>
            <button
              onClick={() => openFolder("logs")}
              className="folder-button"
            >
              📋 Open Logs
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {stats &&
          stats.categorized &&
          Object.values(stats.categorized).some((count) => count > 0) && (
            <div className="dashboard-section">
              <h2>📈 Current Statistics</h2>
              <div className="dashboard-grid">
                {Object.entries(stats.categorized).map(
                  ([category, count]) =>
                    count > 0 && (
                      <div key={category} className="dashboard-item">
                        <div className="dashboard-number">{count}</div>
                        <div className="dashboard-label">{category}</div>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}
      </main>
    </div>
  );
}

export default App;
