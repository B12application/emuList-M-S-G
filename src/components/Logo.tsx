// Sade Modern B12 Kapsül Logosu
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Kapsül dış çizgisi */}
      <path
        d="M12 4C8.686 4 6 6.686 6 10v4c0 3.314 2.686 6 6 6c3.314 0 6-2.686 6-6v-4c0-3.314-2.686-6-6-6z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Ortadaki çizgi */}
      <line
        x1="6.5"
        y1="12"
        x2="17.5"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}