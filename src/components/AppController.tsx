import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { GlassSplashScreen } from "./GlassSplashScreen";
import KnouxMainDashboard from "../pages/KnouxMainDashboard";
import SectionDetailPage from "../pages/SectionDetailPage";
import { OfflineAIToolsSuite } from "./OfflineAIToolsSuite";
import NeomorphismDashboard from "../pages/NeomorphismDashboard";
import OfflineAIToolsPage from "../pages/OfflineAIToolsPage";
import AIAnalysisPage from "../pages/AIAnalysisPage";
import { GlassLayout } from "./GlassLayout";
import "../styles/glass-system.css";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  public state = { hasError: false };

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen glass-background flex items-center justify-center">
          <div className="glass-card p-8 text-center max-w-md mx-auto">
            <h1 className="glass-title text-2xl font-bold mb-4 text-red-400">
              حدث خطأ غير متوقع
            </h1>
            <p className="glass-text mb-6">
              نعتذر، حدث خطأ في التطبيق. يرجى إعادة تحميل الصفحة.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="glass-button-primary"
            >
              إعادة تحميل
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Not Found Component
const NotFound: React.FC = () => (
  <GlassLayout currentPage="">
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md mx-auto">
        <h1 className="glass-title text-6xl font-bold mb-4 text-purple-400">
          404
        </h1>
        <h2 className="glass-title text-2xl font-bold mb-4">
          الصفحة غير موجودة
        </h2>
        <p className="glass-text mb-6">
          عذراً، الصفحة التي تبحث عنها غير متوفرة.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="glass-button-primary"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  </GlassLayout>
);

export const AppController: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Simulate app initialization
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setAppReady(true);
      } catch (error) {
        console.error("App initialization failed:", error);
        setAppReady(true); // Continue anyway
      }
    };

    initializeApp();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <GlassSplashScreen onComplete={handleSplashComplete} />;
  }

  if (!appReady) {
    return (
      <div className="min-h-screen glass-background flex items-center justify-center">
        <div className="glass-spinner" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Knoux Main Dashboard */}
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <KnouxMainDashboard />
                </ErrorBoundary>
              }
            />

            {/* Section Detail Pages */}
            <Route
              path="/section/:sectionId"
              element={
                <ErrorBoundary>
                  <SectionDetailPage
                    sectionId={window.location.pathname.split("/")[2]}
                  />
                </ErrorBoundary>
              }
            />

            {/* AI Tools */}
            <Route
              path="/offline-ai-tools"
              element={
                <ErrorBoundary>
                  <GlassLayout currentPage="ai">
                    <OfflineAIToolsSuite />
                  </GlassLayout>
                </ErrorBoundary>
              }
            />

            {/* Image Analysis */}
            <Route
              path="/ai-analysis"
              element={
                <ErrorBoundary>
                  <GlassLayout currentPage="images">
                    <AIAnalysisPage />
                  </GlassLayout>
                </ErrorBoundary>
              }
            />

            {/* Music Player Dashboard */}
            <Route
              path="/neomorphism-dashboard"
              element={
                <ErrorBoundary>
                  <GlassLayout currentPage="music">
                    <NeomorphismDashboard />
                  </GlassLayout>
                </ErrorBoundary>
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <ErrorBoundary>
                  <GlassLayout currentPage="settings">
                    <div className="glass-card p-8">
                      <h1 className="glass-title text-2xl font-bold mb-6">
                        الإعدادات
                      </h1>
                      <p className="glass-text">
                        صفحة الإعدادات قيد التطوير...
                      </p>
                    </div>
                  </GlassLayout>
                </ErrorBoundary>
              }
            />

            {/* Legacy routes for backward compatibility */}
            <Route path="/ultimate" element={<GlassHomePage />} />
            <Route path="/organizer" element={<GlassHomePage />} />
            <Route path="/simple" element={<GlassHomePage />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={5000}
            theme="dark"
            toastOptions={{
              style: {
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
              },
            }}
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default AppController;
