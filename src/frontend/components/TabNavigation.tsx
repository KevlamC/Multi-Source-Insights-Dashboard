import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    'Pain Points',
    'Failed Solutions', 
    'Desired Outcomes',
    'Metaphors',
    'Practitioner References',
    'Triggers Causing Action',
    'Questions'
  ];

  return (
    <div className="px-6 py-6 flex justify-center">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-full p-1.5 border border-gray-200 shadow-lg overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {tabs.map((tab, index) => (
              <React.Fragment key={tab}>
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
                {index < tabs.length - 1 && (
                  <div className="flex items-center">
                    <div className="w-px h-4 bg-gray-300"></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;