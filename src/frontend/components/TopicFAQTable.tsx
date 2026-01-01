import React from "react";
import type { QuestionItem } from "./ItemInterfaces";

interface TopicCount {
  topic: string;
  count: number;
}

interface Props {
  data: QuestionItem[];
}

export const TopicFAQTable: React.FC<Props> = ({ data }) => {
  // Count questions per topic
  const topicCounts: Record<string, number> = {};
  data.forEach((item) => {
    if (item.topic && item.topic.trim() !== "") {
      const topic = item.topic.trim();
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  });

  // Convert to array and sort by count descending
  const sortedTopics: TopicCount[] = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-4">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Frequently Asked Topics</h3>
      <p className="text-sm text-gray-600 mb-4">
        Topics sorted by how many questions were asked about them.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-left text-sm">
          <thead className="bg-gray-100 text-gray-700 font-bold">
            <tr>
              <th className="px-4 py-2 border-b">Topic</th>
              <th className="px-4 py-2 border-b">Questions Asked</th>
            </tr>
          </thead>
          <tbody>
            {sortedTopics.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">{item.topic}</td>
                <td className="px-4 py-2 border-b">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
