'use client';

type PageTitleProps = {
  value: string;
  dimmed?: boolean;
  onChange: (value: string) => void;
  onFocusChange?: (focused: boolean) => void;
};

export function PageTitle({ value, dimmed, onChange, onFocusChange }: PageTitleProps) {
  return (
    <div className={`page-title-wrap${dimmed ? ' is-dimmed' : ''}`}>
      <input
        type="text"
        className="page-title-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        placeholder="Untitled"
        aria-label="Page title"
      />
    </div>
  );
}
