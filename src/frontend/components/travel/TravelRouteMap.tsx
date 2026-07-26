import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TravelStop } from '../../../backend/types/travelPlanner';

interface TravelRouteMapProps {
  stops: TravelStop[];
  cityLat: number;
  cityLon: number;
  width?: number;
  height?: number;
  showAnimation?: boolean;
}

/**
 * SVG-based route map that draws dotted flight-path lines between stops
 * with animated progression. No external map library needed.
 */
export default function TravelRouteMap({
  stops,
  cityLat,
  cityLon,
  width = 500,
  height = 400,
  showAnimation = true,
}: TravelRouteMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  if (stops.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400 dark:text-zinc-500 text-sm">
        <div className="text-center">
          <span className="text-4xl mb-2 block">🗺️</span>
          <p>Rota oluşturmak için durak ekleyin</p>
        </div>
      </div>
    );
  }

  // Calculate bounds to fit all stops
  const allLats = stops.map(s => s.lat);
  const allLons = stops.map(s => s.lon);
  const minLat = Math.min(...allLats) - 0.02;
  const maxLat = Math.max(...allLats) + 0.02;
  const minLon = Math.min(...allLons) - 0.02;
  const maxLon = Math.max(...allLons) + 0.02;

  const latRange = maxLat - minLat || 0.1;
  const lonRange = maxLon - minLon || 0.1;

  const padding = 60;

  // Convert geo coordinates to SVG coordinates
  const geoToSvg = (lat: number, lon: number) => ({
    x: padding + ((lon - minLon) / lonRange) * (width - padding * 2),
    y: padding + ((maxLat - lat) / latRange) * (height - padding * 2),
  });

  const points = stops.map(s => geoToSvg(s.lat, s.lon));

  // Build SVG path string for the route
  let pathD = '';
  if (points.length > 1) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Curved line for airplane effect
      const midX = (prev.x + curr.x) / 2;
      const midY = Math.min(prev.y, curr.y) - 30; // curve upward
      pathD += ` Q ${midX} ${midY} ${curr.x} ${curr.y}`;
    }
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-stone-50 to-stone-100 dark:from-zinc-800/50 dark:to-zinc-900/50 rounded-2xl overflow-hidden border border-stone-200 dark:border-zinc-700">
      {/* Grid pattern background */}
      <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-stone-400 dark:text-zinc-400" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="relative w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arrow marker for route direction */}
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="6"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#0ea5e9" />
          </marker>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Route path - background */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="2"
            className="dark:stroke-zinc-700"
          />
        )}

        {/* Route path - animated dashed line */}
        {pathD && (
          <motion.path
            d={pathD}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2.5"
            strokeDasharray="8 4"
            strokeLinecap="round"
            markerEnd="url(#arrowhead)"
            filter="url(#glow)"
            initial={showAnimation ? { pathLength: 0, opacity: 0 } : {}}
            animate={showAnimation ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 2, ease: 'easeInOut', delay: 0.5 }}
          />
        )}

        {/* Animated dot traveling along path */}
        {pathD && showAnimation && (
          <motion.circle
            r="4"
            fill="#f59e0b"
            filter="url(#glow)"
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: 2.5 }}
            style={{ offsetPath: `path('${pathD}')` } as any}
          />
        )}

        {/* Connection lines between stops (arrows) */}
        {points.length > 1 && points.slice(0, -1).map((point, i) => {
          const next = points[i + 1];
          const midX = (point.x + next.x) / 2;
          const midY = (point.y + next.y) / 2;
          const angle = Math.atan2(next.y - point.y, next.x - point.x) * (180 / Math.PI);

          return (
            <motion.g key={`arrow-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.3 }}
            >
              {/* Small airplane icon at midpoint */}
              <text
                x={midX}
                y={midY - 12}
                textAnchor="middle"
                style={{ fontSize: '14px' }}
                transform={`rotate(${angle}, ${midX}, ${midY - 12})`}
              >
                ✈️
              </text>
            </motion.g>
          );
        })}

        {/* Stop pins */}
        {points.map((point, i) => {
          const stop = stops[i];
          const isVisited = stop.visited;

          return (
            <motion.g
              key={`stop-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: i * 0.15 }}
              style={{ transformOrigin: `${point.x}px ${point.y}px` }}
            >
              {/* Pin shadow */}
              <ellipse
                cx={point.x}
                cy={point.y + 18}
                rx={8}
                ry={3}
                fill="rgba(0,0,0,0.15)"
              />

              {/* Pin body */}
              <circle
                cx={point.x}
                cy={point.y}
                r={14}
                fill={isVisited ? '#10b981' : '#0ea5e9'}
                stroke="white"
                strokeWidth="3"
                filter="url(#glow)"
              />

              {/* Order number */}
              <text
                x={point.x}
                y={point.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontWeight="bold"
                fontSize="11"
                fontFamily="sans-serif"
              >
                {i + 1}
              </text>

              {/* Pin tail */}
              <polygon
                points={`${point.x - 5},${point.y + 12} ${point.x},${point.y + 22} ${point.x + 5},${point.y + 12}`}
                fill={isVisited ? '#10b981' : '#0ea5e9'}
              />

              {/* Stop name label */}
              <rect
                x={point.x - 40}
                y={point.y - 32}
                width={80}
                height={18}
                rx={9}
                fill="rgba(0,0,0,0.75)"
              />
              <text
                x={point.x}
                y={point.y - 22}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="8"
                fontFamily="sans-serif"
                fontWeight="500"
              >
                {stop.name.length > 14 ? stop.name.slice(0, 14) + '…' : stop.name}
              </text>

              {/* Visited checkmark */}
              {isVisited && (
                <g>
                  <circle cx={point.x + 10} cy={point.y - 10} r={6} fill="white" />
                  <circle cx={point.x + 10} cy={point.y - 10} r={5} fill="#10b981" />
                  <text x={point.x + 10} y={point.y - 9} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="7" fontWeight="bold">✓</text>
                </g>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[10px] text-stone-500 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-sky-500" />
          <span>Planlanan</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Gezildi</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-sky-400" />
          <span>Rota</span>
        </div>
      </div>
    </div>
  );
}
