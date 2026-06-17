'use client';

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export type EyeTrackingVariant = 'realistic' | 'cartoon' | 'minimal' | 'cyber';

export type EyeTrackingProps = {
  className?: string;
  eyeSize?: number;
  gap?: number;
  irisColor?: string;
  irisColorSecondary?: string;
  pupilColor?: string;
  scleraColor?: string;
  pupilRange?: number;
  showReflection?: boolean;
  showIrisDetail?: boolean;
  idleAnimation?: boolean;
  blinkInterval?: number;
  eyeCount?: number;
  variant?: EyeTrackingVariant;
  reactivePupil?: boolean;
  showEyelids?: boolean;
};

type EyeProps = {
  eyeSize: number;
  irisColor: string;
  irisColorSecondary: string;
  pupilColor: string;
  scleraColor: string;
  pupilRange: number;
  showReflection: boolean;
  showIrisDetail: boolean;
  blinkInterval: number;
  variant: EyeTrackingVariant;
  reactivePupil: boolean;
  showEyelids: boolean;
  mouseX: MutableRefObject<number>;
  mouseY: MutableRefObject<number>;
};

function Eye({
  eyeSize,
  irisColor,
  irisColorSecondary,
  pupilColor,
  scleraColor,
  pupilRange,
  showReflection,
  showIrisDetail,
  blinkInterval,
  variant,
  reactivePupil,
  showEyelids,
  mouseX,
  mouseY,
}: EyeProps) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [pupilScale, setPupilScale] = useState(1);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 25, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 300, damping: 25, mass: 0.5 });

  const irisSize = eyeSize * 0.45;
  const pupilSize = irisSize * 0.5;
  const maxOffset = (eyeSize / 2 - irisSize / 2) * pupilRange;

  useEffect(() => {
    if (blinkInterval <= 0) return;

    const blink = () => {
      setIsBlinking(true);
      window.setTimeout(() => setIsBlinking(false), 150);
    };

    const randomOffset = Math.random() * 200;
    const timeout = window.setTimeout(blink, randomOffset);
    const interval = window.setInterval(
      blink,
      blinkInterval + Math.random() * 1000
    );

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [blinkInterval]);

  useEffect(() => {
    let animFrame = 0;

    const update = () => {
      if (!eyeRef.current) {
        animFrame = window.requestAnimationFrame(update);
        return;
      }

      const rect = eyeRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;

      const dx = mouseX.current - eyeCenterX;
      const dy = mouseY.current - eyeCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const clampedDistance = Math.min(distance, maxOffset * 3);
      const normalizedDistance = clampedDistance / (maxOffset * 3);
      const offset = normalizedDistance * maxOffset;

      x.set(Math.cos(angle) * offset);
      y.set(Math.sin(angle) * offset);

      if (reactivePupil) {
        const proximityScale =
          distance < 200
            ? 1.3 - (distance / 200) * 0.3
            : 0.85 + (Math.min(distance, 800) / 800) * 0.15;
        setPupilScale(proximityScale);
      }

      animFrame = window.requestAnimationFrame(update);
    };

    animFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animFrame);
  }, [x, y, maxOffset, reactivePupil, mouseX, mouseY]);

  const irisRotation = useTransform(springX, [-maxOffset, maxOffset], [-15, 15]);

  const eyeAspect = variant === 'cartoon' ? 1 : 0.85;
  const borderRadius = '50%';

  const scleraGradient =
    variant === 'realistic'
      ? `radial-gradient(circle at 35% 35%, ${scleraColor} 0%, ${scleraColor}ee 60%, ${scleraColor}cc 100%)`
      : variant === 'cyber'
        ? 'radial-gradient(circle at 50% 50%, #0a0a1a 0%, #111128 100%)'
        : scleraColor;

  const eyeWidth = eyeSize;
  const eyeHeight = eyeSize * eyeAspect;

  return (
    <motion.div
      ref={eyeRef}
      className={cn(
        'relative overflow-hidden',
        variant === 'cyber' && 'border border-cyan-500/30'
      )}
      style={{
        width: eyeWidth,
        height: eyeHeight,
        borderRadius,
        background: scleraGradient,
        boxShadow:
          variant === 'realistic'
            ? 'inset 0 2px 8px rgba(0,0,0,0.15), inset 0 -1px 4px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.1)'
            : variant === 'cyber'
              ? 'inset 0 0 30px rgba(0,200,255,0.1), 0 0 20px rgba(0,200,255,0.15)'
              : variant === 'cartoon'
                ? 'inset 0 4px 12px rgba(0,0,0,0.1), 0 6px 24px rgba(0,0,0,0.15)'
                : '0 2px 10px rgba(0,0,0,0.1)',
      }}
      animate={{ scaleY: isBlinking ? 0.05 : 1 }}
      transition={{ scaleY: { duration: 0.1, ease: 'easeInOut' } }}
    >
      {variant === 'realistic' && (
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-[0.07]">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-red-500"
              style={{
                width: '1px',
                height: eyeSize * 0.4,
                left: `${20 + i * 12}%`,
                top: `${10 + (i % 3) * 15}%`,
                transform: `rotate(${-30 + i * 20}deg)`,
                opacity: 0.3 + (i % 4) * 0.1,
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        className="absolute"
        style={{
          width: irisSize,
          height: irisSize,
          borderRadius: '50%',
          left: eyeWidth / 2 - irisSize / 2,
          top: eyeHeight / 2 - irisSize / 2,
          x: springX,
          y: springY,
          background:
            variant === 'cyber'
              ? `conic-gradient(from 0deg, ${irisColor}, ${irisColorSecondary}, ${irisColor})`
              : `radial-gradient(circle at 40% 40%, ${irisColorSecondary}, ${irisColor} 60%, ${irisColor}dd 100%)`,
          boxShadow:
            variant === 'realistic'
              ? 'inset 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)'
              : variant === 'cyber'
                ? `0 0 15px ${irisColor}66, inset 0 0 10px ${irisColor}33`
                : 'inset 0 1px 4px rgba(0,0,0,0.2)',
        }}
      >
        {showIrisDetail && (
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{ rotate: irisRotation }}
          >
            {variant === 'cyber' ? (
              <>
                <div
                  className="absolute inset-[15%] rounded-full border border-dashed opacity-40"
                  style={{ borderColor: irisColor }}
                />
                <div
                  className="absolute inset-[30%] rounded-full border opacity-30"
                  style={{ borderColor: irisColorSecondary }}
                />
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 origin-left opacity-25"
                    style={{
                      width: irisSize * 0.45,
                      height: '1px',
                      background: irisColor,
                      transform: `rotate(${i * 45}deg)`,
                    }}
                  />
                ))}
              </>
            ) : (
              <>
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 origin-left"
                    style={{
                      width: irisSize * 0.45,
                      height: '1px',
                      background: `linear-gradient(to right, transparent 20%, ${irisColor}44 50%, transparent 80%)`,
                      transform: `rotate(${i * 15}deg)`,
                      opacity: 0.3 + (i % 3) * 0.15,
                    }}
                  />
                ))}
                <div
                  className="absolute inset-[20%] rounded-full"
                  style={{ border: `1px solid ${irisColor}33` }}
                />
              </>
            )}
          </motion.div>
        )}

        <motion.div
          className="absolute rounded-full"
          style={{
            width: pupilSize,
            height: pupilSize,
            left: irisSize / 2 - pupilSize / 2,
            top: irisSize / 2 - pupilSize / 2,
            background:
              variant === 'cyber'
                ? `radial-gradient(circle, ${pupilColor} 40%, transparent 100%)`
                : pupilColor,
            boxShadow: variant === 'cyber' ? `0 0 10px ${irisColor}88` : undefined,
          }}
          animate={{ scale: reactivePupil ? pupilScale : 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />

        {showReflection && (
          <>
            <div
              className="absolute rounded-full"
              style={{
                width: pupilSize * 0.35,
                height: pupilSize * 0.35,
                left: irisSize * 0.3,
                top: irisSize * 0.25,
                background:
                  variant === 'cyber'
                    ? 'radial-gradient(circle, rgba(0,255,255,0.9), transparent)'
                    : 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,255,255,0.6))',
                filter: 'blur(0.5px)',
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: pupilSize * 0.15,
                height: pupilSize * 0.15,
                left: irisSize * 0.58,
                top: irisSize * 0.6,
                background:
                  variant === 'cyber'
                    ? 'rgba(0,255,255,0.5)'
                    : 'rgba(255,255,255,0.7)',
              }}
            />
          </>
        )}
      </motion.div>

      {showEyelids && variant !== 'minimal' && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{
              height: eyeHeight * 0.35,
              background:
                variant === 'cyber'
                  ? 'linear-gradient(to bottom, rgba(0,10,30,0.6) 0%, transparent 100%)'
                  : 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 100%)',
              borderRadius: '50% 50% 0 0',
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: eyeHeight * 0.2,
              background:
                variant === 'cyber'
                  ? 'linear-gradient(to top, rgba(0,10,30,0.4) 0%, transparent 100%)'
                  : 'linear-gradient(to top, rgba(0,0,0,0.04) 0%, transparent 100%)',
              borderRadius: '0 0 50% 50%',
            }}
          />
        </>
      )}

      {variant === 'cyber' && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-[2px]"
          style={{
            background: `linear-gradient(to right, transparent, ${irisColor}44, transparent)`,
          }}
          animate={{ top: [0, eyeHeight, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}

export function EyeTracking({
  className,
  eyeSize = 120,
  gap = 40,
  irisColor = '#4A6741',
  irisColorSecondary = '#6B8F62',
  pupilColor = '#0a0a0a',
  scleraColor = '#F5F0EB',
  pupilRange = 0.7,
  showReflection = true,
  showIrisDetail = true,
  idleAnimation = true,
  blinkInterval = 4000,
  eyeCount = 2,
  variant = 'realistic',
  reactivePupil = true,
  showEyelids = true,
}: EyeTrackingProps) {
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const [isMounted, setIsMounted] = useState(false);

  const resolvedIrisColor =
    variant === 'cyber'
      ? irisColor === '#4A6741'
        ? '#00d4ff'
        : irisColor
      : irisColor;
  const resolvedIrisSecondary =
    variant === 'cyber'
      ? irisColorSecondary === '#6B8F62'
        ? '#0088ff'
        : irisColorSecondary
      : irisColorSecondary;
  const resolvedPupilColor =
    variant === 'cyber'
      ? pupilColor === '#0a0a0a'
        ? '#001122'
        : pupilColor
      : pupilColor;
  const resolvedScleraColor =
    variant === 'cyber'
      ? scleraColor === '#F5F0EB'
        ? '#0a0a1a'
        : scleraColor
      : scleraColor;

  useEffect(() => {
    mouseX.current = window.innerWidth / 2;
    mouseY.current = window.innerHeight / 2;
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseX.current = e.touches[0].clientX;
        mouseY.current = e.touches[0].clientY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    if (!idleAnimation) return;

    let idleInterval: number | undefined;
    const idleTimeout = window.setInterval(() => {
      const lastX = mouseX.current;
      const lastY = mouseY.current;

      if (mouseX.current === lastX && mouseY.current === lastY) {
        idleInterval = window.setInterval(() => {
          const currentX = mouseX.current;
          const currentY = mouseY.current;
          mouseX.current = currentX + (Math.random() - 0.5) * 30;
          mouseY.current = currentY + (Math.random() - 0.5) * 30;
          window.setTimeout(() => {
            mouseX.current = currentX;
            mouseY.current = currentY;
          }, 500);
        }, 2000);
      }
    }, 3000);

    return () => {
      window.clearInterval(idleTimeout);
      if (idleInterval) window.clearInterval(idleInterval);
    };
  }, [idleAnimation]);

  if (!isMounted) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ gap }}
      >
        {[...Array(eyeCount)].map((_, i) => (
          <div
            key={i}
            className="rounded-full bg-neutral-800"
            style={{ width: eyeSize, height: eyeSize * 0.85 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{ gap }}
    >
      {[...Array(eyeCount)].map((_, i) => (
        <Eye
          key={i}
          eyeSize={eyeSize}
          irisColor={resolvedIrisColor}
          irisColorSecondary={resolvedIrisSecondary}
          pupilColor={resolvedPupilColor}
          scleraColor={resolvedScleraColor}
          pupilRange={pupilRange}
          showReflection={showReflection}
          showIrisDetail={showIrisDetail}
          blinkInterval={blinkInterval}
          variant={variant}
          reactivePupil={reactivePupil}
          showEyelids={showEyelids}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      ))}
    </div>
  );
}

export default EyeTracking;
