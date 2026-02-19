import React from 'react';
import { useSpring, animated } from '@react-spring/web';

interface StreamingStatusProps {
  isStreaming: boolean;
  progress: number; // 0-1
  error?: string;
  onRetry?: () => void;
}

const StreamingStatus: React.FC<StreamingStatusProps> = ({
  isStreaming,
  progress,
  error,
  onRetry,
}) => {
  const fadeIn = useSpring({
    opacity: isStreaming || error ? 1 : 0,
    transform: isStreaming || error ? 'translateY(0px)' : 'translateY(10px)',
    config: { tension: 300, friction: 20 },
  });

  const progressSpring = useSpring({
    width: `${progress * 100}%`,
    config: { tension: 200, friction: 25 },
  });

  if (!isStreaming && !error) return null;

  return (
    <animated.div
      style={fadeIn}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[280px] max-w-[400px]"
    >
      {error ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Streaming Error</span>
          </div>
          <p className="text-xs text-white/70 ml-7">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-7 mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-white/90">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading audio...</span>
            <span className="text-xs text-white/50 ml-auto">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <animated.div
              style={progressSpring}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            />
          </div>
        </div>
      )}
    </animated.div>
  );
};

export default StreamingStatus;
