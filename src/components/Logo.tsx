
// B12 Kapsül Logosu
export default function Logo({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Kapsülün Sol Yarısı */}
      <path 
        d="M10.5 5.5L5.5 10.5C3.5 12.5 3.5 15.5 5.5 17.5L6.5 18.5C8.5 20.5 11.5 20.5 13.5 18.5L18.5 13.5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Kapsülün Sağ Yarısı (Çizgili/Dolulu hissi için) */}
      <path 
        d="M13.5 18.5L18.5 13.5C20.5 11.5 20.5 8.5 18.5 6.5L17.5 5.5C15.5 3.5 12.5 3.5 10.5 5.5L5.5 10.5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Ortadaki Ayrım Çizgisi */}
      <path 
        d="M8 13L11 16" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Parıltı Efekti */}
      <path 
        d="M14 7L16 9" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}