# Scheduling Component - User Guide

## Accessing the Schedule

1. Navigate to `/scheduling` in your browser
2. Select a clinician from the dropdown (e.g., "Nurse N0001")
3. Click "Open Schedule Calendar"

## Using Drag and Drop

### Moving an Appointment to an Empty Slot

1. **Click and hold** on any appointment card
2. The card will become semi-transparent (50% opacity)
3. **Drag** the card to an empty time slot
4. The target slot will highlight with a blue dashed border
5. **Release** to drop the appointment
6. The appointment moves to the new time
7. Backend automatically updates both slots

**What happens behind the scenes:**
- API call to set patient in new slot
- API call to clear old slot (set to "None")
- UI updates immediately

### Swapping Two Appointments

1. **Click and hold** on an appointment card
2. **Drag** it onto another appointment card
3. Both slots will be highlighted
4. **Release** to swap the appointments
5. Both appointments exchange time slots
6. Backend automatically swaps both slots

**What happens behind the scenes:**
- Single API call to `/schedule/switch`
- Both patients swap their time slots
- UI updates both cards simultaneously

## Visual Feedback

### Dragging State
- **Dragged card**: 50% opacity, cursor shows "move"
- **Drop target**: Blue background with dashed border
- **Other cards**: Normal appearance

### Loading State
- Calendar icon in header becomes a spinner
- Prevents interactions during API calls
- Ensures data consistency

### Error State
- Red banner appears at top of modal
- Shows error message
- Click X to dismiss
- Schedule reloads from backend to ensure accuracy

## Appointment Details

Click any appointment card to view:
- Patient name
- Appointment time
- Duration
- Type (Consultation, Emergency, etc.)
- Notes

## Time Slots

- **Grid**: 9:00 AM to 5:00 PM
- **Intervals**: 30-minute slots
- **Hour markers**: Bold with AM/PM indicators
- **Current time**: Red line indicator (if today)

## Keyboard Shortcuts

- **Escape**: Close the modal
- **Click outside**: Close the modal

## Tips

1. **Drag smoothly**: Hold the mouse button down while dragging
2. **Visual feedback**: Watch for the blue highlight on drop zones
3. **Wait for sync**: Loading spinner indicates backend is updating
4. **Check errors**: Red banner shows if something went wrong
5. **Reload on error**: Schedule automatically reloads to stay in sync

## Clinician IDs

- **Nurses**: Start with "N" (e.g., N0001, N0002)
- **Doctors**: Start with "D" (e.g., D0001, D0002)
- Backend automatically routes to correct schedule file

## Appointment Types

Different colored left borders indicate appointment types:
- **Blue**: Consultation
- **Teal**: Checkup
- **Indigo**: Surgery
- **Cyan**: Follow-up
- **Gray**: Emergency

## Common Scenarios

### Scenario 1: Patient Needs Earlier Appointment
1. Find the patient's current appointment
2. Drag it to an earlier empty slot
3. Release to confirm
4. Backend updates automatically

### Scenario 2: Two Patients Want to Switch Times
1. Drag one patient's appointment
2. Drop it onto the other patient's appointment
3. Both appointments swap times
4. Backend updates both slots

### Scenario 3: Reorganizing the Day
1. Drag appointments one by one
2. Drop them in desired order
3. Each move syncs with backend
4. Schedule stays consistent

## Troubleshooting

**Problem**: Appointment doesn't move
- **Solution**: Check for error banner, reload page if needed

**Problem**: Loading spinner doesn't stop
- **Solution**: Check network connection, backend may be down

**Problem**: Appointments disappear
- **Solution**: Close and reopen modal to reload from backend

**Problem**: Can't drag appointments
- **Solution**: Ensure you're clicking on the card itself, not empty space

## API Integration

All drag-and-drop operations automatically call the backend API:

**Move Operation:**
```
POST /schedule/update (new slot)
POST /schedule/update (clear old slot)
```

**Swap Operation:**
```
POST /schedule/switch (both slots)
```

No manual save required - everything syncs in real-time!
