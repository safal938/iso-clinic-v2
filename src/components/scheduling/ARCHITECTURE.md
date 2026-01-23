# Scheduling Component Architecture

## Component Hierarchy

```
SchedulingDemo (Demo Page)
  └── SchedulingCalendarModal (Main Modal)
      ├── Header (Title, Clinician ID, Loading Spinner)
      ├── Error Banner (Conditional)
      ├── AddAppointmentForm (Conditional)
      └── Calendar Grid
          ├── Time Labels Column
          ├── Grid Lines (Drop Zones)
          ├── Current Time Indicator
          └── Appointment Cards (Draggable)
```

## Data Flow

### 1. Loading Schedule

```
User Opens Modal
       ↓
SchedulingCalendarModal.useEffect()
       ↓
scheduleService.getSchedule(clinicianId)
       ↓
GET /schedule/N0001
       ↓
Backend Returns Schedule Slots
       ↓
Convert to Appointment Objects
       ↓
setAppointments(appointments)
       ↓
Render Appointment Cards
```

### 2. Drag and Drop - Move

```
User Drags Appointment
       ↓
handleDragStart(appointment)
       ↓
setDraggedAppointment(appointment)
       ↓
User Hovers Over Empty Slot
       ↓
onDragOver → setDropTargetSlot(slot)
       ↓
User Releases
       ↓
handleDrop(targetHour, targetMinute)
       ↓
Check if target is empty
       ↓
scheduleService.updateSlot(newSlot, patient)
       ↓
POST /schedule/update (new slot)
       ↓
scheduleService.updateSlot(oldSlot, "None")
       ↓
POST /schedule/update (clear old)
       ↓
Update Local State
       ↓
Re-render with New Positions
```

### 3. Drag and Drop - Swap

```
User Drags Appointment A
       ↓
handleDragStart(appointmentA)
       ↓
User Hovers Over Appointment B
       ↓
onDragOver → setDropTargetSlot(slotB)
       ↓
User Releases
       ↓
handleDrop(targetHour, targetMinute)
       ↓
Check if target has appointment
       ↓
scheduleService.switchSlots({
  item1: { time: slotB, patient: A },
  item2: { time: slotA, patient: B }
})
       ↓
POST /schedule/switch
       ↓
Update Local State (both appointments)
       ↓
Re-render with Swapped Positions
```

## State Management

### Component State

```typescript
// Appointments from backend
const [appointments, setAppointments] = useState<Appointment[]>([]);

// Current drag operation
const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);

// Drop target highlight
const [dropTargetSlot, setDropTargetSlot] = useState<{ hour: number; minute: number } | null>(null);

// UI states
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [showAddForm, setShowAddForm] = useState(false);

// Date context
const [currentDate, setCurrentDate] = useState(new Date());
```

### Appointment Type

```typescript
interface Appointment {
  id: string;                    // Unique identifier
  patientId?: string;            // Backend patient ID (P0004)
  patientName: string;           // Display name
  type: AppointmentType;         // Consultation, Emergency, etc.
  startTime: Date;               // Appointment start time
  durationMinutes: number;       // Duration (30, 60, etc.)
  notes?: string;                // Additional notes
  status?: 'scheduled' | 'done' | 'cancelled';
}
```

## API Service Layer

### scheduleService.ts

```typescript
// Service methods
getSchedule(clinicianId: string): Promise<ScheduleSlot[]>
updateSlot(request: UpdateSlotRequest): Promise<{ message: string }>
switchSlots(request: SwitchSlotsRequest): Promise<{ message: string }>

// Request types
UpdateSlotRequest {
  clinician_id: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  patient?: string;    // Patient ID or "None"
  status?: string;     // "scheduled", "done", etc.
}

SwitchSlotsRequest {
  clinician_id: string;
  item1: { date, time, patient };
  item2: { date, time, patient };
}
```

## Event Handlers

### Drag Events

```typescript
// Start dragging
onDragStart(appointment) {
  setDraggedAppointment(appointment);
  // Set drag data for browser
}

// Dragging over drop zone
onDragOver(slot) {
  e.preventDefault();
  setDropTargetSlot(slot);
  // Show visual feedback
}

// Leave drop zone
onDragLeave() {
  setDropTargetSlot(null);
  // Remove visual feedback
}

// Drop appointment
onDrop(targetHour, targetMinute) {
  e.preventDefault();
  handleDrop(targetHour, targetMinute);
  // Process the drop
}

// End dragging
onDragEnd() {
  setDraggedAppointment(null);
  setDropTargetSlot(null);
  // Clean up state
}
```

## Backend Integration Points

