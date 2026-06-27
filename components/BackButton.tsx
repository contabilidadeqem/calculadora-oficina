export default function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-center text-sm text-white/30 hover:text-white/55 transition-colors py-2"
    >
      ← Voltar
    </button>
  );
}
