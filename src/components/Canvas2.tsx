import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  Node,
  NodeProps,
  useReactFlow,
  Handle,
  Position,
  Panel,
} from 'reactflow';
import styled from 'styled-components';
import 'reactflow/dist/style.css';
import { FileText, Image as ImageIcon, X, Plus, Mic, MicOff, Layers, Zap, Activity, Database, AlertTriangle, GitMerge, MessageSquare, Stethoscope, ShieldAlert, UserCheck, ClipboardCheck } from 'lucide-react';
import zoneConfig from '../data/zone-config.json';
import boardItemsData from '../data/boardItems.json';
import BoardItem from './BoardItem';
import TriageFlowNode from './TriageFlowNode';
import EHRHubNode from './EHRHubNode';
import AlertModal from './AlertModal';
import AgentChat from './AgentChat';
import { Dashboard as Chronomed2Dashboard } from './chronomed-2/Dashboard';
import INITIAL_DATA from '../data/new_medtimeline_updated.json';
import { MarkerType } from 'reactflow';

interface ZoneContainerProps {
  color: string;
  gradient?: string;
}

const ZoneContainer = styled.div<ZoneContainerProps>`
  position: absolute;
  border: 2px solid rgba(2, 136, 209, 0.3);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(227, 242, 253, 0.6) 0%, rgba(225, 245, 254, 0.6) 100%);
  pointer-events: none;
  z-index: 1;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(2, 136, 209, 0.1);
`;

const ZoneLabel = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #0288d1;
  pointer-events: none;
  z-index: 2;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(2, 136, 209, 0.15);
  border: 2px solid rgba(2, 136, 209, 0.2);
  letter-spacing: 0.02em;
