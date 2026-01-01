import React, { useEffect } from "react";

interface TableEffectWrapperProps {
  chatWithAI: boolean;
  children: React.ReactNode;
}

const TableEffectWrapper: React.FC<TableEffectWrapperProps> = ({ chatWithAI, children }) => {
  useEffect(() => {
    if (!chatWithAI) return;

    if (!document.getElementById("rotating-glow-keyframes")) {
      const style = document.createElement("style");
      style.setAttribute("id", "rotating-glow-keyframes");
      style.textContent = `
        @keyframes rotatingGlow {
          0% { background: linear-gradient(0deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8)); }
          12.5% { background: linear-gradient(45deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8)); }
          25% { background: linear-gradient(90deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8)); }
          37.5% { background: linear-gradient(135deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8)); }
          50% { background: linear-gradient(180deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8)); }
          62.5% { background: linear-gradient(225deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8)); }
          75% { background: linear-gradient(270deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8)); }
          87.5% { background: linear-gradient(315deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8)); }
          100% { background: linear-gradient(360deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8)); }
        }
      `;
      document.head.appendChild(style);
    }
  }, [chatWithAI]);

  return (
    <div className="relative w-full">
      {/* Glow border */}
      {chatWithAI && (
        <div
          className="absolute -inset-1 rounded-xl pointer-events-none"
          style={{
            padding: "2px",
            background: "linear-gradient(0deg, rgba(139,92,246,0.8), rgba(219,39,119,0.8), rgba(251,146,60,0.8))",
            maskImage: "linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskImage: "linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            animation: "rotatingGlow 10s linear infinite", // slower for smoothness
            zIndex: 0,
          }}
        />
      )}

      {/* Table content */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow relative z-10 bg-white">
        {children}
      </div>
    </div>
  );
};

export default TableEffectWrapper;
