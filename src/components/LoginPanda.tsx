// src/components/LoginPanda.tsx

interface PandaProps {
  // 'isWatching' prop'u 'false' olduğunda (yani şifreye odaklanıldığında)
  // panda gözlerini kapatacak.
  isWatching: boolean;
}

export default function LoginPanda({ isWatching }: PandaProps) {
  return (
    <svg
      viewBox="0 0 130.8 113.6"
      className="w-48 h-auto mx-auto"
      // CSS geçişi (transition) ile animasyonu yumuşat
      style={{ transition: 'opacity 0.3s ease' }} 
    >
      {/* Kafa, kulaklar, burun (her zaman görünür) */}
      <path
        fill="#EBEBEB"
        d="M116.7 89.2c.2 1.3-1.1 11.2-1.1 11.2s-3.3 8-12.2 9.9c-8.8 1.9-20.9 2-29.8 2-8.8 0-21-1-29.8-2-8.8-1.9-12.2-9.9-12.2-9.9s-1.3-9.8-1.1-11.2c.2-1.7 1.6-3 3.3-2.9 1.7.2 2.9 1.6 2.9 3.3 0 .1 0 .3.1.4 0 0 .1.1.2.1 2.5 7.8 11.2 11.5 26.6 11.5s24-3.8 26.6-11.5c.1 0 .2-.1.2-.1.1-.1.1-.3.1-.4.1-1.7 1.3-3.1 2.9-3.3 1.7-.1 3.1 1.2 3.3 2.9z"
      />
      <path
        fill="#2A2A2A"
        d="M39.3 10.1C18.2 17.5 7.4 39.4 14.8 60.5c3.2 9.1 9.4 16.7 17.4 21.6 1.7 1 3.6.4 4.6-1.3s.4-3.6-1.3-4.6c-6.8-4.2-12-10.7-14.8-18.4-6.3-17.9 2.8-36.6 20.7-42.9 2.2-.8 3.5-3 2.7-5.2-.8-2.2-3-3.5-5.2-2.7zM91.4 10.1c21.1 7.4 31.9 29.3 24.5 50.4-3.2 9.1-9.4 16.7-17.4 21.6-1.7 1-3.6.4-4.6-1.3s.4-3.6-1.3-4.6c6.8-4.2 12-10.7 14.8-18.4 6.3-17.9-2.8-36.6-20.7-42.9-2.2-.8-3.5-3-2.7-5.2.8-2.2 3-3.5 5.2-2.7z"
      />
      <circle fill="#2A2A2A" cx="65.4" cy="74.5" r="12.2" />
      <circle fill="#FFF" cx="65.4" cy="71.7" r="4.3" />

      {/* GÖZLERİN MANTIĞI BURADA
        'isWatching' true ise (Gözler Açık) ilk grup görünür.
        'isWatching' false ise (Gözler Kapalı) ikinci grup görünür.
      */}

      {/* Gözler AÇIK (isWatching = true) */}
      <g style={{ opacity: isWatching ? 1 : 0 }}>
        <circle fill="#2A2A2A" cx="43.2" cy="51.2" r="14.3" />
        <circle fill="#FFF" cx="48.2" cy="50.4" r="5.2" />
        <circle fill="#2A2A2A" cx="87.5" cy="51.2" r="14.3" />
        <circle fill="#FFF" cx="82.5" cy="50.4" r="5.2" />
      </g>

      {/* Gözler KAPALI (isWatching = false) */}
      <g style={{ opacity: isWatching ? 0 : 1 }}>
        <path
          fill="#2A2A2A"
          d="M57.5 51.2c0 7.9-6.4 14.3-14.3 14.3s-14.3-6.4-14.3-14.3c0-1.2.2-2.4.5-3.6 1.3 1.9 3.2 3.4 5.5 4.4 2.3 1 4.8 1.5 7.4 1.5 2.6 0 5.1-.5 7.4-1.5 2.3-1 4.2-2.5 5.5-4.4.3 1.2.5 2.4.5 3.6zM101.8 51.2c0 7.9-6.4 14.3-14.3 14.3s-14.3-6.4-14.3-14.3c0-1.2.2-2.4.5-3.6 1.3 1.9 3.2 3.4 5.5 4.4 2.3 1 4.8 1.5 7.4 1.5 2.6 0 5.1-.5 7.4-1.5 2.3-1 4.2-2.5 5.5-4.4.3 1.2.5 2.4.5 3.6z"
        />
      </g>
    </svg>
  );
}