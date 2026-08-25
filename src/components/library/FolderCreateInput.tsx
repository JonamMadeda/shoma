'use client';

interface FolderCreateInputProps {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export function FolderCreateInput({ value, onChange, onCreate, onCancel }: FolderCreateInputProps) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) onCreate();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="New folder name..."
        aria-label="New folder name"
        className="flex-1 border-b border-border bg-transparent py-2 text-sm text-foreground placeholder-muted-faint transition-colors focus:border-muted focus:outline-none max-w-xs"
        autoFocus
      />
      <button
        onClick={onCreate}
        disabled={!value.trim()}
        className="text-xs font-medium text-muted-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed rounded px-1"
      >
        Create
      </button>
      <button
        onClick={onCancel}
        className="text-xs text-muted-faint hover:text-muted-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded px-1"
      >
        Cancel
      </button>
    </div>
  );
}
