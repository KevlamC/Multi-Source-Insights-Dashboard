import React from "react";

interface TriggerClusterProps {
  triggers: {
    phrase: string;
    mentions: number;
  }[];
  totalMentions: number;
}

export const TriggerCluster: React.FC<TriggerClusterProps> = ({ triggers, totalMentions }) => {
  const triggerCount = triggers.length;

  return (
    <div className="w-full  flex flex-col p-4 flex flex-col">
      {/* Summary */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold">Trigger Cluster</h3>
        <p className="text-gray-600">
        Summary: <span className="font-semibold">{triggerCount}</span> triggers,
        based on <span className="font-semibold">{totalMentions}</span> mentions
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-purple-100 text-grey-700 text-sm">
              <th className="py-2 px-4 text-left">Trigger Phrase</th>
              <th className="py-2 px-4 text-right">Shared %</th>
              <th className="py-2 px-4 text-right">Mentions</th>
            </tr>
          </thead>
          <tbody>
            {triggers.map((trigger, idx) => {
              const percentage = ((trigger.mentions / totalMentions) * 100).toFixed(1);
              return (
                <tr
                  key={idx}
                  className={`border-b hover:bg-purple-50 transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-purple-50"
                  }`}
                >
                  <td className="py-2 px-4">{trigger.phrase}</td>
                  <td className="py-2 px-4 text-right">{percentage}%</td>
                  <td className="py-2 px-4 text-right">{trigger.mentions}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TriggerCluster;
