// TiggerWaffle.tsx
import React, { useState, useMemo } from "react";
import type { TriggersItem } from "./ItemInterfaces";

// Utility to generate random hex color
const getRandomColor = () =>
  "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");

interface TiggerWaffleProps {
  items: TriggersItem[];
  gridSize?: number;
  totalSquares?: number;
}

export const TiggerWaffle: React.FC<TiggerWaffleProps> = ({
  items,
  gridSize = 10,
  totalSquares = 100,
}) => {
  const [selectedItem, setSelectedItem] = useState<TriggersItem | null>(null);
  const [groupBy, setGroupBy] = useState<keyof TriggersItem>("triggerPhrase");

  // Count items grouped by selected field
  const groupCounts = useMemo(() => {
    const counts: Record<string, TriggersItem[]> = {};
    items.forEach((item) => {
      const key = item[groupBy] as string;
      if (!counts[key]) counts[key] = [];
      counts[key].push(item);
    });
    return counts;
  }, [items, groupBy]);

  // Assign consistent colors per group
  const groupColors = useMemo(() => {
    const colors: Record<string, string> = {};
    Object.keys(groupCounts).forEach((key) => {
      colors[key] = getRandomColor();
    });
    return colors;
  }, [groupCounts]);

  // Prepare squares for waffle chart
  const squares = useMemo(() => {
    const result: { color: string; item: TriggersItem | null }[] = [];
    const groups = Object.entries(groupCounts);
    if (groups.length === 0) return Array(totalSquares).fill({ color: "#ddd", item: null });

    let squaresUsed = 0;
    groups.forEach(([key, groupItems], i) => {
      const fraction = groupItems.length / items.length;
      let squaresForGroup = Math.floor(fraction * totalSquares);
      if (i === groups.length - 1) squaresForGroup = totalSquares - squaresUsed;

      const color = groupColors[key];
      for (let j = 0; j < squaresForGroup; j++) {
        const item = groupItems[j % groupItems.length];
        result.push({ color, item });
      }
      squaresUsed += squaresForGroup;
    });

    return result;
  }, [groupCounts, totalSquares, items.length, groupColors]);

  const groupOptions: { key: keyof TriggersItem; label: string }[] = [
    { key: "triggerPhrase", label: "Trigger Phrase" },
    { key: "subreddit", label: "Subreddit" },
    { key: "topic", label: "Topic" },
    { key: "emotion", label: "Emotion" },
  ];

  return (
    <>
      {/* Group buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {groupOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setGroupBy(opt.key)}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              groupBy === opt.key
                ? "bg-purple-500 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-purple-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Waffle grid + percentages */}
      <div className="flex flex-col items-center justify-center mt-6">
        {/* Waffle grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${Math.ceil(totalSquares / gridSize)}, 1fr)`,
            gap: "4px",
            width: "320px",
            height: "320px", // force square
          }}
        >

          {squares.map((sq, index) => (
            <div
              key={`${groupBy}-${sq.item?.triggerPhrase}-${index}`} // stable per group
              className="rounded-md cursor-pointer opacity-0 animate-fadeIn hover:scale-110"
              style={{
                aspectRatio: "1 / 1",
                backgroundColor: sq.color,
                animationDelay: `${index * 20}ms`,
                animationFillMode: "forwards",
              }}
              title={sq.item ? `${sq.item[groupBy]}` : ""}
              onClick={() => sq.item && setSelectedItem(sq.item)}
            />
          ))}
        </div>

        {/* Labels below the waffle */}
        <div className="mt-6 w-full max-w-sm p-4">
          <h3 className="font-bold mb-3 text-center">Group Percentages</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(groupCounts).map(([key, groupItems]) => {
              const color =
                squares.find((sq) => sq.item && sq.item[groupBy] === key)?.color || "#ddd";
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }}></div>
                  <span className="text-gray-700">
                    {key}: {((groupItems.length / items.length) * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setSelectedItem(null)}
            >
              ✕
            </button>
            <h2 className="font-bold text-lg mb-2">{selectedItem.triggerPhrase}</h2>
            <p className="mb-2 text-gray-700">{selectedItem.comment}</p>
            <p className="text-sm text-gray-500">
              Author: {selectedItem.author} | Subreddit: {selectedItem.subreddit} | Upvotes:{" "}
              {selectedItem.upvotes}
            </p>
            <p className="text-sm text-gray-500">
              Emotion: {selectedItem.emotion} | Intensity: {selectedItem.intensity}
            </p>
            <p className="text-sm text-gray-500">Topic: {selectedItem.topic}</p>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation-name: fadeIn;
            animation-duration: 0.5s;
            animation-timing-function: ease-out;
          }
        `}
      </style>
    </>
  );
};
