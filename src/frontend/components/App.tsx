// App.tsx
import { useEffect, useState } from "react";
import Header from "./Header";
import RedditScraper from "./RedditScraper";
import AskAIChatManager from "./AskAIChatManager"

import TabNavigation from "./TabNavigation";
import Triggers from "./Triggers";
import DesiresWishes from "./DesiresWishes";
import RedditQuestions from "./RedditQuestions";
import Practitioner from "./Practitioner";
import Painpoints from "./Painpoints";
import Metaphors from "./Metaphors";
import FailedSolutions from "./FailedSolutions";

function App() {
  // Track which tab is selected for the main Insights page
  const [activeTab, setActiveTab] = useState("Pain Points");

  // Lightweight path-based switch (no react-router needed)
  const [route, setRoute] = useState<string>(window.location.pathname);

  useEffect(() => {
    // Update on back/forward
    const onPopState = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // If Header's "Reddit Scraper" navigates to /reddit-insights,
  // render the RedditInsights page instead of the tabbed dashboard.
  if (route === "/reddit-insights") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
        <Header />
        <main>
          <RedditScraper />
        </main>
      </div>
    );
  }

    // If Header's "Reddit Scraper" navigates to /reddit-insights,
  // render the RedditInsights page instead of the tabbed dashboard.
  if (route === "/ask-ai") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
        <Header />
        <main>
          <AskAIChatManager />
        </main>
      </div>
    );
  }

  // Regular tabbed dashboard
  const renderContent = () => {
    switch (activeTab) {
      case "Pain Points":
        return <Painpoints />;
      case "Failed Solutions":
        return <FailedSolutions />;
      case "Desired Outcomes":
        return <DesiresWishes />;
      case "Metaphors":
        return <Metaphors />;
      case "Practitioner References":
        return <Practitioner />;
      case "Triggers Causing Action":
        return <Triggers />;
      case "Questions":
        return <RedditQuestions />;
      default:
        return <Painpoints />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <Header />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>{renderContent()}</main>
    </div>
  );
}

export default App;
