import React from 'react';
import { CONNECTIONS, CELL_SIZE, CELL_GAP, GRID_PADDING, HEADER_HEIGHT } from './constants';
import { GridConfig, Patient } from './types';

interface ConnectionLinesProps {
  grids: GridConfig[];
  patients: Patient[];
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ grids, patients }) => {

  const getGridAnchors = (gridId: string) => {
    const grid = grids.find(g => g.id === gridId);
    if (!grid) return { right: { x: 0, y: 0 }, left: { x: 0, y: 0 } };
    
    // Recalculate dimensions to match GridContainer logic exactly
    const gridPatients = patients.filter(p => p.gridId === gridId);
    const requiredRows = Math.ceil(gridPatients.length / grid.cols);
    const rows = Math.max(grid.rows, requiredRows);

    const gridBodyWidth = (grid.cols * (CELL_SIZE + CELL_GAP)) - CELL_GAP + GRID_PADDING;
    const gridBodyHeight = (rows * (CELL_SIZE + CELL_GAP)) - CELL_GAP + GRID_PADDING;
    
    // Calculate the vertical center of the grid body
    // Header height offset is applied to the top of the body
    const bodyY = grid.y + HEADER_HEIGHT;
    const centerY = bodyY + (gridBodyHeight / 2);
    
    return {
      right: { x: grid.x + gridBodyWidth, y: centerY },
      left: { x: grid.x, y: centerY }
    };
  };

  return (
    <svg 
      className="absolute top-0 left-0 pointer-events-none overflow-visible"
      width="5000"
      height="5000"
      style={{ zIndex: 0 }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
        </marker>
      </defs>
      {CONNECTIONS.map((conn) => {
        const source = getGridAnchors(conn.from);
        const target = getGridAnchors(conn.to);

        // Connect Right side of source to Left side of target
        const startX = source.right.x;
        const startY = source.right.y;
        
        const endX = target.left.x;
        const endY = target.left.y;

        // Skip if positions aren't ready (e.g. 0,0)
        if (startX === 0 && startY === 0) return null;

        // Straight line path
        const path = `M ${startX} ${startY} L ${endX} ${endY}`;

        return (
          <g key={`${conn.from}-${conn.to}`}>
            <path
              d={path}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              strokeDasharray="4 2"
            />
          </g>
        );
      })}
    </svg>
  );
};