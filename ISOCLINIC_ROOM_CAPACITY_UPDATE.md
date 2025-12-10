# Isoclinic Room Capacity Update

## Overview
Updated the isometric clinic simulation to enforce single-patient capacity in expert nurse rooms and the hepatologist room.

## Changes Made

### Room Capacity Logic (`src/components/isoclinic/IsometricMap.tsx`)

#### 1. Expert Nurse Rooms (nurse1, nurse2, nurse3)
**Previous Behavior:**
- Patients were assigned to nurse rooms in round-robin fashion
- Multiple patients could be assigned to the same room simultaneously
- No capacity checking

**New Behavior:**
- Only ONE patient can be in each expert nurse room at a time
- System checks which rooms are currently occupied before assignment
- Patients wait if all three rooms are full
- Automatic retry every 30 ticks until a room becomes available

**Implementation:**
```typescript
// Check which rooms are occupied
const occupiedRooms = new Set(
  patientsRef.current
    .filter(pt => (pt.state === 'at_nurse' || pt.state === 'to_nurse') && pt.assignedStaffId)
    .map(pt => pt.assignedStaffId)
);

// Find first available room
const availableNurse = nurses.find(n => !occupiedRooms.has(n.id));

if (availableNurse) {
  // Assign to available room
} else {
  // Keep waiting, retry in 30 ticks
  p.waitTimer = 30;
}
```

#### 2. Hepatologist Room
**Previous Behavior:**
- Patients could enter hepatologist room regardless of occupancy
- Multiple patients could overlap in the same space

**New Behavior:**
- Only ONE patient can be with the hepatologist at a time
- System checks if room is occupied before sending patient
- Patients wait in nurse room if hepatologist is busy
- Automatic retry every 30 ticks

**Implementation:**
```typescript
// Check if hepatologist room is available
const hepaOccupied = patientsRef.current.some(pt => 
  (pt.state === 'at_doc' || pt.state === 'to_doc') && pt.id !== p.id
);

if (!hepaOccupied) {
  // Send to hepatologist
} else {
  // Wait longer in nurse room
  p.waitTimer = 30;
}
```

## Patient States Affected

### States Checked for Occupancy:
- `'to_nurse'` - Patient walking to nurse room
- `'at_nurse'` - Patient being treated by nurse
- `'to_doc'` - Patient walking to hepatologist
- `'at_doc'` - Patient being treated by hepatologist

### Wait Timer:
- Set to 30 ticks when room is unavailable
- Approximately 1.5 seconds of game time
- Prevents constant checking while maintaining responsiveness

## Impact on Simulation

### Positive Effects:
1. **Realistic Capacity**: Matches real-world clinic constraints
2. **Better Visualization**: No overlapping patients in rooms
3. **Queue Management**: Natural waiting room buildup when busy
4. **Resource Utilization**: Shows when staff are at capacity

### Potential Bottlenecks:
- Waiting room may fill up during peak times
- Patients may spend more time waiting for available rooms
- Throughput may decrease if arrival rate is too high

## Testing Recommendations

1. **Low Load**: Verify patients flow smoothly with minimal waiting
2. **High Load**: Confirm waiting room fills up appropriately
3. **Peak Times**: Check that all three nurse rooms get utilized
4. **Hepatologist Queue**: Verify only 1 patient at hepatologist at a time
5. **Room Transitions**: Ensure patients properly release rooms when leaving

## Configuration

Current capacity limits:
- Expert Nurse Rooms: 3 rooms × 1 patient = 3 concurrent patients
- Hepatologist Room: 1 room × 1 patient = 1 concurrent patient
- Waiting Room: Unlimited capacity
- Monitoring Room: Unlimited capacity (grid layout)

## Future Enhancements

Potential improvements:
1. Visual indicators showing room occupancy status
2. Adjustable capacity limits per room type
3. Priority queue for urgent cases
4. Statistics tracking average wait times per room
5. Color-coding patients by wait time

## Files Modified

- `src/components/isoclinic/IsometricMap.tsx`

## No Breaking Changes

All changes are backward compatible and enhance the existing simulation logic without affecting other functionality.
