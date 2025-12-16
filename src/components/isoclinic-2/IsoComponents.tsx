import React from 'react';
import { Point } from '../../types/isoclinic';

interface IsoFloorProps {
  points: {x:number,y:number}[];
  color: string;
  opacity?: number;
  thickness?: number;
}

export const IsoFloor: React.FC<IsoFloorProps> = ({ points, color, opacity = 1, thickness = 0 }) => {
  const p1 = points[0];
  const p2 = points[1];
  const p3 = points[2];
  const p4 = points[3];

  const mainPath = `M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y} Z`;

  let slabSides = null;
  if (thickness > 0) {
    const slabColor = "#94a3b8";
    const rightFace = `M${p2.x},${p2.y} L${p3.x},${p3.y} L${p3.x},${p3.y + thickness} L${p2.x},${p2.y + thickness} Z`;
    const leftFace = `M${p3.x},${p3.y} L${p4.x},${p4.y} L${p4.x},${p4.y + thickness} L${p3.x},${p3.y + thickness} Z`;
    slabSides = (
      <g>
        <path d={rightFace} fill={slabColor} />
        <path d={leftFace} fill={slabColor} style={{ filter: 'brightness(0.9)' }} />
      </g>
    );
  }

  return (
    <g>
      {slabSides}
      <path d={mainPath} fill={color} opacity={opacity} style={{ mixBlendMode: 'normal' }} />
    </g>
  );
};

interface IsoRoundedZoneProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity?: number;
  borderRadius?: number;
}

export const IsoRoundedZone: React.FC<IsoRoundedZoneProps> = ({ 
  x, y, width, height, color, opacity = 0.46, borderRadius = 20 
}) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g transform="matrix(0.654, -0.378, 0.654, 0.378, 0, 0)">
        <rect 
          x={-width/2} 
          y={-height/2} 
          width={width} 
          height={height} 
          rx={borderRadius}
          ry={borderRadius}
          fill={color}
          opacity={opacity}
          style={{ pointerEvents: 'all' }}
        />
      </g>
    </g>
  );
};

interface IsoLabelProps {
  x: number;
  y: number;
  text: string;
  width?: number;
}

export const IsoLabel: React.FC<IsoLabelProps> = ({ x, y, text, width = 140 }) => {
  const height = 100;

  return (
    <foreignObject x={x - width/2} y={y - height/2} width={width} height={height} style={{ pointerEvents: 'none', overflow: 'visible' }}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        margin: '20px',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '20px',
          fontWeight: '800',
          color: 'rgba(30, 41, 59, 0.85)',
          textTransform: 'uppercase',
          lineHeight: '1',
          wordWrap: 'break-word',
          transform: 'rotate(-26.5deg) skewX(10deg)',
          textShadow: '1px 1px 0px rgba(255,255,255,0.4)',
        }}>
          {text}
        </span>
      </div>
    </foreignObject>
  );
};

interface IsoCharacterProps {
  x: number;
  y: number;
  role: 'patient' | 'doctor' | 'nurse' | 'admin' | 'tech';
  facing?: 'left' | 'right';
  isSeated?: boolean;
  scale?: number;
}

export const IsoCharacter: React.FC<IsoCharacterProps> = ({ x, y, isSeated = false, role, scale = 2.5 }) => {
  const fill = "#0f172a";

  if (isSeated) {
    return (
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        <ellipse cx="0" cy="0" rx="8" ry="4" fill="rgba(0,0,0,0.2)" />
        <rect x="-6" y="-20" width="12" height="14" rx="3" fill={fill} />
        <path d="M-6,-6 L-6,0 L6,0 L6,-6 Z" fill={fill} />
        <circle cx="0" cy="-26" r="5" fill={fill} />
      </g>
    );
  }

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="8" ry="4" fill="rgba(0,0,0,0.2)" />
      <rect x="-5" y="-16" width="4" height="16" fill={fill} />
      <rect x="1" y="-16" width="4" height="16" fill={fill} />
      <rect x="-6" y="-29" width="12" height="16" rx="3" fill={fill} />
      <circle cx="0" cy="-35" r="5" fill={fill} />
    </g>
  );
};
