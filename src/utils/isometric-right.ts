/**
 * ISOMETRIC UTILITIES - RIGHT CLINIC PANEL
 * Separate animation calculations for the right panel
 * Adjusted for different room sizes and positions
 */
import { Point } from '../types/isoclinic';

// Right panel uses different tile dimensions for its layout
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

export const gridToScreenRight = (gridX: number, gridY: number): Point => {
  const x = (gridX - gridY) * TILE_WIDTH / 2;
  const y = (gridX + gridY) * TILE_HEIGHT / 2;
  return { x, y };
};

export const getRoomCenterRight = (gridX: number, gridY: number, width: number, height: number): Point => {
  const centerX = gridX + width / 2;
  const centerY = gridY + height / 2;
  return gridToScreenRight(centerX, centerY);
};

export const lerpRight = (p1: Point, p2: Point, t: number): Point => {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
};

export const getIsoDepthRight = (gridX: number, gridY: number): number => {
  return gridX + gridY;
};

// ============================================
// RIGHT PANEL WAYPOINTS
// Adjusted for the monitoring room at gridX: 70, gridY: 10, width: 58, height: 40
// ============================================

// Monitoring room bounds: X from 70 to 128, Y from 10 to 50
// Center would be at (99, 30)
export const MONITORING_ROOM_RIGHT = {
  gridX: 70,
  gridY: 10,
  width: 58,
  height: 40,
  // Calculated center
  centerX: 99,
  centerY: 30,
};

// Calculate monitoring target position for patient placement
export const getMonitoringTargetRight = (patientIndex: number): Point => {
  const room = MONITORING_ROOM_RIGHT;
  const cols = 10;
  const row = Math.floor(patientIndex / cols);
  const col = patientIndex % cols;
  
  // Start at +15, use 3 unit spacing
  // Clamp to stay within zone bounds
  const maxX = room.gridX + room.width - 8;
  const maxY = room.gridY + room.height - 8;
  
  let targetX = room.gridX + 15 + col * 3;
  let targetY = room.gridY + 15 + row * 3;
  
  // Ensure patients stay inside the zone
  targetX = Math.min(targetX, maxX);
  targetY = Math.min(targetY, maxY);
  
  return { x: targetX, y: targetY };
};

// Waypoints adjusted for right panel room positions
export const WAYPOINTS_RIGHT = {
  SPAWN: { x: 10, y: 10 },
  WAITING: { x: 44, y: 20 },
  HEPA_1: { x: 63, y: 15 },
  HEPA_2: { x: 64, y: 31 },
  CORRIDOR: { x: 75, y: 25 },
  MONITORING_ENTRY: { x: 95, y: 25 },
};

// Get path to monitoring room from corridor
export const getPathToMonitoringRight = (fromPoint: Point, patientIndex: number): Point[] => {
  const target = getMonitoringTargetRight(patientIndex);
  return [
    WAYPOINTS_RIGHT.CORRIDOR,
    WAYPOINTS_RIGHT.MONITORING_ENTRY,
    target,
  ];
};
