
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { turkeyMapData } from './mapData';

interface TurkeyMapProps {
    visitedProvinces: string[];
    onProvinceClick: (id: string, name: string) => void;
    visitedColor?: string; // Optional override
    defaultColor?: string; // Optional override
}

const TurkeyMap: React.FC<TurkeyMapProps> = ({
    visitedProvinces,
    onProvinceClick,
    visitedColor: customVisited,
    defaultColor: customDefault,
}) => {
    const { isDark } = useTheme();
    const [hoveredProvince, setHoveredProvince] = React.useState<string | null>(null);

    // Define colors based on theme, with optional overrides
    const strokeColor = "#ffffff";
    const visitedColor = customVisited || "#ef4444"; // red-500
    const defaultColor = customDefault || (isDark ? "#374151" : "#d1d5db"); // gray-700 : gray-300
    const hoverColor = isDark ? "#4b5563" : "#9ca3af"; // gray-600 : gray-400

    // Text color logic: white on visited, contrasting on default
    const getTextColor = (isVisited: boolean) => {
        if (isVisited) return "#ffffff";
        return isDark ? "#e5e7eb" : "#1f2937"; // gray-200 : gray-800
    };

    return (
        <svg
            baseProfile="tiny"
            fill={defaultColor}
            stroke={strokeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth=".5"
            version="1.2"
            viewBox="0 0 1000 422" // Original ViewBox from svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            <g id="features">
                {turkeyMapData.map((province) => {
                    const isVisited = visitedProvinces.includes(province.id);
                    const isHovered = hoveredProvince === province.id;
                    const fill = isVisited ? visitedColor : (isHovered ? hoverColor : defaultColor);

                    return (
                        <path
                            key={province.id}
                            d={province.d}
                            id={province.id}
                            name={province.name}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent container click issues
                                onProvinceClick(province.id, province.name);
                            }}
                            style={{
                                cursor: 'pointer',
                                transition: 'fill 0.2s ease',
                                fill: fill
                            }}
                            className="outline-none"
                            onMouseEnter={() => setHoveredProvince(province.id)}
                            onMouseLeave={() => setHoveredProvince(null)}
                        />
                    );
                })}
                {/* Render Labels in a separate pass to ensure they are on top */}
                <g id="labels" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {turkeyMapData.map((province) => {
                        const isVisited = visitedProvinces.includes(province.id);
                        return (
                            <text
                                key={`label-${province.id}`}
                                x={province.centroid.x}
                                y={province.centroid.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    fill: getTextColor(isVisited),
                                    textShadow: isVisited
                                        ? '0px 1px 2px rgba(0,0,0,0.8)'
                                        : '0px 1px 2px rgba(0,0,0,0.8)', // Stronger shadow for better readability
                                    pointerEvents: 'none',
                                    fontFamily: 'sans-serif'
                                }}
                            >
                                {province.name}
                            </text>
                        )
                    })}
                </g>
            </g>
        </svg>
    );
};

export default TurkeyMap;
