import { memo } from "react";
import { ResponsiveSunburst } from "@nivo/sunburst";
import { emotionColor } from "./Emotion";

// Soila - Debugging session
interface CommonData {
  subreddit: string;
  emotion: string;
  upvotes: number;
}

interface Props {
  data: CommonData[];
  pageId?: string; // optional page identifier
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const color = `hsl(${hash % 360}, 65%, 55%)`;
  return color === "#000000" ? "#333333" : color;
}

interface SunburstChartProps<T> {
  tree: any;
  data: T[];
  idKey?: string; // optional, defaults to "id" for unique ids
}

const SunburstChart = memo(<T extends CommonData>({ tree, data, idKey = "id" }: SunburstChartProps<T>) => {
  const aggregated = new Map<string, { subreddit: string; emotion: string; upvotes: number }>();
  data.forEach((item) => {
    const key = `${item.subreddit}__${item.emotion}`;
    if (!aggregated.has(key)) {
      aggregated.set(key, { ...item });
    } else {
      // console.log("[Duplicate Key] Updating existing key:", key, "Previous upvotes:", aggregated.get(key)!.upvotes, "Adding:", item.upvotes);
      aggregated.get(key)!.upvotes += item.upvotes;
    }
  });
  const dedupedData = Array.from(aggregated.values());
  // console.log("[SunburstChart] Deduped Data:", dedupedData);

  const getNodeColor = (node: any) => {
    if (node.depth === 2) return emotionColor[node.data.name] || stringToColor(node.data.name);
    if (node.depth === 1) return stringToColor(node.data.name);
    return "#ffffff";
  };

  const totalUpvotes = dedupedData.reduce((sum, d) => sum + d.upvotes, 0);

  return (
    <ResponsiveSunburst
      data={tree}
      id={idKey} // <-- use idKey for unique node ids
      value="value"
      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      cornerRadius={2}
      borderWidth={1}
      borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
      colors={getNodeColor}
      inheritColorFromParent={false}
      animate
      motionConfig="gentle"
      isInteractive
      tooltip={(node: any) => {
        const percent = ((node.value / totalUpvotes) * 100).toFixed(1);
        const type = node.depth === 1 ? "Subreddit" : node.depth === 2 ? "Emotion" : "Root";
        const parent = node.parent && node.depth === 2 ? ` (in ${node.parent.data.name})` : "";

        return (
          <div style={{ padding: "6px 10px", background: node.color, color: "#fff", borderRadius: 4, fontSize: 12, fontWeight: 500, pointerEvents: "none" }}>
            <div><strong>{type}</strong>: {node.id}{parent}</div>
            <div>Upvotes: {node.value}</div>
            <div>Percentage: {percent}%</div>
          </div>
        );
      }}
    />
  );
});


export default function EmotionSunburst({ data, pageId = "page" }: Props) {
  const aggregated = new Map<string, { subreddit: string; emotion: string; upvotes: number }>();
  data.forEach((item) => {
    const key = `${item.subreddit}__${item.emotion}`;
    if (!aggregated.has(key)) {
      aggregated.set(key, { ...item });
    } else {
      // console.log("[Duplicate Key] Updating existing key:", key, "Previous upvotes:", aggregated.get(key)!.upvotes, "Adding:", item.upvotes);
      aggregated.get(key)!.upvotes += item.upvotes;
    }
  });

  const dedupedData = Array.from(aggregated.values());
  // console.log("[EmotionSunburst] Deduped Data:", dedupedData);

  const grouped: Record<string, Record<string, number>> = {};
  dedupedData.forEach((item) => {
    if (!grouped[item.subreddit]) grouped[item.subreddit] = {};
    grouped[item.subreddit][item.emotion] =
      (grouped[item.subreddit][item.emotion] || 0) + item.upvotes;
  });

  const tree = {
    name: "root",
    children: Object.entries(grouped).map(([subreddit, emotions]) => {
      const used = new Map<string, number>();
      return {
        name: subreddit,
        children: Object.entries(emotions).map(([emotion, totalUpvotes], i) => {
          const count = used.get(emotion) || 0;
          used.set(emotion, count + 1);
          return {
            id: `${subreddit}-${emotion}-${count}`, // unique id for Nivo / React
            name: emotion,                          // display name
            value: totalUpvotes,
          };
        }),
      };
    }),
  };

  const subredditNames = Object.keys(grouped);
  const totalSum = dedupedData.reduce((sum, item) => sum + item.upvotes, 0);

  // console.log("[EmotionSunburst] Keys used in legend:");
  dedupedData.forEach((item, index) => {
    const key = `sunburst-emotion-${pageId}-${item.subreddit}-${item.emotion}-${index}`;
    // console.log("Legend key:", key, "Subreddit:", item.subreddit, "Emotion:", item.emotion);
  });

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", gap: 80 }}>
      <div style={{ width: 400, height: 400 }}>
        <SunburstChart tree={tree} data={dedupedData} idKey="id" /> {/* <-- pass idKey */}
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxHeight: 500, minWidth: 400, gap: 16 }}>
        <h4 style={{ marginBottom: 8 }}>Emotions</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {dedupedData.map((item, index) => {
            const widthPercent = (item.upvotes / totalSum) * 100;
            const color = emotionColor[item.emotion] || stringToColor(item.emotion);
            const key = `sunburst-emotion-${pageId}-${item.subreddit}-${item.emotion}-${index}`;
            // console.log("[Legend] Rendering emotion bar key:", key, "Width:", widthPercent.toFixed(1), "%");

            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 80, fontSize: 12 }}>{item.emotion}</span>
                <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 4, height: 16, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${widthPercent}%`, backgroundColor: color, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, minWidth: 40 }}>{widthPercent.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>

        <h4 style={{ marginTop: 16, marginBottom: 8 }}>Subreddits</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {subredditNames.map((sub, index) => {
            const total = dedupedData.filter((item) => item.subreddit === sub).reduce((sum, item) => sum + item.upvotes, 0);
            const widthPercent = (total / totalSum) * 100;
            const key = `sunburst-subreddit-${pageId}-${sub}-${index}`;
            // console.log("[Legend] Rendering subreddit bar key:", key, "Width:", widthPercent.toFixed(1), "%");

            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 80, fontSize: 12 }}>{sub}</span>
                <div style={{ flex: 1, background: "#e5e7eb", borderRadius: 4, height: 16, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${widthPercent}%`, backgroundColor: stringToColor(sub), borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, minWidth: 40 }}>{widthPercent.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