### 1. Initial Load
```
Component Mount → GET /schedule/{id} → Display Appointments
```

### 2. Move Operation
```
Drop on Empty → POST /schedule/update (new) → POST /schedule/update (clear) → Update UI
```

### 3. Swap Operation
```
Drop on Appointment → POST /schedule/switch → Update UI
```

### 4. Error Recovery
```
API Error → Show Error Banner → Reload Schedule → Ensure Consistency
```

## Visual Feedback System

### CSS Classes

```css
/* Dragging state */
.opacity-50          /* Dragged card */
.cursor-move         /* Drag cursor */

/* Drop target */
.bg-blue-200/50      /* Highlight background */
.border-dashed       /* Dashed border */
.border-blue-400     /* Blue border color */

/* Loading state */
.animate-spin        /* Spinner animation */

/* Error state */
.bg-red-50           /* Error banner background */
.text-red-800        /* Error text color */
```

### Visual States

1. **Normal**: White card, solid border, normal opacity
2. **Dragging**: 50% opacity, move cursor
3. **Drop Target**: Blue highlight, dashed border
4. **Loading**: Spinner in header, disabled interactions
5. **Error**: Red banner at top

## Time Slot Calculation

### Position Calculation

```typescript
// Constants
START_HOUR = 9;              // 9 AM
END_HOUR = 17;               // 5 PM
PIXELS_PER_HOUR = 180;       // Height per hour

// Calculate appointment position
const startHour = appointment.startTime.getHours();
const startMinute = appointment.startTime.getMinutes();
const hoursSinceStart = startHour - START_HOUR + (startMinute / 60);
const topPosition = hoursSinceStart * PIXELS_PER_HOUR;

// Calculate appointment height
const height = (appointment.durationMinutes / 60) * PIXELS_PER_HOUR;
```

### Time Slot Grid

```
9:00 AM  ─────────────────  (0 * 180px = 0px)
9:30 AM  ─────────────────  (0.5 * 180px = 90px)
10:00 AM ─────────────────  (1 * 180px = 180px)
10:30 AM ─────────────────  (1.5 * 180px = 270px)
...
5:00 PM  ─────────────────  (8 * 180px = 1440px)
```

## Error Handling Strategy

### 1. Network Errors
```
API Call Fails
  ↓
Catch Error
  ↓
setError("Failed to update schedule")
  ↓
Show Error Banner
  ↓
Reload Schedule from Backend
  ↓
Ensure UI matches backend state
```

### 2. Validation Errors
```
Missing Patient ID
  ↓
Throw Error
  ↓
Show Error Banner
  ↓
Don't update UI
  ↓
Keep original state
```

### 3. Optimistic Updates
```
User Action
  ↓
Update UI Immediately (optimistic)
  ↓
Call Backend API
  ↓
If Success: Keep UI state
If Error: Revert UI + Show Error
```

## Performance Considerations

### 1. Debouncing
- No debouncing needed (single drop action)
- Each drag-and-drop is a discrete operation

### 2. Optimistic Updates
- UI updates immediately on drop
- Backend syncs in background
- Reverts on error

### 3. Loading States
- Prevents multiple simultaneous operations
- Disables interactions during API calls
- Ensures data consistency

### 4. Memoization
- Appointment cards could be memoized
- Time slot grid is static (no memoization needed)

## Testing Strategy

### Unit Tests (Potential)
- `scheduleService.ts` - API calls
- Date/time formatting functions
- Position calculation functions

### Integration Tests
- Load schedule from backend
- Drag-and-drop operations
- Error handling flows

### E2E Tests
- Full user workflow
- Multiple clinicians
- Error recovery

## Future Enhancements

### 1. Real-time Updates
```
WebSocket Connection
  ↓
Listen for schedule changes
  ↓
Update UI when other users make changes
  ↓
Show notification of changes
```

### 2. Undo/Redo
```
Maintain history stack
  ↓
Store previous states
  ↓
Allow undo of last operation
  ↓
Sync undo with backend
```

### 3. Conflict Resolution
```
Detect overlapping appointments
  ↓
Show warning before drop
  ↓
Suggest alternative times
  ↓
Prevent invalid operations
```

### 4. Batch Operations
```
Select multiple appointments
  ↓
Drag as group
  ↓
Single API call for batch update
  ↓
Atomic operation
```

## Dependencies

### External Libraries
- `react` - Component framework
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `tailwindcss` - Styling

### Internal Dependencies
- `types/nurse-sim.ts` - Patient type
- `constants/` - Configuration

### Browser APIs
- Drag and Drop API
- Fetch API
- Date API

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (touch events)

Drag and Drop API is supported in all modern browsers.
