import React, { useRef, memo } from 'react';
import { useSpring, animated, to } from '@react-spring/web';
import SmartImage from '../SmartImage';
import { useI18n } from '../../contexts/I18nContext';

interface CoverCardProps {
  coverUrl?: string;
  isPlaying: boolean;
}

const CoverCard: React.FC<CoverCardProps> = memo(({ coverUrl, isPlaying }) => {
  const { t } = useI18n();
  const coverRef = useRef<HTMLDivElement>(null);

  // 3D Card Effect State (只保留旋转，移除光效)
  const [{ rotateX, rotateY }, cardApi] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    config: { tension: 300, friction: 40 },
  }));

  const [coverSpring, coverApi] = useSpring(() => ({
    scale: isPlaying ? 1.04 : 0.94,
    boxShadow: isPlaying
      ? '0 20px 35px rgba(0,0,0,0.55)'
      : '0 10px 20px rgba(0,0,0,0.45)',
    config: { tension: 300, friction: 28 },
  }));

  // Update scale when playing state changes
  React.useEffect(() => {
    coverApi.start({
      scale: isPlaying ? 1.04 : 0.94,
      boxShadow: isPlaying
        ? '0 20px 35px rgba(0,0,0,0.55)'
        : '0 10px 20px rgba(0,0,0,0.45)',
    });
  }, [isPlaying, coverApi]);

  // Bounce effect on cover change
  React.useEffect(() => {
    if (!coverUrl) return;
    coverApi.start({ scale: 0.96, config: { tension: 320, friction: 24 } });
    const timeout = window.setTimeout(() => {
      coverApi.start({
        scale: isPlaying ? 1.04 : 0.94,
        boxShadow: isPlaying
          ? '0 20px 35px rgba(0,0,0,0.55)'
          : '0 10px 20px rgba(0,0,0,0.45)',
        config: { tension: 260, friction: 32 },
      });
    }, 180);
    return () => clearTimeout(timeout);
  }, [coverUrl, isPlaying, coverApi]);

  // 3D Card Mouse Move Handler (只处理旋转)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!coverRef.current) return;

    const rect = coverRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;

    cardApi.start({
      rotateX: rotateXValue,
      rotateY: rotateYValue,
    });
  };

  const handleMouseLeave = () => {
    cardApi.start({
      rotateX: 0,
      rotateY: 0,
      config: { tension: 200, friction: 30 },
    });
  };

  return (
    <div
      ref={coverRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px' }}
      className="mb-6"
    >
      <animated.div
        style={{
          boxShadow: coverSpring.boxShadow,
          transform: to(
            [coverSpring.scale, rotateX, rotateY],
            (scale, rx, ry) =>
              `scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg)`
          ),
          transformStyle: 'preserve-3d',
        }}
        className="relative aspect-square w-80 md:w-96 lg:w-[420px] rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg shadow-black/30 ring-1 ring-white/10 overflow-hidden"
      >
        {coverUrl ? (
          <SmartImage
            src={coverUrl}
            alt="Album Art"
            containerClassName="absolute inset-0"
            imgClassName="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center theme-text-tertiary">
            <div className="text-8xl mb-4 opacity-50">♪</div>
            <p className="text-sm">{t('player.noMusicLoaded')}</p>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
      </animated.div>
    </div>
  );
});

CoverCard.displayName = 'CoverCard';

export default CoverCard;
