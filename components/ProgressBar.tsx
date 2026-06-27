export default function ProgressBar({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  const label = `${String(step).padStart(2, "0")} DE ${String(total).padStart(
    2,
    "0"
  )}`;
  return (
    <div className="w-full">
      <div className="text-[13px] tracking-[0.14em] text-gold-500 font-bold text-center mb-3">
        {label}
      </div>
      <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
