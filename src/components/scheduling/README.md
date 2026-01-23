# Scheduling Component with Backend Integration

This scheduling component provides a drag-and-drop calendar interface that syncs with the clinic schedule backend API.

## Features

- **Drag and Drop**: Reorder appointments by dragging them to different time slots
- **Swap Appointments**: Drag one appointment onto another to swap their times
- **Backend Sync**: All changes automatically sync with the backend API
- **Real-time Updates**: Loading states and error handling for API operations
- **Clinician Support**: Works with both Nurse (N####) and Doctor (D####) IDs

## Usage

### Basic Usage

```tsx
import { SchedulingCalendarModal } from './components/scheduling/SchedulingCalendarModal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Schedule</button>
      <SchedulingCalendarModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        clinicianId="N0001"
      />
    </>
  );
}
```

### With Patient Data

```tsx
<SchedulingCalendarModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  clinicianId="N0001"
  patients={patientList}
/>
```

## API Integration

The component uses the `scheduleService` to communicate with the backend:

### Get Schedule
```typescript
const schedule = await scheduleService.getSchedule('N0001');
```

### Update Slot
```typescript
await scheduleService.updateSlot({
  clinician_id: 'N0001',
  date: '2026-01-22',
  time: '09:30',
  patient: 'P0004',
  status: 'scheduled'
});
```

### Switch/Swap Slots
```typescript
await scheduleService.switchSlots({
  clinician_id: 'N0001',
  item1: {
    date: '2026-01-22',
    time: '11:00',
    patient: 'P0004'
  },
  item2: {
    date: '2026-01-22',
    time: '10:30',
    patient: 'P0005'
  }
});
```

## Demo

Visit `/scheduling` to see the full demo with clinician selection.

## Components

- **SchedulingCalendarModal**: Main calendar modal with drag-and-drop
- **AppointmentCard**: Individual appointment card (draggable)
- **CurrentTimeIndicator**: Shows current time on the calendar
- **SchedulingDemo**: Demo page with clinician selection

## Backend API

Base URL: `https://clinic-sim-pipeline-481780815788.europe-west1.run.app`

Endpoints:
- `GET /schedule/{clinician_id}` - Get schedule
- `POST /schedule/update` - Update a slot
- `POST /schedule/switch` - Swap two slots

See `schedule_endpoint.md` for full API documentation.
