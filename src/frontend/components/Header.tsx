// Header.tsx
import { MessageCircle, Search, BarChart3, User } from "lucide-react";

const REDDIT_INSIGHTS_PATH = "/reddit-insights";
const ASK_AI_PATH = "/ask-ai";

const Header = () => {
  const navigate = (path: string) => {
    // SPA navigation: update URL and notify App.tsx (which listens to popstate)
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const currentPath = window.location.pathname;

  // Dynamic logo
  const renderLogo = () => {
    if (currentPath.startsWith(REDDIT_INSIGHTS_PATH)) {
      return (
        <>
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-lg font-semibold text-gray-800">
            Reddit Insights
          </span>
        </>
      );
    }
    if (currentPath.startsWith(ASK_AI_PATH)) {
      return (
        <>
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="text-lg font-semibold text-gray-800">Ask AI</span>
        </>
      );
    }
    return (
      <>
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">I</span>
        </div>
        <span className="text-lg font-semibold text-gray-800">Insights</span>
      </>
    );
  };

  // helper to style active nav item
  const navClasses = (path: string) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
    path === "/"
      ? currentPath === path
        ? "bg-gray-200 text-gray-900 font-semibold"
        : "text-gray-600 hover:bg-gray-100"
      : currentPath.startsWith(path)
      ? "bg-gray-200 text-gray-900 font-semibold"
      : "text-gray-600 hover:bg-gray-100"
  }`;


  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo (dynamic) */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            {renderLogo()}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            {/* Reddit Scraper */}
            <a
              href={REDDIT_INSIGHTS_PATH}
              onClick={(e) => {
                e.preventDefault();
                navigate(REDDIT_INSIGHTS_PATH);
              }}
              className={navClasses(REDDIT_INSIGHTS_PATH)}
              aria-label="Go to Reddit Insights"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Reddit Scraper</span>
            </a>

            {/* Ask AI */}
            <button
              onClick={() => navigate(ASK_AI_PATH)}
              className={navClasses(ASK_AI_PATH)}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Ask AI</span>
            </button>

            {/* Insights */}
            <button
              onClick={() => navigate("/")}
              className={navClasses("/")}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Insights</span>
            </button>

            {/* Profile */}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
