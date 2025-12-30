import { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./Sidebar";
import CodeViewer from "./CodeViewer";

function App() {
  const [currentFile, setCurrentFile] = useState(
    localStorage.getItem("lastFile")
  );

  useEffect(() => {
    if (currentFile) {
      localStorage.setItem("lastFile", currentFile);
    }
  }, [currentFile]);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-color-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app">
      <Sidebar
        currentFile={currentFile}
        onFileSelect={(file) => {
          setCurrentFile(file);
          closeSidebar(); 
        }}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <main className="main-content">
        <div className="header">
          <button
            className="hamburger-btn"
            onClick={openSidebar}
            aria-label="Open sidebar"
          >
            ☰
          </button>

          <h1 className="header-title">
            {currentFile || "Select a file"}
          </h1>

          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        {currentFile ? (
          <CodeViewer file={currentFile} />
        ) : (
          <div className="empty-state">
            <p>👈 Select a file from the sidebar to view</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
