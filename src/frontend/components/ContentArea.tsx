import React, { useState } from 'react';
import { FileText, TrendingUp, Lightbulb, MessageSquare, Target, Zap, HelpCircle, BarChart3, MessageCircle } from 'lucide-react';
import AskAIModal from './AskAIModal';

interface ContentAreaProps {
  activeTab: string;
}

const ContentArea: React.FC<ContentAreaProps> = ({ activeTab }) => {
  const [showChatModal, setShowChatModal] = useState(false);

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'Pain Points': return <Target className="w-6 h-6" />;
      case 'Failed Solutions': return <TrendingUp className="w-6 h-6" />;
      case 'Desired Outcome': return <Lightbulb className="w-6 h-6" />;
      case 'Metaphors': return <MessageSquare className="w-6 h-6" />;
      case 'Practitioner Reference': return <FileText className="w-6 h-6" />;
      case 'Triggers Causing Action': return <Zap className="w-6 h-6" />;
      case 'Questions': return <HelpCircle className="w-6 h-6" />;
      default: return <BarChart3 className="w-6 h-6" />;
    }
  };

  const getTabDescription = (tab: string) => {
    switch (tab) {
      case 'Pain Points':
        return 'Identify and analyze key challenges and frustrations users are experiencing';
      case 'Failed Solutions':
        return 'Review solutions that have been attempted but did not resolve the issues';
      case 'Desired Outcome':
        return 'Define the ideal results and goals that users want to achieve';
      case 'Metaphors':
        return 'Explore analogies and comparisons that help explain complex concepts';
      case 'Practitioner Reference':
        return 'Access expert insights and professional recommendations';
      case 'Triggers Causing Action':
        return 'Understand the catalysts that prompt users to take specific actions';
      case 'Questions':
        return 'View frequently asked questions and key inquiries from users';
      default:
        return 'Select an item from the menu above to view detailed content and insights';
    }
  };

  const getSampleContent = (tab: string) => {
    switch (tab) {
      case 'Pain Points':
        return [
          'Users struggle with complex navigation systems',
          'Long loading times cause frustration and abandonment',
          'Lack of clear onboarding leads to confusion',
          'Mobile experience is suboptimal for key features'
        ];
      case 'Failed Solutions':
        return [
          'Previous redesign focused too heavily on aesthetics',
          'Chatbot implementation created more confusion',
          'Email campaigns had low engagement rates',
          'Social media strategy lacked consistent messaging'
        ];
      case 'Metaphors':
        return [
          'Users describe the interface as "navigating a maze"',
          'The onboarding process feels like "drinking from a fire hose"',
          'Data visualization is like "finding a needle in a haystack"',
          'The workflow is compared to "swimming upstream"'
        ];
      default:
        return [];
    }
  };

  const sampleContent = getSampleContent(activeTab);

  const openChatModal = () => {
    setShowChatModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Main Content Section */}
      <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              {getTabIcon(activeTab)}
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              {activeTab || 'Content Area'}
            </h2>
          </div>
          <button
            onClick={openChatModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Ask AI
          </button>
        </div>
        
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          {getTabDescription(activeTab)}
        </p>

        {sampleContent.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Key Insights:</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {sampleContent.map((item, index) => (
                <div 
                  key={index}
                  className="bg-white/60 rounded-xl p-6 border border-purple-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700 leading-relaxed">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-gray-500 text-lg">
                No content available for this category yet.
              </p>
              <p className="text-gray-400 text-lg mt-2">
                Select a different tab to explore insights.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Data Section */}
      <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Data</h3>
          <button
            onClick={openChatModal}
            className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-lg font-semibold hover:bg-pink-200 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Got Questions? Ask our Chat Bot
          </button>
        </div>
        
        <div className="mb-4">
          <span className="text-sm text-gray-600">
            Showing 1-7 of 8 comments
          </span>
        </div>

        <div className="space-y-4">
          {/* Sample data items */}
          <div className="bg-white/60 rounded-xl p-6 border border-purple-100 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800">Sample User</span>
                <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  r/sample
                </span>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">↑ 45</span>
                <span className="text-sm text-gray-600">😢</span>
              </div>
            </div>
            <p className="text-gray-700 mb-3">This is sample content for the {activeTab} section. More detailed data would be displayed here in a real implementation.</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                Sample Category
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Intensity: 85%</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          <button className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors">
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">Page 1 of 1</span>
          <button className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors">
            Next
          </button>
        </div>
      </section>

      {/* Export Section */}
      <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Export Data</h3>
          <button
            onClick={openChatModal}
            className="flex items-center gap-2 px-6 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Got Questions? Ask our Chat Bot
          </button>
        </div>
        
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors">
            Export CSV
          </button>
          <button className="px-6 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors">
            Export JSON
          </button>
          <button className="px-6 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors">
            Export PDF
          </button>
        </div>
      </section>

      {/* Ask AI Modal */}
      <AskAIModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
    </div>
  );
};

export default ContentArea;