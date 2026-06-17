"use client";

import { useState } from "react";
import { Drill, CategoryData } from "../data/drills";
import VideoModal from "./VideoModal";

interface DrillCardProps {
  drill: Drill;
  category: CategoryData;
}

const levelColor: Record<string, string> = {
  初級: "bg-green-100 text-green-700",
  中級: "bg-yellow-100 text-yellow-700",
  上級: "bg-red-100 text-red-700",
};

export default function DrillCard({ drill, category }: DrillCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`rounded-xl border ${category.borderColor} ${category.bgColor} p-4 flex flex-col gap-3 hover:shadow-md transition-shadow`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-bold text-base ${category.color} leading-tight`}>
            {drill.title}
          </h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${levelColor[drill.level]}`}>
            {drill.level}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">{drill.description}</p>

        <ul className="space-y-1">
          {drill.points.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
              <span className="font-bold text-orange-400 mt-0.5">▶</span>
              {p}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">⏱ {drill.duration}</span>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            動画を見る
          </button>
        </div>
      </div>

      {open && <VideoModal drill={drill} onClose={() => setOpen(false)} />}
    </>
  );
}
