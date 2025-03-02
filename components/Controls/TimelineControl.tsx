"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface TimelineControlProps {
  startTime: Date;
  endTime: Date;
  currentTime: Date;
  onTimeChange: (time: Date) => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
}

export default function TimelineControl({
  startTime,
  endTime,
  currentTime,
  onTimeChange,
  playbackSpeed,
  onPlaybackSpeedChange,
}: TimelineControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Calculate total duration in milliseconds
  const totalDuration = endTime.getTime() - startTime.getTime();

  // Update progress when currentTime changes
  useEffect(() => {
    const elapsed = currentTime.getTime() - startTime.getTime();
    const newProgress = (elapsed / totalDuration) * 100;
    setProgress(newProgress);
  }, [currentTime, startTime, totalDuration]);

  // Handle playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const newTime = new Date(currentTime.getTime() + 60000 * playbackSpeed); // Advance by minutes * speed

      if (newTime > endTime) {
        setIsPlaying(false);
        onTimeChange(endTime);
      } else {
        onTimeChange(newTime);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, endTime, playbackSpeed, onTimeChange]);

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);

    const newTimeMs = startTime.getTime() + totalDuration * (newProgress / 100);
    onTimeChange(new Date(newTimeMs));
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-lg text-black">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{formatTime(startTime)}</span>
        <span className="text-sm font-medium">{formatTime(currentTime)}</span>
        <span className="text-sm font-medium">{formatTime(endTime)}</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onTimeChange(startTime)}
          className="p-1 rounded hover:bg-gray-200"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1 rounded hover:bg-gray-200"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={handleSliderChange}
          className="flex-grow h-2 rounded-lg appearance-none bg-gray-300"
        />

        <button
          onClick={() => onTimeChange(endTime)}
          className="p-1 rounded hover:bg-gray-200"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <div className="mt-2 flex items-center">
        <span className="text-xs mr-2">Speed:</span>
        <select
          value={playbackSpeed}
          onChange={(e) => onPlaybackSpeedChange(Number(e.target.value))}
          className="text-xs p-1 border rounded"
        >
          <option value="1">1x</option>
          <option value="2">2x</option>
          <option value="5">5x</option>
          <option value="10">10x</option>
        </select>
      </div>
    </div>
  );
}
