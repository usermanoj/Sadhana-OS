import { CATEGORY_ICON_OPTIONS, DynamicCategoryIcon } from '../today/CategoryIcon';

interface IconPickerProps {
  value: string;
  color: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ value, color, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Category icon">
      {CATEGORY_ICON_OPTIONS.map((iconName) => {
        const selected = value === iconName;

        return (
          <button
            key={iconName}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Icon ${iconName}`}
            onClick={() => onChange(iconName)}
            className={`flex h-11 w-11 items-center justify-center rounded-md border transition-all duration-150
                        ${selected ? 'border-accent-primary bg-accent-primary/10' : 'border-border bg-surface hover:bg-muted'}`}
          >
            <DynamicCategoryIcon iconName={iconName} color={color} size={20} />
          </button>
        );
      })}
    </div>
  );
}