`;

const ZonesLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

const AppHeader = styled.header`
  height: 64px;
  background: linear-gradient(135deg, #0288d1 0%, #03a9f4 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(2, 136, 209, 0.2);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.02em;
  
  svg {
    color: #e3f2fd;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
`;

const HeaderNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const NavButton = styled.button<{ active?: boolean }>`
  padding: 10px 18px;
  border: none;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.85)'};
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatusBadge = styled.div<{ status: 'online' | 'offline' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: ${props => props.status === 'online' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(239, 68, 68, 0.2)'};
  color: white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.status === 'online' ? '#4ade80' : '#ef4444'};
    box-shadow: 0 0 8px ${props => props.status === 'online' ? '#4ade80' : '#ef4444'};
    animation: ${props => props.status === 'online' ? 'pulse 2s ease-in-out infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const CanvasContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #ffffff;
`;

const ReactFlowWrapper = styled.div<{ sidebarOpen: boolean; isPanning?: boolean }>`
  position: absolute;
  left: ${props => props.sidebarOpen ? 'clamp(380px, 30vw, 500px)' : '0'};
  right: 0;
  top: 0;
  bottom: 0;
  background: #ffffff;
  transition: left 0.3s ease;
  
  /* Custom selection styling for nodes */
  .react-flow__node.selected {
    .react-flow__node-default,
    & > div {
      box-shadow: 0 0 0 3px rgba(2, 136, 209, 0.4), 0 8px 24px rgba(2, 136, 209, 0.15) !important;
    }
  }
  
  /* Remove default ReactFlow selection styling */
  .react-flow__node.selected .react-flow__handle {
    background: #0288d1;
  }
  
  /* ReactFlow controls styling */
  .react-flow__controls {
    box-shadow: 0 4px 16px rgba(2, 136, 209, 0.12);
    border: 1px solid rgba(2, 136, 209, 0.1);
    border-radius: 12px;
    overflow: hidden;
    background: white;
  }
  
  .react-flow__controls-button {
    background: white;
    border-bottom: 1px solid rgba(2, 136, 209, 0.08);
    
    &:hover {
      background: #e3f2fd;
    }
    
    svg {
      fill: #0288d1;
    }
  }

  /* Panning mode styles */
  ${props => props.isPanning && `
    .react-flow__node, .react-flow__node *, .react-flow__edge {
      pointer-events: none !important;
    }
    cursor: grab !important;
    
    &:active {
      cursor: grabbing !important;
    }
  `}

  /* Ensure edges are rendered above nodes */
  .react-flow__edges {
    z-index: 2000 !important;
  }
  
  /* Ensure edge labels are rendered above edges */
  .react-flow__edgelabel-renderer {
    z-index: 2001 !important;
  }
`;

const FloatingToolbar = styled.div`
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid rgba(2, 136, 209, 0.15);
  border-radius: 14px;
  padding: 10px;
  display: flex;
  gap: 6px;
  box-shadow: 0 8px 24px rgba(2, 136, 209, 0.15);
  z-index: 100;
`;

const ToolbarButton = styled.button<{ active?: boolean }>`
  padding: 10px 16px;
  border: none;
  background: ${props => props.active ? 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)' : 'transparent'};
  color: ${props => props.active ? 'white' : '#0288d1'};
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)' : '#e3f2fd'};
    color: ${props => props.active ? 'white' : '#01579b'};
    transform: translateY(-1px);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

// Wrapper to override BoardItem's absolute positioning for ReactFlow
const NodeWrapper = styled.div`
  position: relative !important;
  width: fit-content;
  height: fit-content;
  
  /* Override BoardItem's absolute positioning */
  & > div {
    position: relative !important;
    left: 0 !important;
    top: 0 !important;
    transform: none !important;
  }
`;

// Custom node component for consolidator and other custom nodes
const CustomNodeContainer = styled.div<{ color?: string }>`
  padding: 64px 80px;
  border-radius: 40px;
  background: white;
  border: 8px solid ${props => props.color || '#e5e7eb'};
  min-width: 700px;
  box-shadow: 0 16px 64px ${props => props.color ? `${props.color}40` : 'rgba(0, 0, 0, 0.15)'};
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  
  &:hover {
    box-shadow: 0 24px 80px ${props => props.color ? `${props.color}60` : 'rgba(0, 0, 0, 0.2)'};
    transform: translateY(-4px) scale(1.02);
  }
`;

const CustomNodeIconContainer = styled.div<{ color?: string }>`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: ${props => props.color || '#e5e7eb'};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px ${props => props.color ? `${props.color}60` : 'rgba(0, 0, 0, 0.1)'};
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 8px 32px ${props => props.color ? `${props.color}60` : 'rgba(0, 0, 0, 0.1)'};
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 12px 48px ${props => props.color ? `${props.color}80` : 'rgba(0, 0, 0, 0.15)'};
    }
  }
`;

const CustomNodeTitle = styled.div`
  font-weight: 700;
  font-size: 40px;
  color: #1f2937;
  text-align: center;
  line-height: 1.3;
`;

const CustomNodeContent = styled.div`
  font-size: 28px;
  color: #6b7280;
  line-height: 1.5;
  text-align: center;
  max-width: 600px;
`;

const CustomNodeBadge = styled.div<{ color?: string }>`
  padding: 12px 32px;
  border-radius: 40px;
  background: ${props => props.color ? `${props.color}20` : '#f3f4f6'};
  color: ${props => props.color || '#6b7280'};
  font-size: 24px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;



function CustomNode({ data }: NodeProps) {
  const getIcon = () => {
    switch (data.icon) {
      case 'database':
        return <Database size={80} color="white" strokeWidth={3} />;
      case 'activity':
        return <Activity size={80} color="white" strokeWidth={3} />;
      case 'merge':
        return <GitMerge size={80} color="white" strokeWidth={3} />;
      case 'alert':
        return <AlertTriangle size={80} color="white" strokeWidth={3} />;
      case 'file-text':
        return <FileText size={80} color="white" strokeWidth={3} />;
      case 'stethoscope':
        return <Stethoscope size={80} color="white" strokeWidth={3} />;
      case 'shield-alert':
        return <ShieldAlert size={80} color="white" strokeWidth={3} />;
      case 'user-check':
        return <UserCheck size={80} color="white" strokeWidth={3} />;
      case 'clipboard-check':
        return <ClipboardCheck size={80} color="white" strokeWidth={3} />;
      default:
        return <Layers size={80} color="white" strokeWidth={3} />;
    }
  };

  // Determine which handles to show based on handlePosition
  const handlePosition = data.handlePosition || 'both';
  
  // If handlePosition is 'both', show top and bottom
  // If it's 'right', show top, bottom, AND right
  // If it's a specific position, show that plus top/bottom for flow
  const showTopHandle = handlePosition === 'both' || handlePosition === 'right' || handlePosition === 'top';
  const showBottomHandle = handlePosition === 'both' || handlePosition === 'right' || handlePosition === 'bottom';
  const showRightHandle = handlePosition === 'right';
  const showLeftHandle = handlePosition === 'left';

  const handleStyle = {
    background: data.color || '#e5e7eb',
    width: 32,
    height: 32,
    border: '6px solid white',
  };

  return (
    <CustomNodeContainer color={data.color}>
      {showTopHandle && (
        <Handle 
          type="target" 
          position={Position.Top}
          style={handleStyle}
        />
      )}
      {showBottomHandle && (
        <Handle 
          type="source" 
          position={Position.Bottom}
          style={handleStyle}
        />
      )}
      {showRightHandle && (
        <Handle 
          type="source" 
          position={Position.Right}
          id="right"
          style={handleStyle}
        />
      )}
      {showLeftHandle && (
        <Handle 
          type="target" 
          position={Position.Left}
          id="left"
          style={handleStyle}
        />
      )}
      
      <CustomNodeIconContainer color={data.color}>
        {getIcon()}
      </CustomNodeIconContainer>
      
      <CustomNodeTitle>
        {data.label}
      </CustomNodeTitle>
      
      {data.content && <CustomNodeContent>{data.content}</CustomNodeContent>}
      
      <CustomNodeBadge color={data.color}>
        {data.badge || 'Processing'}
      </CustomNodeBadge>
    </CustomNodeContainer>
  );
}

// Custom node component that renders board items using the actual BoardItem component
function CustomBoardNode({ data }: NodeProps) {
  const item = data.item;
  const isButton = item.type === 'button';
  const showHandles = item.showHandles === true;
  
  // Determine which handles to show based on handlePosition
  const handlePosition = item.handlePosition || 'both';
  const positions = typeof handlePosition === 'string' ? handlePosition.split(',').map(p => p.trim()) : [];
  const hasTopHandle = positions.includes('top') || positions.includes('both') || handlePosition === 'both';
  const hasBottomHandle = positions.includes('bottom') || positions.includes('both') || handlePosition === 'both';
  const hasRightHandle = positions.includes('right');
  const hasLeftHandle = positions.includes('left');
  
  const handleStyle = {
    background: item.buttonColor || '#2196F3', 
    width: 16, 
    height: 16,
    border: '3px solid white',
    pointerEvents: 'all' as const
  };
  
  return (
    <>
      {/* Add connection handles for button items that have showHandles enabled */}
      {isButton && showHandles && (
        <>
          {hasTopHandle && (
            <Handle 
              type="target" 
              position={Position.Top} 
              id="top"
              style={{ 
                ...handleStyle,
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)',
              }} 
            />
          )}
          {hasBottomHandle && (
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="bottom"
              style={{ 
                ...handleStyle,
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
              }} 
            />
          )}
          {hasLeftHandle && (
            <Handle 
              type="target" 
              position={Position.Left} 
              id="left"
              style={{ 
                ...handleStyle,
                left: -8,
                top: '50%',
                transform: 'translateY(-50%)',
              }} 
            />
          )}
          {hasRightHandle && (
            <Handle 
              type="source" 
              position={Position.Right} 
              id="right"
              style={{ 
                ...handleStyle,
                right: -8,
                top: '50%',
                transform: 'translateY(-50%)',
              }} 
            />
          )}
        </>
      )}
      <NodeWrapper>
        <BoardItem
          item={item}
          isSelected={data.isSelected || false}
          onUpdate={data.onUpdate}
          onDelete={data.onDelete}
          onSelect={data.onSelect}
          zoom={1}
        />
      </NodeWrapper>
    </>
  );
}

// Custom zone node component
function ZoneNode({ data }: NodeProps) {
  const zone = data.zone || data;
  const handlePosition = data.handlePosition || zone.handlePosition;
  
  // Use fixed blue color scheme for all zones
  const borderColor = '#2196F3';
  const chipColor = '#2196F3';
  
  // Support multiple handle positions (can be 'top', 'bottom', 'both', 'right', 'left', or comma-separated like 'bottom,right')
  const positions = typeof handlePosition === 'string' ? handlePosition.split(',').map(p => p.trim()) : [];
  const hasTopHandle = positions.includes('top') || positions.includes('both');
  const hasBottomHandle = positions.includes('bottom') || positions.includes('both');
  const hasRightHandle = positions.includes('right');
  const hasLeftHandle = positions.includes('left');
  
  return (
    <div
      style={{
        width: zone.width,
        height: zone.height,
        border: `3px solid ${borderColor}`,
        borderRadius: '20px',
        background: data.style?.background || 'linear-gradient(135deg, rgba(227, 242, 253, 0.6) 0%, rgba(225, 245, 254, 0.6) 100%)',
        pointerEvents: 'none',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.15)',
      }}
    >
      {/* Add connection handles based on handlePosition */}
      {hasTopHandle && (
        <Handle 
          type="target" 
          position={Position.Top} 
          id="top"
          style={{ 
            background: chipColor, 
            width: 16, 
            height: 16,
            border: '3px solid white',
            top: -8,
            pointerEvents: 'all'
          }} 
        />
      )}
      
      {hasBottomHandle && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="bottom"
          style={{ 
            background: chipColor, 
            width: 16, 
            height: 16,
            border: '3px solid white',
            bottom: -8,
            pointerEvents: 'all'
          }} 
        />
      )}
      
      {hasRightHandle && (
        <Handle 
          type="source" 
          position={Position.Right} 
          id="right"
          style={{ 
            background: chipColor, 
            width: 16, 
            height: 16,
            border: '3px solid white',
            right: -8,
            pointerEvents: 'all'
          }} 
        />
      )}
      
      {hasLeftHandle && (
        <Handle 
          type="target" 
          position={Position.Left} 
          id="left"
          style={{ 
            background: chipColor, 
            width: 16, 
            height: 16,
            border: '3px solid white',
            left: -8,
            pointerEvents: 'all'
          }} 
        />
      )}
      
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '10px 16px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          color: chipColor,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.15)',
          border: `2px solid ${chipColor}`,
          letterSpacing: '0.02em',
        }}
      >
        {zone.label || data.label}
      </div>
    </div>
  );
}

// Custom node for SingleEncounterDocument components
const EncounterNodeContainer = styled.div`
  background: transparent;
  border-radius: 8px;
  overflow: visible;
  pointer-events: auto;
  position: relative;
  width: fit-content;
  
  .react-flow__handle {
    width: 12px;
    height: 12px;
    background: #3b82f6;
    border: 2px solid white;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &:hover .react-flow__handle {
    opacity: 1;
  }
`;

function SingleEncounterNode({ data }: NodeProps) {
  // Determine if this is the first or last encounter based on the item ID
  const itemId = data.item?.id || '';
  const isFirstEncounter = itemId.includes('single-encounter-1');
  const isLastEncounter = itemId.includes('single-encounter-7');
  
  return (
    <EncounterNodeContainer>
      {/* Connection handles for linking encounters */}
      {/* Only show left handle if NOT the first encounter */}
      {!isFirstEncounter && (
        <Handle 
          type="target" 
          position={Position.Left} 
          id="left"
          style={{ left: -6 }}
        />
      )}
      {/* Only show right handle if NOT the last encounter */}
      {!isLastEncounter && (
        <Handle 
          type="source" 
          position={Position.Right} 
          id="right"
          style={{ right: -6 }}
        />
      )}
      
      <NodeWrapper>
        <BoardItem
          item={data.item}
          isSelected={data.isSelected || false}
          onUpdate={data.onUpdate}
          onDelete={data.onDelete}
          onSelect={data.onSelect}
          zoom={1}
        />
      </NodeWrapper>
    </EncounterNodeContainer>
  );
}

function Canvas2() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean;
    deletedCount: number;
    remainingCount?: number;
    error?: string;
  } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });
  
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [displayedHandle, setDisplayedHandle] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Delayed hover state with smooth transition
  React.useEffect(() => {
    if (hoveredHandle) {
      // Immediately show connections when hovering
      setDisplayedHandle(hoveredHandle);
      // Clear any pending timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    } else {
      // Delay hiding connections by 500ms when mouse leaves
      hoverTimeoutRef.current = setTimeout(() => {
        setDisplayedHandle(null);
      }, 500);
    }
    
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [hoveredHandle]);

  // Calculate dynamic nodes and edges for Chronomed
  const { nodes: chronomedDynamicNodes, edges: chronomedDynamicEdges, storyHandles, activeScenarioHandles } = useMemo(() => {
    if (!showConnections) {
        return { nodes: [], edges: [], storyHandles: [], activeScenarioHandles: [] };
    }

    const encounters = INITIAL_DATA.content.props.encounters;
    const labs = INITIAL_DATA.content.props.labTimeline;
    const risks = INITIAL_DATA.content.props.riskTimeline;
    const keyEvents = INITIAL_DATA.content.props.keyEvents;

    const encounterNodeId = 'encounter-track-1';
    const medNodeId = 'medication-track-1';
    const labNodeId = 'lab-track-1';
    const riskNodeId = 'risk-track-1';
    const keyEventNodeId = 'key-events-track-1';

    const newNodes: Node[] = [];
    const newEdges: any[] = [];
    const allStoryHandles: string[] = [];

    // Edge: Methotrexate 7.5mg → ALT spike (2024-07-15)
    const mtxHandleId = 'med-methotrexate-7-5mg-weekly-0-source';
    const altLabIdx = labs.findIndex((l: any) => l.biomarker === 'ALT');
    const altSpikePointIdx = labs[altLabIdx]?.values.findIndex((v: any) => v.t === '2024-07-15T14:00:00');
    
    const altTargetHandle = `lab-${altLabIdx}-point-${altSpikePointIdx}-target`;
    const altSourceHandle = `lab-${altLabIdx}-point-${altSpikePointIdx}-source`;
    
    if (altLabIdx !== -1 && altSpikePointIdx !== -1) {
        const isHighlighted = displayedHandle && (
                            displayedHandle === mtxHandleId || 
                            displayedHandle === altTargetHandle ||
                            displayedHandle === altSourceHandle ||
                            displayedHandle === `risk-point-${risks.findIndex((r: any) => new Date(r.t).toDateString() === new Date('2024-07-15T14:00:00').toDateString())}-target`);
        
        if (isHighlighted) {
            newEdges.push({
                id: 'e-mtx-to-alt-spike',
                type: 'default',
                source: medNodeId,
                sourceHandle: mtxHandleId,
                target: labNodeId,
                targetHandle: altTargetHandle,
                label: '6 weeks of MTX 7.5mg → ALT 185',
                animated: true,
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }

    // Edge: Methotrexate 7.5mg → AST spike (2024-07-15)
    const astLabIdx = labs.findIndex((l: any) => l.biomarker === 'AST');
    const astSpikePointIdx = labs[astLabIdx]?.values.findIndex((v: any) => v.t === '2024-07-15T14:00:00');
    
    const astTargetHandle = `lab-${astLabIdx}-point-${astSpikePointIdx}-target`;
    const astSourceHandle = `lab-${astLabIdx}-point-${astSpikePointIdx}-source`;
    
    if (astLabIdx !== -1 && astSpikePointIdx !== -1) {
        const isHighlighted = displayedHandle && (
                            displayedHandle === mtxHandleId || 
                            displayedHandle === astTargetHandle ||
                            displayedHandle === astSourceHandle ||
                            displayedHandle === `risk-point-${risks.findIndex((r: any) => new Date(r.t).toDateString() === new Date('2024-07-15T14:00:00').toDateString())}-target`);
        
        if (isHighlighted) {
            newEdges.push({
                id: 'e-mtx-to-ast-spike',
                type: 'default',
                source: medNodeId,
                sourceHandle: mtxHandleId,
                target: labNodeId,
                targetHandle: astTargetHandle,
                label: 'AST 130',
                animated: true,
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }

    // Find the risk point for July 15, 2024 (0.8 risk score)
    const july15RiskIdx = risks.findIndex((r: any) => new Date(r.t).toDateString() === new Date('2024-07-15T14:00:00').toDateString());
    const riskTargetHandle = `risk-point-${july15RiskIdx}-target`;
    
    // Scenario 1: MTX Toxicity Detection - collect handles
    allStoryHandles.push(mtxHandleId, altTargetHandle, altSourceHandle, astTargetHandle, astSourceHandle, riskTargetHandle);

    // Edge: ALT spike → Risk Score (July 15)
    if (altLabIdx !== -1 && altSpikePointIdx !== -1 && july15RiskIdx !== -1) {
        const isHighlighted = displayedHandle && (
                            displayedHandle === altSourceHandle || 
                            displayedHandle === altTargetHandle ||
                            displayedHandle === riskTargetHandle ||
                            displayedHandle === mtxHandleId);
        
        if (isHighlighted) {
            newEdges.push({
                id: 'e-alt-to-july15-risk',
                type: 'default',
                animated: true,
                source: labNodeId,
                sourceHandle: altSourceHandle,
                target: riskNodeId,
                targetHandle: riskTargetHandle,
                label: 'ALT 185 → Risk 0.8',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }

    // Edge: AST spike → Risk Score (July 15)
    if (astLabIdx !== -1 && astSpikePointIdx !== -1 && july15RiskIdx !== -1) {
        const isHighlighted = displayedHandle && (
                            displayedHandle === astSourceHandle || 
                            displayedHandle === astTargetHandle ||
                            displayedHandle === riskTargetHandle ||
                            displayedHandle === mtxHandleId);
        
        if (isHighlighted) {
            newEdges.push({
                id: 'e-ast-to-july15-risk',
                type: 'default',
                animated: true,
                source: labNodeId,
                sourceHandle: astSourceHandle,
                target: riskNodeId,
                targetHandle: riskTargetHandle,
                label: 'AST 130 confirms injury',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }

    // Group key events by date for finding event indices
    const groupedEvents: Record<string, any[]> = {};
    keyEvents.forEach((evt: any) => {
        const dateKey = new Date(evt.t).toDateString();
        if (!groupedEvents[dateKey]) {
            groupedEvents[dateKey] = [];
        }
        groupedEvents[dateKey].push(evt);
    });
    const eventGroups = Object.values(groupedEvents).sort((a, b) => new Date(a[0].t).getTime() - new Date(b[0].t).getTime());

    // Find August 12 crisis event
    const aug12EventIdx = eventGroups.findIndex(group => new Date(group[0].t).toDateString() === new Date('2024-08-12T09:30:00').toDateString());
    
    // Edge 1: Lab cluster (ALT 490, AST 350, Bilirubin 110) → Crisis Presentation
    const altCrisisIdx = labs[altLabIdx]?.values.findIndex((v: any) => v.t === '2024-08-12T09:30:00');
    const astCrisisIdx = labs[astLabIdx]?.values.findIndex((v: any) => v.t === '2024-08-12T09:30:00');
    const bilirubinLabIdx = labs.findIndex((l: any) => l.biomarker === 'Total Bilirubin');
    const bilirubinCrisisIdx = labs[bilirubinLabIdx]?.values.findIndex((v: any) => v.t === '2024-08-12T09:30:00');
    
    const altCrisisSourceHandle = `lab-${altLabIdx}-point-${altCrisisIdx}-source`;
    const altCrisisTargetHandle = `lab-${altLabIdx}-point-${altCrisisIdx}-target`;
    const astCrisisSourceHandle = `lab-${astLabIdx}-point-${astCrisisIdx}-source`;
    const astCrisisTargetHandle = `lab-${astLabIdx}-point-${astCrisisIdx}-target`;
    const bilirubinCrisisSourceHandle = `lab-${bilirubinLabIdx}-point-${bilirubinCrisisIdx}-source`;
    const bilirubinCrisisTargetHandle = `lab-${bilirubinLabIdx}-point-${bilirubinCrisisIdx}-target`;
    const aug12EventTargetHandle = `key-event-${aug12EventIdx}-target`;
    const aug12EventSourceHandle = `key-event-${aug12EventIdx}-source`;
    
    // MTX 5mg medication handle (the second MTX dose that was reduced)
    const mtx5mgHandleId = 'med-methotrexate-5mg-weekly-1-source';
    
    // Risk 9.5 point (Aug 12, 2024)
    const risk95Idx = risks.findIndex((r: any) => r.riskScore === 9.5 && new Date(r.t).toDateString() === new Date('2024-08-12T09:30:00').toDateString());
    const risk95TargetHandle = `risk-point-${risk95Idx}-target`;
    
    // NAC medication handle - must match the transformation in MedicationTrack.tsx
    // "N-acetylcysteine (NAC)" -> replace spaces with dashes -> lowercase -> "n-acetylcysteine-(nac)"
    const nacHandleId = 'med-group-n-acetylcysteine-(nac)-target';
    
    // Scenario 2a: MTX → ALT 490 (individual lab scenario - only target handle)
    const altCrisisScenarioHandles = [
        altCrisisTargetHandle
    ];
    
    // Scenario 2b: MTX → AST 350 (individual lab scenario - only target handle)
    const astCrisisScenarioHandles = [
        astCrisisTargetHandle
    ];
    
    // Scenario 2c: MTX → Bilirubin 110 (individual lab scenario - only target handle)
    const bilirubinCrisisScenarioHandles = [
        bilirubinCrisisTargetHandle
    ];
    
    // Scenario 2d: Risk 9.5 scenario (shows MTX → 3 labs → Risk 9.5 only)
    const risk95SourceHandle = `risk-point-${risk95Idx}-source`;
    const risk95ScenarioHandles = [
        risk95TargetHandle,
        risk95SourceHandle
    ];
    
    // Scenario 2e: Crisis scenario (shows Risk 9.5 → Crisis → NAC)
    const crisisScenarioHandles = [
        aug12EventTargetHandle,
        aug12EventSourceHandle
    ];
    
    // Collect all story handles
    allStoryHandles.push(...altCrisisScenarioHandles, ...astCrisisScenarioHandles, ...bilirubinCrisisScenarioHandles, ...risk95ScenarioHandles, ...crisisScenarioHandles);
    
    // Scenario 2a: MTX → ALT 490 (only shows when hovering ALT 490)
    if (altLabIdx !== -1 && altCrisisIdx !== -1) {
        const isHighlighted = displayedHandle && altCrisisScenarioHandles.some(h => h === displayedHandle);
        
        if (isHighlighted) {
            newEdges.push({
                id: 'e-mtx5mg-to-alt-crisis',
                type: 'default',
                animated: true,
                source: medNodeId,
                sourceHandle: mtx5mgHandleId,
                target: labNodeId,
                targetHandle: altCrisisTargetHandle,
                label: 'MTX 5mg → ALT 490',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }
    
    // Scenario 2b: MTX → AST 350 (only shows when hovering AST 350)
    if (astLabIdx !== -1 && astCrisisIdx !== -1) {
        const isHighlighted = displayedHandle && astCrisisScenarioHandles.some(h => h === displayedHandle);
        
        if (isHighlighted) {
            newEdges.push({
                id: 'e-mtx5mg-to-ast-crisis',
                type: 'default',
                animated: true,
                source: medNodeId,
                sourceHandle: mtx5mgHandleId,
                target: labNodeId,
                targetHandle: astCrisisTargetHandle,
                label: 'MTX 5mg → AST 350',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }
    
    // Scenario 2c: MTX → Bilirubin 110 (only shows when hovering Bilirubin 110)
    if (bilirubinLabIdx !== -1 && bilirubinCrisisIdx !== -1) {
        const isHighlighted = displayedHandle && bilirubinCrisisScenarioHandles.some(h => h === displayedHandle);
        
        if (isHighlighted) {
            newEdges.push({
                id: 'e-mtx5mg-to-bilirubin-crisis',
                type: 'default',
                animated: true,
                source: medNodeId,
                sourceHandle: mtx5mgHandleId,
                target: labNodeId,
                targetHandle: bilirubinCrisisTargetHandle,
                label: 'MTX 5mg → Bilirubin 110',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }
    
    // Scenario 2d: Risk 9.5 scenario - shows MTX → 3 labs → Risk 9.5 only
    if (altLabIdx !== -1 && altCrisisIdx !== -1 && risk95Idx !== -1) {
        const isHighlighted = displayedHandle && risk95ScenarioHandles.some(h => h === displayedHandle);
        
        if (isHighlighted) {
            // MTX → ALT 490
            newEdges.push({
                id: 'e-mtx5mg-to-alt-crisis',
                type: 'default',
                animated: true,
                source: medNodeId,
                sourceHandle: mtx5mgHandleId,
                target: labNodeId,
                targetHandle: altCrisisTargetHandle,
                label: 'MTX 5mg → ALT 490',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
            
            // MTX → AST 350
            newEdges.push({
                id: 'e-mtx5mg-to-ast-crisis-risk95',
                type: 'default',
                animated: true,
                source: medNodeId,
                sourceHandle: mtx5mgHandleId,
                target: labNodeId,
                targetHandle: astCrisisTargetHandle,
                label: 'MTX 5mg → AST 350',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
            
            // MTX → Bilirubin 110
            newEdges.push({
                id: 'e-mtx5mg-to-bilirubin-crisis-risk95',
                type: 'default',
                animated: true,
                source: medNodeId,
                sourceHandle: mtx5mgHandleId,
                target: labNodeId,
                targetHandle: bilirubinCrisisTargetHandle,
                label: 'MTX 5mg → Bilirubin 110',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
            
            // ALT 490 → Risk 9.5
            newEdges.push({
                id: 'e-alt-crisis-to-risk95',
                type: 'default',
                animated: true,
                source: labNodeId,
                sourceHandle: altCrisisSourceHandle,
                target: riskNodeId,
                targetHandle: risk95TargetHandle,
                label: 'ALT 490 → Risk 9.5',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
            
            // AST 350 → Risk 9.5
            newEdges.push({
                id: 'e-ast-crisis-to-risk95',
                type: 'default',
                animated: true,
                source: labNodeId,
                sourceHandle: astCrisisSourceHandle,
                target: riskNodeId,
                targetHandle: risk95TargetHandle,
                label: 'AST 350 → Risk 9.5',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
            
            // Bilirubin 110 → Risk 9.5
            newEdges.push({
                id: 'e-bilirubin-crisis-to-risk95',
                type: 'default',
                animated: true,
                source: labNodeId,
                sourceHandle: bilirubinCrisisSourceHandle,
                target: riskNodeId,
                targetHandle: risk95TargetHandle,
                label: 'Bilirubin 110 → Risk 9.5',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }
    
    // Scenario 2e: Crisis scenario - shows Risk 9.5 → Crisis → NAC
    if (aug12EventIdx !== -1 && risk95Idx !== -1) {
        const isHighlighted = displayedHandle && crisisScenarioHandles.some(h => h === displayedHandle);
        
        if (isHighlighted) {
            // Risk 9.5 → Crisis Presentation
            newEdges.push({
                id: 'e-risk95-to-crisis',
                type: 'default',
                animated: true,
                source: riskNodeId,
                sourceHandle: `risk-point-${risk95Idx}-source`,
                target: keyEventNodeId,
                targetHandle: aug12EventTargetHandle,
                label: 'Risk 9.5 → Crisis',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
            
            // Crisis Presentation → NAC
            newEdges.push({
                id: 'e-crisis-to-nac',
                type: 'default',
                animated: true,
                source: keyEventNodeId,
                sourceHandle: aug12EventSourceHandle,
                target: medNodeId,
                targetHandle: nacHandleId,
                label: 'Crisis → NAC infusion',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }
    

    // Edge 3: NAC → ALT begins to fall (Aug 15)
    const altAug15Idx = labs[altLabIdx]?.values.findIndex((v: any) => v.t === '2024-08-15T10:00:00');
    const nacSourceHandleId = 'med-group-n-acetylcysteine-(nac)-source';
    const altAug15TargetHandle = `lab-${altLabIdx}-point-${altAug15Idx}-target`;
    
    // Related handles for NAC recovery scenario
    const nacRecoveryRelatedHandles = [
        nacSourceHandleId,
        nacHandleId,
        altAug15TargetHandle
    ];
    
    // Scenario 3: NAC Recovery - collect handles
    allStoryHandles.push(...nacRecoveryRelatedHandles);

    // Debug logging for NAC connections (after all variables are declared)
    if (displayedHandle && (displayedHandle.includes('nac') || displayedHandle.includes('acetylcysteine'))) {
        console.log('🔍 NAC Debug:', {
            displayedHandle,
            nacHandleId,
            nacSourceHandleId,
            crisisScenarioHandles,
            nacRecoveryRelatedHandles,
            isCrisisHighlighted: crisisScenarioHandles.some(h => h === displayedHandle),
            isRecoveryHighlighted: nacRecoveryRelatedHandles.some(h => h === displayedHandle),
            edgesCreated: newEdges.filter(e => e.id.includes('nac')).map(e => e.id)
        });
    }
    
    if (altLabIdx !== -1 && altAug15Idx !== -1) {
        const isHighlighted = displayedHandle && nacRecoveryRelatedHandles.some(h => h === displayedHandle);
        
        if (isHighlighted) {
            newEdges.push({
                id: 'e-nac-to-alt-fall',
                type: 'default',
                animated: true,
                source: medNodeId,
                sourceHandle: nacSourceHandleId,
                target: labNodeId,
                targetHandle: altAug15TargetHandle,
                label: 'MTX stopped + NAC → ALT begins to fall',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }

    // Edge 4: Bilirubin peak → Peak Cholestasis event
    const aug15EventIdx = eventGroups.findIndex(group => new Date(group[0].t).toDateString() === new Date('2024-08-15T10:00:00').toDateString());
    const bilirubinPeakIdx = labs[bilirubinLabIdx]?.values.findIndex((v: any) => v.t === '2024-08-15T10:00:00');
    const bilirubinPeakSourceHandle = `lab-${bilirubinLabIdx}-point-${bilirubinPeakIdx}-source`;
    const bilirubinPeakTargetHandle = `lab-${bilirubinLabIdx}-point-${bilirubinPeakIdx}-target`;
    const aug15EventTargetHandle = `key-event-${aug15EventIdx}-target`;
    
    // Related handles for cholestasis peak scenario (include both source and target for the lab point)
    const cholestasisRelatedHandles = [
        bilirubinPeakSourceHandle,
        bilirubinPeakTargetHandle,
        aug15EventTargetHandle
    ];
    
    // Scenario 4: Peak Cholestasis - collect handles
    allStoryHandles.push(...cholestasisRelatedHandles);
    
    if (bilirubinLabIdx !== -1 && bilirubinPeakIdx !== -1 && aug15EventIdx !== -1) {
        const isHighlighted = displayedHandle && cholestasisRelatedHandles.some(h => h === displayedHandle);
        
        if (isHighlighted) {
            newEdges.push({
                id: 'e-bilirubin-peak-to-cholestasis',
                type: 'default',
                animated: true,
                source: labNodeId,
                sourceHandle: bilirubinPeakSourceHandle,
                target: keyEventNodeId,
                targetHandle: aug15EventTargetHandle,
                label: 'Bilirubin 190 → peak cholestasis',
                style: { 
                    stroke: '#3b82f6', 
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                    color: '#3b82f6',
                },
                labelStyle: { 
                    fill: '#000000', 
                    fontWeight: 600, 
                    fontSize: 11
                },
                labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }
            });
        }
    }

    // Collect all unique story handles for marker display
    const uniqueStoryHandles = Array.from(new Set(allStoryHandles));
    
    // Get active scenario handles from the edges that are currently displayed
    // Collect all handles involved in the displayed edges (source and target handles)
    const activeHandles: string[] = [];
    if (displayedHandle && newEdges.length > 0) {
        newEdges.forEach(edge => {
            // Add the source and target handles from each edge
            if (edge.sourceHandle) {
                activeHandles.push(edge.sourceHandle);
            }
            if (edge.targetHandle) {
                activeHandles.push(edge.targetHandle);
            }
        });
    }
    const uniqueActiveHandles = Array.from(new Set(activeHandles));
    
    return { nodes: newNodes, edges: newEdges, storyHandles: uniqueStoryHandles, activeScenarioHandles: uniqueActiveHandles };
  }, [showConnections, displayedHandle]);


  const reactFlowInstance = useRef<any>(null);

  // Get API base URL
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    (window.location.hostname === "localhost"
      ? "http://localhost:3001"
      : window.location.origin);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Handle node drag stop - update position in backend
  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    // Only update positions for draggable items (not zones)
    if (node.type === 'zone' || node.id.startsWith('zone-') || node.id.includes('subzone-')) {
      console.log(`⏭️ Skipping position update for zone: ${node.id}`);
      return;
    }

    const newX = Math.round(node.position.x);
    const newY = Math.round(node.position.y);
    const startTime = Date.now();

    console.log(`📍 Node ${node.id} dragged to (${newX}, ${newY}) at ${startTime}`);

    // Update local state immediately (optimistic update)
    setItems((prev) =>
      prev.map((item) => (item.id === node.id ? { ...item, x: newX, y: newY } : item))
    );

    // Sync position to backend
    const url = `${API_BASE_URL}/api/board-items/${node.id}`;
    const payload = { x: newX, y: newY };
    
    fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const roundTripTime = Date.now() - startTime;
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Position synced for ${node.id} in ${roundTripTime}ms`);
        } else {
          const error = await response.text();
          console.error(`❌ Failed to update position for ${node.id} after ${roundTripTime}ms:`, response.status, error);
        }
      })
      .catch((err) => {
        const roundTripTime = Date.now() - startTime;
        console.error(`❌ Network error after ${roundTripTime}ms:`, err);
      });
  }, [API_BASE_URL, setItems]);

  // Handlers for BoardItem
  const handleUpdateItem = useCallback((id: string, updates: any) => {
    // Update items state
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );

    // Update nodes
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              item: { ...node.data.item, ...updates },
            },
            position: updates.x !== undefined && updates.y !== undefined 
              ? { x: updates.x, y: updates.y }
              : node.position,
          };
        }
        return node;
      })
    );

    // Sync updates to backend
    if (
      updates.height !== undefined ||
      updates.noteData !== undefined ||
      updates.content !== undefined ||
      updates.patientData !== undefined ||
      updates.legalData !== undefined ||
      updates.diagnosticData !== undefined
    ) {
      fetch(`${API_BASE_URL}/api/board-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch((err) => {
        console.error('Failed to sync update to backend:', err);
      });
    }
  }, [setNodes, API_BASE_URL]);

  const handleDeleteItem = useCallback(async (id: string) => {
    // Optimistically update UI
    setItems((prev) => prev.filter((item) => item.id !== id));
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setSelectedItemId((current) => current === id ? null : current);

    // Sync deletion to backend
    try {
      const response = await fetch(`${API_BASE_URL}/api/board-items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete item from backend:', response.status);
      } else {
        console.log(`✅ Item ${id} deleted successfully`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }, [setNodes, API_BASE_URL]);

  const handleSelectItem = useCallback((id: string | null) => {
    setSelectedItemId(id);
    
    // Sync selected item to backend
    if (id) {
      fetch(`${API_BASE_URL}/api/selected-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedItemId: id }),
      }).catch((err) => {
        console.error('Failed to sync selected item:', err);
      });
    }
  }, [API_BASE_URL]);

  // Handle ReactFlow node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Only handle boardItem nodes, not zones or subzones
    if (node.type === 'boardItem') {
      // Don't select subzones
      if (node.id?.includes('subzone-')) {
        console.log('🖱️ Subzone clicked (ignoring):', node.id);
        return;
      }
      console.log('🖱️ Node clicked:', node.id);
      handleSelectItem(node.id);
    }
  }, [handleSelectItem]);

  // Handle canvas click (deselect)
  const onPaneClick = useCallback(() => {
    console.log('🖱️ Canvas clicked - deselecting');
    handleSelectItem(null);
  }, [handleSelectItem]);

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    custom: CustomNode,
    boardItem: CustomBoardNode,
    zone: ZoneNode,
    triageFlow: TriageFlowNode,
    ehrHub: EHRHubNode,
    singleEncounter: SingleEncounterNode,
  }), []);

  // Define custom edge types (none currently used)
  const edgeTypes = useMemo(() => ({}), []);

  // Load items from backend on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        // Try to load from backend API first (API is source of truth)
        let allItems = [...boardItemsData]; // Default to static data
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/board-items`);
          if (response.ok) {
            allItems = await response.json();
            console.log('✅ Loaded items from backend API (source of truth):', allItems.length);
          }
        } catch (apiError) {
          console.log('⚠️ API not available, using static data as fallback');
        }

        setItems(allItems);

        // Create zone nodes
        const zoneNodes: Node[] = zoneConfig.zones.map((zone) => ({
          id: `zone-${zone.name}`,
          type: 'zone',
          position: { x: zone.x, y: zone.y },
          data: { zone },
          draggable: false,
          selectable: false,
          zIndex: -1,
        }));



        // Create item nodes
        const itemNodes: Node[] = allItems.map((item: any) => {
          // Determine node type based on item type and componentType
          let nodeType = 'boardItem';
          if (item.type === 'triageFlow') {
            nodeType = 'triageFlow';
          } else if (item.type === 'ehrHub') {
            nodeType = 'ehrHub';
          } else if (item.type === 'zone') {
            nodeType = 'zone';
          } else if (item.componentType === 'SingleEncounterDocument') {
            nodeType = 'singleEncounter';
          }
          
          // Check if this is a raw data document or subzone
          const isRawDataDocument = item.id?.includes('raw-') || item.componentType === 'RawClinicalNote' || item.componentType === 'ICELabData';
          const isSubzone = item.id?.includes('subzone-') || item.type === 'zone';
          
          // Check if this is a track item or sidebar (non-draggable timeline tracks and sidebars)
          const isTrackItem = item.draggable === false && (
            item.id?.includes('-track-') || 
            item.id?.includes('sidebar-') ||
            item.componentType === 'EncounterTrack' ||
            item.componentType === 'MedicationTrack' ||
            item.componentType === 'LabTrack' ||
            item.componentType === 'RiskTrack' ||
            item.componentType === 'KeyEventsTrack' ||
            item.componentType === 'Sidebar'
          );
          
          // For triageFlow, ehrHub, and zone nodes, use item.data directly (or item for zones)
          const nodeData = (item.type === 'triageFlow' || item.type === 'ehrHub')
            ? item.data 
            : item.type === 'zone'
            ? { ...item.data, zone: { width: item.width, height: item.height, label: item.data?.label }, style: item.style }
            : { 
                item: item,
                isSelected: false,
                onUpdate: handleUpdateItem,
                onDelete: handleDeleteItem,
                onSelect: handleSelectItem,
              };
          
          return {
            id: item.id,
            type: nodeType,
            position: { x: item.x, y: item.y },
            data: nodeData,
            draggable: item.draggable !== false && !isSubzone,
            selectable: item.selectable !== false && item.type !== 'triageFlow' && item.componentType !== 'SingleEncounterDocument' && !isSubzone,
            zIndex: isSubzone ? -2 : (isTrackItem ? -1 : (isRawDataDocument ? 10 : (nodeType === 'singleEncounter' ? 2 : 1))),
            style: item.style,
          };
        });

        // Create consolidator node between nurse-assessment-zone and data-zone
        // Nurse assessment zone: y: -3000 to -1500 (bottom at -1500)
        // Data zone: y: 500 to 2000 (top at 500)
        // Middle point: (-1500 + 500) / 2 = -500
        // Adjust for node height (approx 400px): -500 - 200 = -700
        const dataConsolidatorNode: Node = {
          id: 'data-consolidator',
          type: 'custom',
          position: { x: -1390, y: -700 },
          data: {
            label: 'Clinical Data Integrator',
            content: 'The whole EHR data from all the patient visits are integrated and significant findings are visually represented.',
            color: '#2196F3',
            icon: 'database',
            badge: 'Consolidated'
          },
          draggable: false,
          selectable: false,
          zIndex: 0,
        };

        // Create consolidator node between data-zone and adverse-events-zone
        // Data zone: y: 500 to 2000 (bottom at 2000)
        // Adverse events zone: y: 3500 to 5800 (top at 3500)
        // Middle point: (2000 + 3500) / 2 = 2750
        // Adjust for node height (approx 400px): 2750 - 200 = 2550
        const adverseEventConsolidatorNode: Node = {
          id: 'adverse-event-consolidator',
          type: 'custom',
          position: { x: -1390, y: 2500 },
          data: {
            label: 'Adverse Event Tracker',
            content: 'Tracks and analyses possible adverse events or complications over time.',
            color: '#2196F3',
            icon: 'alert',
            badge: 'Analyzed'
          },
          draggable: false,
          selectable: false,
          zIndex: 0,
        };

        // Create consolidator node between adverse-events-zone and dili-analysis-zone
        // Adverse events zone: y: 3500 to 5800 (bottom at 5800)
        // DILI analysis zone: y: 7000 to 9800 (top at 7000)
        // Middle point: (5800 + 7000) / 2 = 6400
        // Adjust for node height (approx 400px): 6400 - 200 = 6200
        const diliConsolidatorNode: Node = {
          id: 'dili-consolidator',
          type: 'custom',
          position: { x: -1390, y: 6850 },
          data: {
            label: 'DILI Assessment Agent',
            content: 'Reviews reported hepatic events to support structured DILI evaluation.',
            color: '#1E88E5',
            icon: 'stethoscope',
            badge: 'Processing'
          },
          draggable: false,
          selectable: false,
          zIndex: 0,
        };

       
        const reportConsolidatorNode: Node = {
          id: 'report-consolidator',
          type: 'custom',
          position: { x: -1390, y: 12100 },
          data: {
            label: 'Hepatology Expert Agent',
            content: 'Clinical decision point for hepatology referral and patient report generation.',
            color: '#2196F3',
            icon: 'user-check',
            badge: 'Ready',
            showHandles: true,
            handlePosition: 'right'
          },
          draggable: false,
          selectable: false,
          zIndex: 0,
        };

        console.log('🎨 Creating nodes:', {
          zones: zoneNodes.length,
          items: itemNodes.length,
          consolidators: 4,
          total: zoneNodes.length + itemNodes.length + 4
        });
        
        setNodes([...zoneNodes, dataConsolidatorNode, adverseEventConsolidatorNode, diliConsolidatorNode, reportConsolidatorNode, ...itemNodes]);

        // Create edges for triage flow connections
     

        // Create edges for encounter document connections (1→2→3→4→5→6)
        const encounterEdges: Edge[] = [
          {
            id: 'edge-encounter-1-2',
            source: 'dashboard-item-1759906300003-single-encounter-1',
            sourceHandle: 'right',
            target: 'dashboard-item-1759906300004-single-encounter-2',
            targetHandle: 'left',
            type: 'default',
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 3 },
          },
          {
            id: 'edge-encounter-2-3',
            source: 'dashboard-item-1759906300004-single-encounter-2',
            sourceHandle: 'right',
            target: 'dashboard-item-1759906300004-single-encounter-3',
            targetHandle: 'left',
            type: 'default',
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 3 },
          },
          {
            id: 'edge-encounter-3-4',
            source: 'dashboard-item-1759906300004-single-encounter-3',
            sourceHandle: 'right',
            target: 'dashboard-item-1759906300004-single-encounter-4',
            targetHandle: 'left',
            type: 'default',
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 3 },
          },
          {
            id: 'edge-encounter-4-5',
            source: 'dashboard-item-1759906300004-single-encounter-4',
            sourceHandle: 'right',
            target: 'dashboard-item-1759906300004-single-encounter-5',
            targetHandle: 'left',
            type: 'default',
            animated: true,
            style: { stroke: '#f59e0b', strokeWidth: 3 },
          },
          {
            id: 'edge-encounter-5-6',
            source: 'dashboard-item-1759906300004-single-encounter-5',
            sourceHandle: 'right',
            target: 'dashboard-item-1759906300004-single-encounter-6',
            targetHandle: 'left',
            type: 'default',
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 3 },
          },
           {
            id: 'edge-encounter-5-6',
            source: 'dashboard-item-1759906300004-single-encounter-6',
            sourceHandle: 'right',
            target: 'dashboard-item-1759906300004-single-encounter-7',
            targetHandle: 'left',
            type: 'default',
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 3 },
          },
        ];

        // Create edges for EHR hub to sub-zone connections dynamically based on hub colors
        const ehrHubItems = allItems.filter((item: any) => item.type === 'ehrHub');
        const ehrHubEdges: Edge[] = ehrHubItems
          .map((hub: any) => {
            const hubId = hub.id;
            const hubName = hubId.replace('ehr-hub-', '');
            const subzoneId = `subzone-${hubName}`;
            const hubColor = hub.data?.color || '#f59e0b'; // Default color if not specified
            
            // Check if corresponding subzone exists
            const subzoneExists = allItems.some((item: any) => item.id === subzoneId);
            
            if (!subzoneExists) {
              return null;
            }
            
            return {
              id: `edge-${hubName}-to-zone`,
              source: hubId,
              sourceHandle: 'bottom',
              target: subzoneId,
              targetHandle: 'top',
              type: 'default',
              animated: true,
              style: { stroke: hubColor, strokeWidth: 4 },
            } as Edge;
          })
          .filter((edge): edge is Edge => edge !== null);
        
        // Create edges for zone consolidator connections
        const consolidatorEdges: Edge[] = [
          // Raw EHR Data → Nurse Assessment Zone → Data Consolidator → Data Zone
          {
            id: 'edge-raw-ehr-to-nurse-assessment',
            source: 'zone-raw-ehr-data-zone',
            sourceHandle: 'bottom',
            target: 'zone-nurse-assessment-zone',
            targetHandle: 'top',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 6 },
          },
          {
            id: 'edge-nurse-assessment-to-consolidator',
            source: 'zone-nurse-assessment-zone',
            sourceHandle: 'bottom',
            target: 'data-consolidator',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 6 },
          },
          {
            id: 'edge-consolidator-to-data-zone',
            source: 'data-consolidator',
            target: 'zone-data-zone',
            targetHandle: 'top',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 6 },
          },
          // Data Zone → Adverse Event Analyzer → Adverse Events Zone
          {
            id: 'edge-data-zone-to-adverse-analyzer',
            source: 'zone-data-zone',
            sourceHandle: 'bottom',
            target: 'adverse-event-consolidator',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 6 },
          },
          {
            id: 'edge-adverse-analyzer-to-adverse-zone',
            source: 'adverse-event-consolidator',
            target: 'zone-adv-event-zone',
            targetHandle: 'top',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 6 },
          },
          // Adverse Events Zone → DILI Consolidator → DILI Analysis Zone
          {
            id: 'edge-adverse-zone-to-dili-consolidator',
            source: 'zone-adv-event-zone',
            sourceHandle: 'bottom',
            target: 'dili-consolidator',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 6 },
          },
          {
            id: 'edge-dili-consolidator-to-dili-zone',
            source: 'dili-consolidator',
            target: 'zone-dili-analysis-zone',
            targetHandle: 'top',
            type: 'default',
            animated: true,
            style: { stroke: '#1E88E5', strokeWidth: 6 },
          },
          // DILI Analysis Zone → Report Consolidator → Patient Report Zone
          {
            id: 'edge-dili-to-report-consolidator',
            source: 'zone-dili-analysis-zone',
            sourceHandle: 'bottom',
            target: 'report-consolidator',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 6 },
          },
          {
            id: 'edge-report-consolidator-to-patient-report',
            source: 'report-consolidator',
            target: 'zone-report-zone',
            targetHandle: 'top',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 6 },
          },
          // Report Consolidator → Review Report Button
          {
            id: 'edge-consolidator-to-review-button',
            source: 'report-consolidator',
            sourceHandle: 'right',
            target: 'report-hub-review-button',
            type: 'default',
            animated: true,
            style: { stroke: '#4CAF50', strokeWidth: 4 },
          },
          // Report Consolidator → Export Report Button
          {
            id: 'edge-consolidator-to-export-button',
            source: 'report-consolidator',
            sourceHandle: 'right',
            target: 'report-hub-export-button',
            type: 'default',
            animated: true,
            style: { stroke: '#FF9800', strokeWidth: 4 },
          },
          // Report Consolidator → Share Board to Hepato Button
          {
            id: 'edge-consolidator-to-share-hepato',
            source: 'report-consolidator',
            sourceHandle: 'right',
            target: 'dashboard-item-share-board-to-hepato',
            targetHandle: 'left',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 4 },
          },
          // Report Consolidator → Decline Hepato Referral Button
          {
            id: 'edge-consolidator-to-decline-hepato',
            source: 'report-consolidator',
            sourceHandle: 'right',
            target: 'dashboard-item-hepato-referal-decline',
            targetHandle: 'left',
            type: 'default',
            animated: true,
            style: { stroke: '#F44336', strokeWidth: 4 },
          },
          // Keep original share button connection for backward compatibility
          {
            id: 'edge-dili-to-share-button',
            source: 'zone-dili-analysis-zone',
            sourceHandle: 'bottom',
            target: 'dashboard-item-share-to-hepato-button',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 3, strokeDasharray: '5,5' },
          },
          {
            id: 'edge-share-button-to-patient-report',
            source: 'dashboard-item-share-to-hepato-button',
            target: 'zone-report-zone',
            targetHandle: 'top',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 3, strokeDasharray: '5,5' },
          },
          // Patient Report Zone → Push to EHR Button
          {
            id: 'edge-patient-report-to-push-ehr',
            source: 'zone-patient-report-zone',
            sourceHandle: 'bottom',
            target: 'dashboard-item-push-to-ehr-new',
            type: 'default',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 6 },
          },
          // Push to EHR Button → Accept Button
          {
            id: 'edge-push-ehr-to-accept',
            source: 'dashboard-item-push-to-ehr-new',
            target: 'dashboard-item-accept-button',
            type: 'default',
            animated: true,
            style: { stroke: '#4CAF50', strokeWidth: 6 },
          },
          // Push to EHR Button → Reject Button
          {
            id: 'edge-push-ehr-to-reject',
            source: 'dashboard-item-push-to-ehr-new',
            target: 'dashboard-item-reject-button',
            type: 'default',
            animated: true,
            style: { stroke: '#F44336', strokeWidth: 6 },
          },
          // Raw EHR Data → Task Management Zone (direct connection with curved bezier)
          {
            id: 'edge-raw-ehr-to-task-zone',
            source: 'zone-raw-ehr-data-zone',
            sourceHandle: 'right',
            target: 'zone-task-management-zone',
            targetHandle: 'left',
            type: 'bezier',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 4 },
          },
          // Raw EHR Data → Retrieved Data Zone (direct connection with curved bezier)
          {
            id: 'edge-raw-ehr-to-retrieved-zone',
            source: 'zone-raw-ehr-data-zone',
            sourceHandle: 'right',
            target: 'zone-retrieved-data-zone',
            targetHandle: 'left',
            type: 'bezier',
            animated: true,
            style: { stroke: '#2196F3', strokeWidth: 4 },
          },
        ];
        
        setEdges([ ...encounterEdges, ...ehrHubEdges, ...consolidatorEdges, ...chronomedDynamicEdges]);
      } catch (error) {
        console.error('❌ Error loading items:', error);
      }
    };

    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update nodes and edges when Chronomed data changes (e.g. toggling connections)
  // Update nodes and edges when Chronomed data changes (e.g. toggling connections)
  useEffect(() => {
    setNodes((currentNodes) => {
        return currentNodes.map(node => {
            // Update showHandles for track nodes
            if (['encounter-track-1', 'medication-track-1', 'lab-track-1', 'risk-track-1', 'key-events-track-1'].includes(node.id)) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        item: {
                            ...node.data.item,
                            showHandles: showConnections,
                            content: {
                                ...node.data.item?.content,
                                props: {
                                    ...node.data.item?.content?.props,
                                    showHandles: showConnections,
                                    onHandleHover: setHoveredHandle
                                }
                            }
                        }
                    }
                };
            }
            return node;
        });
    });

    setEdges((currentEdges) => {
        // Remove old chronomed edges (identified by id starting with 'e-')
        const nonChronomedEdges = currentEdges.filter(e => !e.id.startsWith('e-'));
        return [...nonChronomedEdges, ...chronomedDynamicEdges];
    });
  }, [chronomedDynamicEdges, showConnections, displayedHandle, setNodes, setEdges]);

  // SSE connection for real-time updates
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectDelay = 30000;

    const connect = () => {
      try {
        const sseUrl = `${API_BASE_URL}/api/events`;
        console.log(`🔌 Connecting to SSE:`, sseUrl);
        es = new EventSource(sseUrl);

        es.addEventListener('connected', (event: any) => {
          console.log('✅ Connected to SSE');
          reconnectAttempts = 0;
        });

        es.addEventListener('ping', (event: any) => {
          console.log(' SSE heartbeat');
        });

        es.addEventListener('focus', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            console.log('🎯 Focus event received:', data);
            const itemId = data.objectId || data.itemId;
            if (itemId) {
              handleSelectItem(itemId);
              setTimeout(() => {
                centerOnItem(itemId, data.focusOptions?.zoom || 0.8, data.focusOptions?.duration || 1200);
              }, 100);
            }
          } catch (err) {
            console.error('❌ Error handling focus event:', err);
          }
        });

        es.addEventListener('new-item', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            const newItem = data.item;
            if (!newItem) return;

            console.log('📦 New item received:', newItem.id);

            // Add to items state
            setItems((prev) => {
              if (prev.some((it) => it.id === newItem.id)) return prev;
              return [...prev, newItem];
            });

            // Add to nodes
            setNodes((nds) => {
              if (nds.some((n) => n.id === newItem.id)) return nds;
              
              const newNode: Node = {
                id: newItem.id,
                type: 'boardItem',
                position: { x: newItem.x, y: newItem.y },
                data: {
                  item: newItem,
                  isSelected: false,
                  onUpdate: handleUpdateItem,
                  onDelete: handleDeleteItem,
                  onSelect: handleSelectItem,
                },
                draggable: true,
                selectable: true,
                zIndex: 1,
              };

              return [...nds, newNode];
            });

            // Auto-focus on new item - use longer delay to ensure node is rendered
            setTimeout(() => {
              if (!reactFlowInstance.current) {
                console.warn('⚠️ ReactFlow instance not ready for focus');
                return;
              }

              const zoomLevel = newItem.type === 'doctor-note' ? 1.0 : 0.8;
              
              // Calculate center position directly
              const itemWidth = newItem.width || 200;
              const itemHeight = newItem.height === 'auto' ? 400 : (newItem.height || 200);
              const x = newItem.x + itemWidth / 2;
              const y = newItem.y + itemHeight / 2;

              console.log(`🎯 Auto-focusing on new item ${newItem.id} at (${x}, ${y}) with zoom ${zoomLevel}`);
              reactFlowInstance.current.setCenter(x, y, { zoom: zoomLevel, duration: 1200 });
            }, 800);
          } catch (err) {
            console.error('❌ Error handling new-item event:', err);
          }
        });

        es.addEventListener('item-updated', (event: any) => {
          try {
            const receiveTime = Date.now();
            const data = JSON.parse(event.data);
            const updatedItem = data.item;
            if (!updatedItem) return;

            console.log(`🔄 SSE received at ${receiveTime}: ${updatedItem.id} → (${updatedItem.x}, ${updatedItem.y})`);

            // Update items state
            setItems((prev) => {
              return prev.map((item) => 
                item.id === updatedItem.id ? updatedItem : item
              );
            });

            // Update nodes (including position)
            setNodes((nds) => {
              return nds.map((node) => {
                if (node.id === updatedItem.id) {
                  return {
                    ...node,
                    position: { x: updatedItem.x, y: updatedItem.y },
                    data: {
                      ...node.data,
                      item: updatedItem,
                    },
                  };
                }
                return node;
              });
            });
            
            const processTime = Date.now() - receiveTime;
            console.log(`⚡ SSE processed in ${processTime}ms`);
          } catch (err) {
            console.error('❌ Error handling item-updated event:', err);
          }
        });

        es.addEventListener('easl-query', (event: any) => {
          try {
            const { query, metadata } = JSON.parse(event.data);
            console.log('📨 EASL query event received:', query);
            sendQueryToEASL(query, metadata);
          } catch (err) {
            console.error('❌ Error handling easl-query event:', err);
          }
        });

        es.addEventListener('notification', (event: any) => {
          try {
            const { message, type } = JSON.parse(event.data);
            console.log('📢 Notification event received:', { message, type });
            setAlertModal({
              isOpen: true,
              message: message,
              type: type || 'info'
            });
          } catch (err) {
            console.error('❌ Error handling notification event:', err);
          }
        });

        es.addEventListener('board-reloaded', async (event: any) => {
          try {
            const data = JSON.parse(event.data);
            console.log('🔄 Board reloaded event received:', data.message);
            console.log('🔃 Fetching updated board items...');
            
            // Fetch fresh data from Redis without page reload
            const response = await fetch(`${API_BASE_URL}/api/board-items`);
            if (response.ok) {
              const freshItems = await response.json();
              console.log(`✅ Loaded ${freshItems.length} fresh items from server`);
              setItems(freshItems);
              // The useEffect that watches 'items' will rebuild nodes and edges
            } else {
              console.error('❌ Failed to fetch fresh board items');
            }
          } catch (err) {
            console.error('❌ Error handling board-reloaded event:', err);
          }
        });

        es.onerror = (error) => {
          console.error('❌ SSE connection error:', error);
          es?.close();
          
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), maxReconnectDelay);
          console.log(`🔄 Reconnecting in ${delay / 1000}s...`);
          reconnectTimeout = setTimeout(connect, delay);
        };

        es.onopen = () => {
          console.log('🌐 SSE connection opened');
          reconnectAttempts = 0;
        };
      } catch (error) {
        console.error('❌ Error creating SSE connection:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (es) {
        console.log('🔌 Closing SSE connection');
        es.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  // Center on item function for ReactFlow
  const centerOnItem = useCallback((itemId: string, finalZoom = 0.8, duration = 1200) => {
    if (!reactFlowInstance.current) {
      console.warn('⚠️ ReactFlow instance not ready');
      return;
    }

    // Try to find node first
    let node = nodes.find((n) => n.id === itemId);
    let item = items.find((i) => i.id === itemId);

    // If node not found in state, try to get it from ReactFlow directly
    if (!node && reactFlowInstance.current.getNode) {
      node = reactFlowInstance.current.getNode(itemId);
    }

    if (!node) {
      console.warn(`⚠️ Node not found: ${itemId}`);
      return;
    }

    // Get item dimensions
    let itemWidth = 200;
    let itemHeight = 200;

    if (item) {
      itemWidth = item.width || 200;
      itemHeight = item.height === 'auto' ? 400 : (item.height || 200);
    } else if (node.data?.item) {
      // Get dimensions from node data
      itemWidth = node.data.item.width || 200;
      itemHeight = node.data.item.height === 'auto' ? 400 : (node.data.item.height || 200);
    }

    // Calculate center position
    const x = node.position.x + itemWidth / 2;
    const y = node.position.y + itemHeight / 2;

    // Animate to center
    reactFlowInstance.current.setCenter(x, y, { zoom: finalZoom, duration });
    
    console.log(`🎯 Centered on item ${itemId} at (${x}, ${y}) with zoom ${finalZoom}`);
  }, [nodes, items]);

  // Send query to EASL iframe
  const sendQueryToEASL = useCallback((query: string, metadata?: any) => {
    const easlIframe = document.querySelector('[data-item-id="iframe-item-easl-interface"] iframe') as HTMLIFrameElement;
    
    if (!easlIframe || !easlIframe.contentWindow) {
      console.error('❌ EASL iframe not found');
      return;
    }

    const message = {
      type: 'CANVAS_QUERY',
      payload: {
        query: query,
        timestamp: new Date().toISOString(),
        metadata: metadata || {}
      }
    };

    easlIframe.contentWindow.postMessage(message, 'https://easl-board.vercel.app');
    console.log('📤 Sent query to EASL:', query);
  }, []);

  // Center on sub-element within an item
  const centerOnSubElement = useCallback((itemId: string, subElementSelector: string, finalZoom = 1.2, duration = 1200) => {
    const node = nodes.find((n) => n.id === itemId);
    if (!node || !reactFlowInstance.current) return;

    // Find the sub-element in the DOM
    const subElement = document.querySelector(`[data-focus-id="${subElementSelector}"]`);
    if (!subElement) {
      console.warn(`⚠️ Sub-element not found: ${subElementSelector}, centering on parent item`);
      centerOnItem(itemId, finalZoom, duration);
      return;
    }

    // Get sub-element bounding rect
    const subRect = subElement.getBoundingClientRect();
    
    // Calculate center of sub-element in world coordinates
    // This is approximate - ReactFlow handles its own coordinate system
    const x = node.position.x + (subRect.width / 2);
    const y = node.position.y + (subRect.height / 2);

    reactFlowInstance.current.setCenter(x, y, { zoom: finalZoom, duration });
    
    // Add highlight to sub-element
    setTimeout(() => {
      subElement.classList.add('focus-highlighted');
      setTimeout(() => {
        subElement.classList.remove('focus-highlighted');
      }, duration);
    }, 100);

    console.log(`🎯 Centered on sub-element ${subElementSelector} in item ${itemId}`);
  }, [nodes, centerOnItem]);

  // Place item at viewport center
  const placeItemAtViewportCenter = useCallback(async (itemId: string) => {
    if (!reactFlowInstance.current) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Get current viewport center
    const viewport = reactFlowInstance.current.getViewport();
    const bounds = reactFlowInstance.current.getBounds();
    
    // Calculate center in world coordinates
    const centerX = (bounds.width / 2 - viewport.x) / viewport.zoom;
    const centerY = (bounds.height / 2 - viewport.y) / viewport.zoom;

    // Calculate new position (center item at viewport center)
    const newX = Math.round(centerX - (item.width || 0) / 2);
    const newY = Math.round(centerY - (item.height || 0) / 2);

    // Update item
    handleUpdateItem(itemId, { x: newX, y: newY });

    console.log(`📍 Placed item ${itemId} at viewport center (${newX}, ${newY})`);
  }, [items, handleUpdateItem]);

  // Get viewport center in world coordinates
  const getViewportCenterWorld = useCallback(() => {
    if (!reactFlowInstance.current) return null;

    const viewport = reactFlowInstance.current.getViewport();
    const bounds = reactFlowInstance.current.getBounds();
    
    const x = (bounds.width / 2 - viewport.x) / viewport.zoom;
    const y = (bounds.height / 2 - viewport.y) / viewport.zoom;
    
    return { x, y, zoom: viewport.zoom };
  }, []);

  // Add new note function
  const handleAddNote = useCallback(async () => {
    setShowAddMenu(false); // Close menu
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/doctor-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Note created:', data.item.id);
        
        // Note will be added via SSE event
      }
    } catch (error) {
      console.error('❌ Failed to create note:', error);
    }
  }, [API_BASE_URL]);

  // Helper function to compress and upload image
  const compressAndUploadImage = useCallback(async (file: File, title: string) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Calculate dimensions (max 1920px width/height)
          let width = img.width;
          let height = img.height;
          const maxSize = 1920;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression (0.8 quality for JPEG)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          
          console.log(`📦 Compressed image: ${(file.size / 1024).toFixed(0)}KB → ${(compressedBase64.length / 1024).toFixed(0)}KB`);

          try {
            // Upload to API
            const response = await fetch(`${API_BASE_URL}/api/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageData: compressedBase64,
                title: title,
                width: Math.min(width, 400),
                height: Math.min(height, 300)
              })
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ Image created:', data.item.id);
              resolve();
            } else {
              const error = await response.text();
              console.error('❌ Failed to create image:', error);
              reject(new Error('Failed to create image'));
            }
          } catch (error) {
            console.error('❌ Upload error:', error);
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, [API_BASE_URL]);

  // Mute/Unmute agent function
  const handleToggleMute = useCallback(async () => {
    try {
      console.log(`🎤 ${isMuted ? 'Unmuting' : 'Muting'} agent...`);
      
      const response = await fetch('https://api.medforce-ai.com/mute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle mute');
      }

      const result = await response.json();
      console.log('✅ Mute toggle response:', result);
      
      // Toggle the mute state
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('❌ Failed to toggle mute:', error);
      setAlertModal({
        isOpen: true,
        message: 'Failed to toggle mute. Please try again.',
        type: 'error'
      });
    }
  }, [isMuted]);

  // Add image function
  const handleAddImage = useCallback(() => {
    setShowAddMenu(false); // Close menu
    
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        await compressAndUploadImage(file, file.name);
      } catch (error) {
        console.error('❌ Failed to upload image:', error);
        setAlertModal({
          isOpen: true,
          message: 'Failed to upload image. Please try a smaller file.',
          type: 'error'
        });
      }
    };
    
    input.click();
  }, [API_BASE_URL, compressAndUploadImage]);

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Check if item is an image
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          console.log('📋 Pasting image from clipboard');
          
          try {
            await compressAndUploadImage(file, 'Pasted Image');
          } catch (error) {
            console.error('❌ Failed to paste image:', error);
            setAlertModal({
              isOpen: true,
              message: 'Failed to paste image. Please try again.',
              type: 'error'
            });
          }
          
          break; // Only handle first image
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [compressAndUploadImage]);

  // Handle drag and drop for images
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      // Process all dropped image files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is an image
        if (file.type.startsWith('image/')) {
          console.log('🖼️ Dropped image:', file.name);
          
          try {
            await compressAndUploadImage(file, file.name);
          } catch (error) {
            console.error('❌ Failed to upload dropped image:', error);
          }
        }
      }
    };

    // Add listeners to the document
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [compressAndUploadImage]);

  // Delete selected item function
  const handleDeleteSelectedItem = useCallback(async () => {
    if (!selectedItemId) return;
    
    try {
      console.log(`🗑️ Deleting selected item: ${selectedItemId}`);
      setShowResetModal(false);
      setIsDeleting(true);
      
      // Delete the selected item
      const response = await fetch(`${API_BASE_URL}/api/board-items/${selectedItemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      console.log(`✅ Item deleted: ${selectedItemId}`);
      
      // Update state - remove deleted item
      setItems((prev) => prev.filter((item) => item.id !== selectedItemId));
      setNodes((nds) => nds.filter((node) => node.id !== selectedItemId));
      setSelectedItemId(null);
      
      // Show success result
      setIsDeleting(false);
      setDeleteResult({
        success: true,
        deletedCount: 1,
        remainingCount: items.length - 1
      });
      setShowResultModal(true);
      
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      setIsDeleting(false);
      setDeleteResult({
        success: false,
        deletedCount: 0,
        error: 'Failed to delete item. Check console for details.'
      });
      setShowResultModal(true);
    }
  }, [API_BASE_URL, selectedItemId, items]);

  // Reset board function
  const handleResetBoard = useCallback(async () => {
    try {
      console.log('🗑️ Resetting board...');
      setShowResetModal(false);
      setIsDeleting(true);
      
      // Filter items to delete (exclude 'raw' and 'single-encounter' items, but include images)
      const itemsToDelete = items.filter((item: any) => {
        const id = item.id || '';
        if (id.includes('raw') || id.includes('single-encounter')) {
          return false;
        }
        return (
          id.startsWith('enhanced') ||
          id.startsWith('item') ||
          id.startsWith('doctor-note') ||
          id.startsWith('image-')
        );
      });
      
      console.log(`🗑️ Found ${itemsToDelete.length} items to delete`);
      
      let deletedCount = 0;
      let remainingCount = items.length;
      
      // Delete items if there are any
      if (itemsToDelete.length > 0) {
        const itemIds = itemsToDelete.map(item => item.id);
        
        // Use batch delete endpoint
        const response = await fetch(`${API_BASE_URL}/api/board-items/batch-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemIds }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to batch delete items');
        }
        
        const result = await response.json();
        console.log(`✅ Batch delete complete:`, result);
        deletedCount = result.deletedCount;
        remainingCount = result.remainingCount;
        
        // Update state - remove deleted items but keep zones
        const deletedIdsSet = new Set(itemIds);
        setItems((prev) => prev.filter((item) => !deletedIdsSet.has(item.id)));
        setNodes((nds) => nds.filter((node) => {
          // Keep zones (they start with 'zone-')
          if (node.id.startsWith('zone-')) return true;
          // Keep items that weren't deleted
          return !deletedIdsSet.has(node.id);
        }));
      } else {
        console.log('⚠️ No dynamic items to delete, but will still reset positions and EASL history');
      }
      
      // Reset EASL conversation history
      try {
        const easlResetResponse = await fetch(`${API_BASE_URL}/api/easl-reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (easlResetResponse.ok) {
          console.log(`✅ EASL conversation history reset on backend`);
          
          // Also send message to EASL iframe to clear its UI
          const easlIframe = document.querySelector('[data-item-id="iframe-item-easl-interface"] iframe') as HTMLIFrameElement;
          if (easlIframe && easlIframe.contentWindow) {
            easlIframe.contentWindow.postMessage({
              type: 'CLEAR_CHATS',
              payload: { timestamp: new Date().toISOString() }
            }, 'https://easl-board.vercel.app');
            console.log('📤 Sent CLEAR_CHATS message to EASL iframe');
          } else {
            console.warn('⚠️ EASL iframe not found, UI will not be cleared');
          }
        }
      } catch (easlError) {
        console.warn('⚠️ Error resetting EASL conversation history:', easlError);
      }
      
      // Reload board items from static file (resets Redis to default state)
      try {
        console.log('🔄 Reloading board items from static file...');
        const reloadResponse = await fetch(`${API_BASE_URL}/api/reload-board-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (reloadResponse.ok) {
          const reloadResult = await reloadResponse.json();
          console.log(`✅ Board items reloaded from static file: ${reloadResult.itemCount} items`);
          
          // Immediately fetch the reloaded items to update local state
          console.log('🔄 Fetching reloaded items...');
          const fetchResponse = await fetch(`${API_BASE_URL}/api/board-items`);
          if (fetchResponse.ok) {
            const reloadedItems = await fetchResponse.json();
            console.log(`✅ Fetched ${reloadedItems.length} reloaded items`);
            
            // Update local state with reloaded items
            setItems(reloadedItems);
            
            // Update nodes with reloaded positions
            const itemNodes: Node[] = reloadedItems.map((item: any) => {
              let nodeType = 'boardItem';
              if (item.type === 'triageFlow') {
                nodeType = 'triageFlow';
              } else if (item.type === 'ehrHub') {
                nodeType = 'ehrHub';
              } else if (item.type === 'zone') {
                nodeType = 'zone';
              } else if (item.componentType === 'SingleEncounterDocument') {
                nodeType = 'singleEncounter';
              }
              
              const isRawDataDocument = item.id?.includes('raw-') || item.componentType === 'RawClinicalNote' || item.componentType === 'ICELabData';
              const isSubzone = item.id?.includes('subzone-') || item.type === 'zone';
              
              // Check if this is a track item or sidebar (non-draggable timeline tracks and sidebars)
              const isTrackItem = item.draggable === false && (
                item.id?.includes('-track-') || 
                item.id?.includes('sidebar-') ||
                item.componentType === 'EncounterTrack' ||
                item.componentType === 'MedicationTrack' ||
                item.componentType === 'LabTrack' ||
                item.componentType === 'RiskTrack' ||
                item.componentType === 'KeyEventsTrack' ||
                item.componentType === 'Sidebar'
              );
              
              const nodeData = (item.type === 'triageFlow' || item.type === 'ehrHub')
                ? item.data 
                : item.type === 'zone'
                ? { ...item.data, zone: { width: item.width, height: item.height, label: item.data?.label }, style: item.style }
                : { 
                    item: item,
                    isSelected: false,
                    onUpdate: handleUpdateItem,
                    onDelete: handleDeleteItem,
                    onSelect: handleSelectItem,
                  };
              
              return {
                id: item.id,
                type: nodeType,
                position: { x: item.x, y: item.y },
                data: nodeData,
                draggable: item.draggable !== false && !isSubzone,
                selectable: item.selectable !== false && item.type !== 'triageFlow' && item.componentType !== 'SingleEncounterDocument' && !isSubzone,
                zIndex: isSubzone ? -2 : (isTrackItem ? -1 : (isRawDataDocument ? 10 : (nodeType === 'singleEncounter' ? 2 : 1))),
                style: item.style,
              };
            });
            
            // Update nodes while keeping zones and consolidators
            setNodes((prevNodes) => {
              const zoneNodes = prevNodes.filter(n => n.type === 'zone');
              const consolidatorNodes = prevNodes.filter(n => n.id.includes('consolidator') || n.id.includes('data-consolidator'));
              return [...zoneNodes, ...consolidatorNodes, ...itemNodes];
            });
            
            console.log('✅ Local state updated with reloaded items');
          } else {
            console.warn('⚠️ Failed to fetch reloaded items');
          }
        } else {
          console.warn('⚠️ Failed to reload board items from static file');
        }
      } catch (reloadError) {
        console.warn('⚠️ Error reloading board items:', reloadError);
      }
      
      // Show success result
      setIsDeleting(false);
      setDeleteResult({
        success: true,
        deletedCount: deletedCount,
        remainingCount: remainingCount
      });
      setShowResultModal(true);
      
    } catch (error) {
      console.error('❌ Error resetting board:', error);
      setIsDeleting(false);
      setDeleteResult({
        success: false,
        deletedCount: 0,
        error: 'Failed to reset board. Check console for details.'
      });
      setShowResultModal(true);
    }
  }, [API_BASE_URL, items]);

  // Listen for responses from EASL iframe
  useEffect(() => {
    const handleEASLResponse = (event: MessageEvent) => {
      // Security check
      if (event.origin !== 'https://easl-board.vercel.app') {
        return;
      }

      if (event.data?.type === 'EASL_RESPONSE') {
        const { response, status, timestamp } = event.data.payload;
        console.log('📥 Received response from EASL:', response);
        
        // Handle clear chats response
        if (response.success !== undefined) {
          if (response.success) {
            console.log('✅ Chat history cleared successfully');
          } else {
            console.error('❌ Failed to clear chats:', response.error);
           
          }
        }
      }
    };

    window.addEventListener('message', handleEASLResponse);
    
    return () => {
      window.removeEventListener('message', handleEASLResponse);
    };
  }, []);

  // Update nodes when selection changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        // Don't modify zone nodes
        if (node.type === 'zone') return node;
        
        // Update isSelected in data for boardItem nodes
        return {
          ...node,
          data: {
            ...node.data,
            isSelected: node.id === selectedItemId,
          },
          // Add ReactFlow's selected property for visual feedback
          selected: node.id === selectedItemId,
        };
      })
    );
  }, [selectedItemId, setNodes]);

  // Expose functions globally
  useEffect(() => {
    (window as any).centerOnItem = centerOnItem;
    (window as any).centerOnSubElement = centerOnSubElement;
    (window as any).sendQueryToEASL = sendQueryToEASL;
    (window as any).placeItemAtViewportCenter = placeItemAtViewportCenter;
    (window as any).getViewportCenterWorld = getViewportCenterWorld;
    (window as any).setHoveredHandle = setHoveredHandle;
    (window as any).displayedHandle = displayedHandle;
    (window as any).storyHandles = storyHandles;
    (window as any).activeScenarioHandles = activeScenarioHandles;
    (window as any).getSelectedItem = () => {
      if (!selectedItemId) return null;
      return items.find((item) => item.id === selectedItemId) || null;
    };
  }, [centerOnItem, centerOnSubElement, sendQueryToEASL, placeItemAtViewportCenter, getViewportCenterWorld, selectedItemId, items, setHoveredHandle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        // Reset viewport
        if (reactFlowInstance.current) {
          reactFlowInstance.current.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
        }
      }
      if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        // Focus on first item
        if (items.length > 0) {
          centerOnItem(items[0].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [items, centerOnItem]);

  // Spacebar listener for panning mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        // Don't trigger if user is typing in an input
        if (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable
        ) {
          return;
        }
        
        // Only prevent default if we're not in an input (prevents page scroll)
        e.preventDefault(); 
        if (!isSpacePressed) {
          setIsSpacePressed(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  console.log('Canvas2 rendering with nodes:', nodes.length);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      
      {/* Back to Clinic Button */}
      <button
        onClick={() => window.location.href = '/'}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#64748b',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
          e.currentTarget.style.color = '#475569';
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.color = '#64748b';
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
        }}
      >
        <span style={{ fontSize: '16px' }}>←</span>
        Back to Clinic
      </button>
      
      <ReactFlowWrapper sidebarOpen={showAgentChat} isPanning={isSpacePressed}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={(instance) => {
            reactFlowInstance.current = instance;
            console.log('✅ ReactFlow instance initialized');
          }}
          fitView
          minZoom={0.01}
          maxZoom={4}
          defaultViewport={{ x: -200, y: -1200, zoom: 0.25 }}
          proOptions={{ hideAttribution: true }}
          selectNodesOnDrag={false}
          connectOnClick={false}
          nodesDraggable={!isSpacePressed}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          panOnScroll={false}
          zoomOnScroll={true}
        >
          <Controls showInteractive={false} />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={32} 
            size={0.8}
            color="rgba(2, 136, 209, 0.08)"
          />
         
        </ReactFlow>
      </ReactFlowWrapper>
      
      {/* Control Buttons */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 1000,
      }}>
        {/* Add Menu Dropdown */}
        {showAddMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              right: '0',
              marginBottom: '12px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              minWidth: '180px',
              zIndex: 1001,
              animation: 'slideUp 0.2s ease',
            }}
          >
            <button
              onClick={handleAddNote}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#1e293b',
                fontWeight: 500,
                transition: 'background 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <FileText size={18} style={{ color: '#64748b' }} />
              <span>Add Note</span>
            </button>
            <button
              onClick={handleAddImage}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#1e293b',
                fontWeight: 500,
                transition: 'background 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ImageIcon size={18} style={{ color: '#64748b' }} />
              <span>Add Image</span>
            </button>
          </div>
        )}

        {/* Plus Button */}
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          style={{
            width: '52px',
            height: '52px',
            border: '2px solid rgba(2, 136, 209, 0.2)',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(2, 136, 209, 0.3)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Add Item"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 136, 209, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(2, 136, 209, 0.3)';
          }}
        >
          <Plus size={22} style={{ 
            transform: showAddMenu ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} />
        </button>

        {/* Mute/Unmute Button */}
        <button
          onClick={handleToggleMute}
          style={{
            width: '52px',
            height: '52px',
            border: `2px solid ${isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            borderRadius: '14px',
            background: isMuted ? 'rgba(254, 226, 226, 0.5)' : 'rgba(220, 252, 231, 0.5)',
            cursor: 'pointer',
            boxShadow: isMuted ? '0 4px 16px rgba(239, 68, 68, 0.15)' : '0 4px 16px rgba(34, 197, 94, 0.15)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isMuted ? 'Unmute Agent' : 'Mute Agent'}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            e.currentTarget.style.boxShadow = isMuted 
              ? '0 6px 20px rgba(239, 68, 68, 0.3)' 
              : '0 6px 20px rgba(34, 197, 94, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = isMuted 
              ? '0 4px 16px rgba(239, 68, 68, 0.15)' 
              : '0 4px 16px rgba(34, 197, 94, 0.15)';
          }}
        >
          {isMuted ? (
            <MicOff size={22} style={{ color: '#3b82f6' }} />
          ) : (
            <Mic size={22} style={{ color: '#22c55e' }} />
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            // Check if selected item is a static item
            if (selectedItemId) {
              const selectedItem = items.find((item: any) => item.id === selectedItemId);
              if (selectedItem) {
                const id = selectedItem.id || '';
                const isStaticItem = id.includes('raw') || id.includes('single-encounter') || 
                                    (!id.startsWith('enhanced') && !id.startsWith('item') && 
                                     !id.startsWith('doctor-note') && !id.startsWith('image-'));
                if (isStaticItem) {
                  // Don't open modal for static items
                  return;
                }
              }
            }
            setShowResetModal(true);
          }}
          disabled={(() => {
            if (!selectedItemId) return false;
            const selectedItem = items.find((item: any) => item.id === selectedItemId);
            if (!selectedItem) return false;
            const id = selectedItem.id || '';
            return id.includes('raw') || id.includes('single-encounter') || 
                   (!id.startsWith('enhanced') && !id.startsWith('item') && 
                    !id.startsWith('doctor-note') && !id.startsWith('image-'));
          })()}
          style={{
            width: '52px',
            height: '52px',
            border: '2px solid rgba(2, 136, 209, 0.15)',
            borderRadius: '14px',
            background: (() => {
              if (!selectedItemId) return 'white';
              const selectedItem = items.find((item: any) => item.id === selectedItemId);
              if (!selectedItem) return 'white';
              const id = selectedItem.id || '';
              const isStaticItem = id.includes('raw') || id.includes('single-encounter') || 
                                  (!id.startsWith('enhanced') && !id.startsWith('item') && 
                                   !id.startsWith('doctor-note') && !id.startsWith('image-'));
              return isStaticItem ? '#f5f5f5' : 'white';
            })(),
            color: (() => {
              if (!selectedItemId) return '#0288d1';
              const selectedItem = items.find((item: any) => item.id === selectedItemId);
              if (!selectedItem) return '#0288d1';
              const id = selectedItem.id || '';
              const isStaticItem = id.includes('raw') || id.includes('single-encounter') || 
                                  (!id.startsWith('enhanced') && !id.startsWith('item') && 
                                   !id.startsWith('doctor-note') && !id.startsWith('image-'));
              return isStaticItem ? '#9e9e9e' : '#0288d1';
            })(),
            cursor: (() => {
              if (!selectedItemId) return 'pointer';
              const selectedItem = items.find((item: any) => item.id === selectedItemId);
              if (!selectedItem) return 'pointer';
              const id = selectedItem.id || '';
              const isStaticItem = id.includes('raw') || id.includes('single-encounter') || 
                                  (!id.startsWith('enhanced') && !id.startsWith('item') && 
                                   !id.startsWith('doctor-note') && !id.startsWith('image-'));
              return isStaticItem ? 'not-allowed' : 'pointer';
            })(),
            boxShadow: '0 4px 16px rgba(2, 136, 209, 0.12)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: (() => {
              if (!selectedItemId) return 1;
              const selectedItem = items.find((item: any) => item.id === selectedItemId);
              if (!selectedItem) return 1;
              const id = selectedItem.id || '';
              const isStaticItem = id.includes('raw') || id.includes('single-encounter') || 
                                  (!id.startsWith('enhanced') && !id.startsWith('item') && 
                                   !id.startsWith('doctor-note') && !id.startsWith('image-'));
              return isStaticItem ? 0.5 : 1;
            })(),
          }}
          title={(() => {
            if (!selectedItemId) return "Reset Board (Delete All API Items)";
            const selectedItem = items.find((item: any) => item.id === selectedItemId);
            if (!selectedItem) return "Reset Board (Delete All API Items)";
            const id = selectedItem.id || '';
            const isStaticItem = id.includes('raw') || id.includes('single-encounter') || 
                                (!id.startsWith('enhanced') && !id.startsWith('item') && 
                                 !id.startsWith('doctor-note') && !id.startsWith('image-'));
            return isStaticItem ? "Static item selected - Deselect to reset entire board or select another item to delete" : "Delete Selected Item";
          })()}
          onMouseEnter={(e) => {
            if (!selectedItemId || !(() => {
              const selectedItem = items.find((item: any) => item.id === selectedItemId);
              if (!selectedItem) return false;
              const id = selectedItem.id || '';
              return id.includes('raw') || id.includes('single-encounter') || 
                     (!id.startsWith('enhanced') && !id.startsWith('item') && 
                      !id.startsWith('doctor-note') && !id.startsWith('image-'));
            })()) {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = '#ef4444';
            }
          }}
          onMouseLeave={(e) => {
            if (!selectedItemId || !(() => {
              const selectedItem = items.find((item: any) => item.id === selectedItemId);
              if (!selectedItem) return false;
              const id = selectedItem.id || '';
              return id.includes('raw') || id.includes('single-encounter') || 
                     (!id.startsWith('enhanced') && !id.startsWith('item') && 
                      !id.startsWith('doctor-note') && !id.startsWith('image-'));
            })()) {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(2, 136, 209, 0.12)';
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#0288d1';
              e.currentTarget.style.borderColor = 'rgba(2, 136, 209, 0.15)';
            }
          }}
        >
          <X size={22} />
        </button>



        {/* Agent Chat Toggle Button */}
        <button
          onClick={() => setShowAgentChat(!showAgentChat)}
          style={{
            width: '52px',
            height: '52px',
            border: '2px solid rgba(2, 136, 209, 0.15)',
            borderRadius: '14px',
            background: showAgentChat ? 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)' : 'white',
            color: showAgentChat ? 'white' : '#0288d1',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(2, 136, 209, 0.12)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Toggle Agent Chat"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 136, 209, 0.3)';
            if (!showAgentChat) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)';
              e.currentTarget.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(2, 136, 209, 0.12)';
            if (!showAgentChat) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#0288d1';
            }
          }}
        >
          <MessageSquare size={22} />
        </button>
      </div>

      {/* Click outside to close menu */}
      {showAddMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowAddMenu(false)}
        />
      )}
      
      

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowResetModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItemId ? (
              // Delete selected item mode
              <>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>⚠️</span> Delete Selected Item
                </h2>
                
                <p style={{ margin: '0 0 12px 0', fontSize: '16px', lineHeight: 1.6, color: '#374151' }}>
                  This will <strong>delete the currently selected item</strong>.
                </p>
                
                <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#991b1b' }}>
                    Item to be deleted:
                  </p>
                  <p style={{ margin: '0', paddingLeft: '8px', color: '#991b1b', fontSize: '14px', fontFamily: 'monospace' }}>
                    {selectedItemId}
                  </p>
                </div>
                
                <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '8px', padding: '16px', margin: '20px 0', color: '#991b1b', fontWeight: 500, fontSize: '15px' }}>
                  ⚠️ This action CANNOT be undone!
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowResetModal(false)}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: '#f3f4f6',
                      color: '#374151',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSelectedItem}
                    disabled={isDeleting}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      background: isDeleting ? '#fca5a5' : '#dc2626',
                      color: 'white',
                      transition: 'all 0.2s ease',
                      opacity: isDeleting ? 0.6 : 1,
                    }}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Item'}
                  </button>
                </div>
              </>
            ) : (
              // Reset board mode
              <>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>⚠️</span> Reset Board to Default
                </h2>
                
                <p style={{ margin: '0 0 12px 0', fontSize: '16px', lineHeight: 1.6, color: '#374151' }}>
                  This will <strong>reset the board to its default state</strong>.
                </p>
                
                <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: '#991b1b' }}>
                    What will happen:
                  </p>
                  <ul style={{ margin: '0', paddingLeft: '20px', color: '#991b1b', fontSize: '14px', lineHeight: 1.8 }}>
                    <li>Delete dynamic items (todos, notes, images, agent results)</li>
                    <li>Reset ALL item positions to default</li>
                    <li>Clear Chat conversation history</li>
                  </ul>
                </div>
                
                <p style={{ margin: '12px 0', fontSize: '16px', fontWeight: 600, color: '#374151' }}>
                  Items that will remain:
                </p>
                <ul style={{ margin: '12px 0', paddingLeft: '24px', color: '#374151' }}>
                  <li style={{ margin: '6px 0', fontSize: '15px' }}>Raw EHR Data (at default positions)</li>
                  <li style={{ margin: '6px 0', fontSize: '15px' }}>Single Encounter Data (at default positions)</li>
                </ul>
                
                <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '8px', padding: '16px', margin: '20px 0', color: '#991b1b', fontWeight: 500, fontSize: '15px' }}>
                  ⚠️ This action CANNOT be undone!
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowResetModal(false)}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: '#f3f4f6',
                      color: '#374151',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetBoard}
                    disabled={isDeleting}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                      color: 'white',
                      opacity: isDeleting ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isDeleting ? 'Resetting...' : 'Reset Board'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Result Modal */}
      {showResultModal && deleteResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowResultModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 600, color: deleteResult.success ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{deleteResult.success ? '✅' : '❌'}</span>
              {deleteResult.success ? 'Board Reset Complete' : 'Reset Failed'}
            </h2>
            
            {deleteResult.success ? (
              <>
                {deleteResult.deletedCount > 0 ? (
                  <p style={{ margin: '0 0 12px 0', fontSize: '16px', lineHeight: 1.6, color: '#374151' }}>
                    Successfully deleted <strong>{deleteResult.deletedCount}</strong> dynamic items from the board.
                  </p>
                ) : (
                  <p style={{ margin: '0 0 12px 0', fontSize: '16px', lineHeight: 1.6, color: '#374151' }}>
                    No dynamic items to delete.
                  </p>
                )}
              
                {deleteResult.remainingCount !== undefined && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '16px', lineHeight: 1.6, color: '#374151' }}>
                    <strong>{deleteResult.remainingCount}</strong> items remaining on the board.
                  </p>
                )}
              </>
            ) : (
              <p style={{ margin: '0 0 12px 0', fontSize: '16px', lineHeight: 1.6, color: '#991b1b' }}>
                {deleteResult.error || 'An error occurred while resetting the board.'}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowResultModal(false)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: '#f3f4f6',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Agent Chat */}
      <AgentChat isOpen={showAgentChat} onClose={() => setShowAgentChat(false)} />
    </div>
  );
}

export default Canvas2;
