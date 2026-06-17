'use client';

import { EyeTracking } from '@/components/ui/eye-tracking';
import { useAppStore } from '@/lib/app-store';
import { useEyeWidgetSettingsStore } from '@/lib/eye-widget-settings-store';
import { cn } from '@/lib/utils';

import './app-eye-tracking.css';

export default function AppEyeTracking() {
  const mode = useAppStore((state) => state.mode);
  const eyeSettings = useEyeWidgetSettingsStore();

  if (mode === 'area' || !eyeSettings.enabled) return null;

  return (
    <div className={cn('app-eye-tracking')} aria-hidden>
      <EyeTracking
        eyeSize={eyeSettings.eyeSize}
        gap={eyeSettings.gap}
        variant={eyeSettings.variant}
        irisColor={eyeSettings.irisColor}
        irisColorSecondary={eyeSettings.irisColorSecondary}
        pupilColor={eyeSettings.pupilColor}
        scleraColor={eyeSettings.scleraColor}
        pupilRange={eyeSettings.pupilRange}
        blinkInterval={eyeSettings.blinkInterval}
        showReflection={eyeSettings.showReflection}
        showIrisDetail={eyeSettings.showIrisDetail}
        reactivePupil={eyeSettings.reactivePupil}
        showEyelids={eyeSettings.showEyelids}
        idleAnimation={eyeSettings.idleAnimation}
      />
    </div>
  );
}
