import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

type NumberStepperProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Prefix positive values (and zero) with a "+" — used by the marking scheme. */
  showSign?: boolean;
};

/**
 * Compact numeric field with the value on the left and stacked up/down
 * chevrons on the right, matching the Figma marking-scheme steppers.
 */
export function NumberStepper({
  value,
  onChange,
  min = -999,
  max = 999,
  step = 1,
  showSign = false,
}: NumberStepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const display = showSign && value >= 0 ? `+${value}` : String(value);

  return (
    <div className="stepper">
      <input
        className="stepper-value"
        type="text"
        inputMode="numeric"
        value={display}
        onChange={e => {
          const n = Number(e.target.value.replace('+', ''));
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        aria-label="value"
      />
      <div className="stepper-arrows">
        <button type="button" aria-label="Increase" onClick={() => onChange(clamp(value + step))}>
          <ChevronUp size={11} />
        </button>
        <button type="button" aria-label="Decrease" onClick={() => onChange(clamp(value - step))}>
          <ChevronDown size={11} />
        </button>
      </div>
    </div>
  );
}

export default NumberStepper;
