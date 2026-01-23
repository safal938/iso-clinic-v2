# Testing the Scheduling Backend Integration

## Quick Test Checklist

### 1. Basic Loading
- [ ] Open `/scheduling` route
- [ ] Select a clinician (e.g., N0001)
- [ ] Click "Open Schedule Calendar"
- [ ] Verify appointments load from backend
- [ ] Check browser console for API call logs

### 2. Move to Empty Slot
- [ ] Drag an appointment to an empty time slot
- [ ] Verify blue highlight appears on target slot
- [ ] Release to drop
- [ ] Check loading spinner appears briefly
- [ ] Verify appointment moves to new position
- [ ] Check console for two API calls (update new slot, clear old slot)

### 3. Swap Two Appointments
- [ ] Drag one appointment onto another
- [ ] Verify both slots highlight
- [ ] Release to swap
- [ ] Check loading spinner appears briefly
- [ ] Verify both appointments swap positions
- [ ] Check console for single switch API call

### 4. Error Handling
- [ ] Disconnect network (or use invalid clinician ID)
- [ ] Try to drag an appointment
- [ ] Verify error banner appears
- [ ] Verify schedule reloads from backend
- [ ] Reconnect network and try again

### 5. Multiple Clinicians
- [ ] Close modal
- [ ] Select different clinician (e.g., D0001)
- [ ] Open modal again
- [ ] Verify different schedule loads
- [ ] Test drag-and-drop with new clinician

## Manual Testing Steps

### Test 1: Move Appointment Forward in Time

**Setup:**
- Patient P0004 at 10:30 AM
- Empty slot at 11:00 AM

**Steps:**
1. Drag P0004 from 10:30 to 11:00
2. Release

**Expected Result:**
- P0004 now at 11:00 AM
- 10:30 AM slot is empty
- Console shows:
  ```
  POST /schedule/update (11:00, patient: P0004)
  POST /schedule/update (10:30, patient: None)
  ```

### Test 2: Swap Two Appointments

**Setup:**
- Patient P0004 at 10:30 AM
- Patient P0005 at 11:00 AM

**Steps:**
1. Drag P0004 onto P0005
2. Release

**Expected Result:**
- P0004 now at 11:00 AM
- P0005 now at 10:30 AM
- Console shows:
  ```
  POST /schedule/switch
  {
    clinician_id: "N0001",
    item1: { date: "2026-01-22", time: "11:00", patient: "P0004" },
    item2: { date: "2026-01-22", time: "10:30", patient: "P0005" }
  }
  ```

### Test 3: Error Recovery

**Setup:**
- Disconnect network or use invalid backend URL

**Steps:**
1. Try to drag an appointment
2. Release

**Expected Result:**
- Error banner appears: "Failed to update schedule. Please try again."
- Schedule reloads from backend (or shows cached data)
- No appointments lost or duplicated

## Console Debugging

### Successful Move
```
🎯 Dragging appointment: P0004 from 10:30
📍 Dropping at: 11:00
📡 API: POST /schedule/update (11:00, P0004)
✅ Update successful
📡 API: POST /schedule/update (10:30, None)
✅ Clear successful
🔄 UI updated
```

### Successful Swap
```
🎯 Dragging appointment: P0004 from 10:30
📍 Dropping onto: P0005 at 11:00
📡 API: POST /schedule/switch
✅ Switch successful
🔄 UI updated (both appointments)
```

### Error Case
```
🎯 Dragging appointment: P0004 from 10:30
📍 Dropping at: 11:00
📡 API: POST /schedule/update (11:00, P0004)
❌ Error: Failed to fetch
⚠️ Showing error banner
🔄 Reloading schedule from backend
```

## API Testing with curl

### Get Schedule
```bash
curl -X GET "https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/N0001"
```

### Update Slot
```bash
curl -X POST "https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/update" \
  -H "Content-Type: application/json" \
  -d '{
    "clinician_id": "N0001",
    "date": "2026-01-22",
    "time": "11:00",
    "patient": "P0004"
  }'
```

### Switch Slots
```bash
curl -X POST "https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/switch" \
  -H "Content-Type: application/json" \
  -d '{
    "clinician_id": "N0001",
    "item1": {
      "date": "2026-01-22",
      "time": "11:00",
      "patient": "P0004"
    },
    "item2": {
      "date": "2026-01-22",
      "time": "10:30",
      "patient": "P0005"
    }
  }'
```

## Browser DevTools Network Tab

### What to Look For

**Successful Request:**
- Status: 200 OK
- Response: `{ "message": "Schedule updated successfully." }`
- Time: < 1 second

**Failed Request:**
- Status: 4xx or 5xx
- Response: Error message
- Component shows error banner

## Common Issues

### Issue: Appointments don't load
**Check:**
- Network tab shows 200 response from `/schedule/{id}`
- Console shows parsed appointment data
- Backend has data for that clinician

### Issue: Drag doesn't work
**Check:**
- Appointment has `patientId` field
- `onDragStart` handler is attached
- Browser supports drag-and-drop (all modern browsers do)

### Issue: Backend not updating
**Check:**
- Request payload format matches API spec
- Date format is YYYY-MM-DD
- Time format is HH:MM (24-hour)
- Patient ID is not empty or undefined

### Issue: UI out of sync with backend
**Solution:**
- Close and reopen modal to reload
- Check for error messages in console
- Verify backend returned success response

## Performance Testing

### Load Time
- Schedule should load in < 2 seconds
- Drag operations should complete in < 1 second
- UI should update immediately (optimistic)

### Stress Test
1. Rapidly drag multiple appointments
2. Verify all operations complete
3. Check for race conditions
4. Reload to verify final state matches backend

## Integration Test Script

```javascript
// Run in browser console
async function testScheduling() {
  console.log('🧪 Starting scheduling integration test...');
  
  // Test 1: Load schedule
  const schedule = await fetch('https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/N0001');
  console.log('✅ Test 1: Load schedule', schedule.ok ? 'PASS' : 'FAIL');
  
  // Test 2: Update slot
  const update = await fetch('https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinician_id: 'N0001',
      date: '2026-01-22',
      time: '11:00',
      patient: 'P0004'
    })
  });
  console.log('✅ Test 2: Update slot', update.ok ? 'PASS' : 'FAIL');
  
  // Test 3: Switch slots
  const swap = await fetch('https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinician_id: 'N0001',
      item1: { date: '2026-01-22', time: '11:00', patient: 'P0004' },
      item2: { date: '2026-01-22', time: '10:30', patient: 'P0005' }
    })
  });
  console.log('✅ Test 3: Switch slots', swap.ok ? 'PASS' : 'FAIL');
  
  console.log('🎉 All tests complete!');
}

// Run the test
testScheduling();
```

## Acceptance Criteria

- [x] Schedule loads from backend on modal open
- [x] Drag-and-drop moves appointments
- [x] Swapping two appointments works
- [x] Backend syncs on every change
- [x] Loading states show during API calls
- [x] Error messages display on failure
- [x] Schedule reloads on error to ensure consistency
- [x] Multiple clinicians supported (N#### and D####)
- [x] Visual feedback during drag operations
- [x] No data loss or duplication
