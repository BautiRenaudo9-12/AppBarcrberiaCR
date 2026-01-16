import moment from "moment";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export default function DateSelector({ selectedDate, onDateChange, minDate, maxDate }: DateSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium px-1">Selecciona una fecha</p>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        min={minDate}
        max={maxDate}
        className="w-full bg-card border border-white/10 rounded-2xl px-4 py-3 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
