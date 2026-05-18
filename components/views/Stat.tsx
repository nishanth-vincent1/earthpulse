export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
      <div className="text-white text-sm font-light mt-0.5">{value}</div>
    </div>
  );
}
