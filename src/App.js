import { useCallback, useState } from "react";
import Header from "./components/common/Header";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorMessage from "./components/common/ErrorMessage";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { useFetchTransactions } from "./hooks/useFetchTransactions";
import DashboardContent from "./components/dashboard/DashboardContent";
import "./App.css";

/**
 * Root Application component that sets up the theme provider wrapper,
 * main layout container, header navigation, and the core dashboard area.
 * It manages global theme toggling and hooks into the transaction fetch query.
 *
 * @returns {React.ReactElement} The rendered root React application tree
 */
function App() {
  const { transactions, loading, error, refetch } = useFetchTransactions();

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  /**
   * Toggles the application UI theme between light and dark modes.
   */
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", nextTheme);
      return nextTheme;
    });
  }, []);

  /**
   * Retrigger the transactions API request after a query failure.
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div
      className={`app-theme-wrapper ${theme}-theme`}
      data-testid="theme-wrapper"
    >
      <div className="app-container">
        <button
          className="theme-toggle-container"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          data-testid="theme-toggle"
        >
          <span className={`theme-toggle-slider ${theme}`} />
          <span className="theme-toggle-icon-wrap sun">
            <img src="/sun.svg" className="theme-icon" alt="Sun" />
          </span>
          <span className="theme-toggle-icon-wrap moon">
            <img src="/moon.svg" className="theme-icon" alt="Moon" />
          </span>
        </button>
        <Header />

        <main className="app-main">
          <ErrorBoundary onReset={handleRetry}>
            {loading && (
              <LoadingSpinner message="Retrieving transactions ledger..." />
            )}

            {error && (
              <ErrorMessage message={error.message} onRetry={handleRetry} />
            )}

            {!loading && !error && (
              <DashboardContent transactions={transactions} />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
