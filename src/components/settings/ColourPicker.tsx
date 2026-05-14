export const CATEGORY_COLOURS = [
  '#7C3AED',
  '#9333EA',
  '#4F46E5',
  '#2563EB',
  '#0F766E',
  '#16A34A',
  '#D97706',
  '#C2410C',
  '#DB2777',
  '#BE123C',
  '#475569',
  '#111827',
] as const;

interface ColourPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ColourPicker({ value, onChange }: ColourPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Category colour">
      {CATEGORY_COLOURS.map((colour) => {
        const selected = value === colour;

        return (
          <button
            key={colour}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Colour ${colour}`}
            onClick={() => onChange(colour)}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-150
                        ${selected ? 'border-text-primary shadow-md' : 'border-border hover:border-text-secondary'}`}
          >
            <span
              className="h-8 w-8 rounded-full"
              style={{ backgroundColor: colour }}
            />
          </button>
        );
      })}
    </div>
  );
}
