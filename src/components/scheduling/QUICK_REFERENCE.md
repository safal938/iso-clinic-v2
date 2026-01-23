# Scheduling Component - Quick Reference

## 🚀 Quick Start

```tsx
import { SchedulingCalendarModal } from './components/scheduling/SchedulingCalendarModal';

<SchedulingCalendarModal
  isOpen={true}
  onClose={() => {}}
  clinicianId="N0001"
/>
```

## 📍 Routes

| Route | Description |
|-------|-------------|
| `/scheduling` | Demo page with clinician selection |

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/schedule/{id}` | Get schedule |
| POST | `/schedule/update` | Update slot |
| POST | `/schedule/switch` | Swap slots |

**Base URL:** `https://clinic-sim-pipeline-481780815788.europe-west1.run.app`

## 🎯 Props

### SchedulingCalendarModal

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | boolean | ✅ | - | Show/hide modal |
| `onClose` | function | ✅ | - | Close handler |
| `clinicianId` | string | ❌ | "N0001" | Clinician ID |
| `patients` | Patient[] | ❌ | [] | Patient list (fallback) |

## 🎨 Appointment Types

| Type | Color | Use Case |
|------|-------|----------|
| Consultation | Blue | Regular appointments |
| Checkup | Teal | Routine checkups |
| Surgery | Indigo | Surgical procedures |
| Follow-up | Cyan | Follow-up visits |
| Emergency | Gray | Emergency cases |

## ⌨️ User Actions

| Action | How To | Result |
|--------|--------|--------|
| **Move** | Drag to empty slot | Appointment moves |
| **Swap** | Drag onto another | Both appointments swap |
| **View** | Click appointment | Show details |
| **Close** | Click X or outside | Close modal |

## 📊 State Flow

```
Load → Drag → Drop → API Call → Update UI
```

## 🔧 API Request Examples

### Get Schedule
```bash
curl https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/N0001
```

### Update Slot
```bash
curl -X POST https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/update \
  -H "Content-Type: application/json" \
  -d '{"clinician_id":"N0001","date":"2026-01-22","time":"11:00","patient":"P0004"}'
```

### Switch Slots
```bash
curl -X POST https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/switch \
  -H "Content-Type: application/json" \
  -d '{"clinician_id":"N0001","item1":{"date":"2026-01-22","time":"11:00","patient":"P0004"},"item2":{"date":"2026-01-22","time":"10:30","patient":"P0005"}}'
```

## 🐛 Debugging

### Console Logs
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'scheduling:*');

// Check current appointments
console.log(appointments);

// Check dragged appointment
console.log(draggedAppointment);
```

### Network Tab
- Look for `/schedule/` requests
- Check status codes (200 = success)
- Verify request payloads

### Common Issues

| Issue | Solution |
|-------|----------|
| Appointments don't load | Check network, verify clinician ID |
| Can't drag | Ensure appointment has `patientId` |
| Backend not updating | Check request format, date/time |
| UI out of sync | Close and reopen modal |

## 📁 File Structure

```
src/
├── components/scheduling/
│   ├── SchedulingCalendarModal.tsx    # Main component
│   ├── AppointmentCard.tsx            # Draggable card
│   ├── CurrentTimeIndicator.tsx       # Time indicator
│   ├── SchedulingDemo.tsx             # Demo page
│   ├── types.ts                       # TypeScript types
│   ├── constants.ts                   # Configuration
│   └── README.md                      # Documentation
└── services/scheduling/
    └── scheduleService.ts             # API service
```

## 🎯 Key Functions

### scheduleService

```typescript
// Load schedule
const schedule = await scheduleService.getSchedule('N0001');

// Update slot
await scheduleService.updateSlot({
  clinician_id: 'N0001',
  date: '2026-01-22',
  time: '11:00',
  patient: 'P0004'
});

// Switch slots
await scheduleService.switchSlots({
  clinician_id: 'N0001',
  item1: { date: '2026-01-22', time: '11:00', patient: 'P0004' },
  item2: { date: '2026-01-22', time: '10:30', patient: 'P0005' }
});
```

## 🎨 Styling

### Tailwind Classes

```css
/* Appointment card */
bg-white border-l-4 border-l-blue-600

/* Dragging */
opacity-50 cursor-move

/* Drop target */
bg-blue-200/50 border-dashed border-blue-400

/* Loading */
animate-spin

/* Error */
bg-red-50 text-red-800
```

## 📐 Layout Constants

```typescript
START_HOUR = 9;           // 9 AM
END_HOUR = 17;            // 5 PM
PIXELS_PER_HOUR = 180;    // Height per hour
```

## 🔄 Update Flow

### Move Operation
```
1. User drags appointment
2. User drops on empty slot
3. POST /schedule/update (new slot)
4. POST /schedule/update (clear old)
5. UI updates
```

### Swap Operation
```
1. User drags appointment
2. User drops on another appointment
3. POST /schedule/switch
4. UI updates both
```

## ✅ Testing Checklist

- [ ] Load schedule from backend
- [ ] Drag appointment to empty slot
- [ ] Drag appointment onto another
- [ ] Check loading spinner
- [ ] Verify error handling
- [ ] Test multiple clinicians
- [ ] Check console for API calls

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Component API |
| `USAGE_GUIDE.md` | User guide |
| `TESTING.md` | Testing guide |
| `ARCHITECTURE.md` | Technical architecture |
| `QUICK_REFERENCE.md` | This file |

## 🎓 Learning Resources

1. **Drag and Drop API**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
2. **React Hooks**: [React Documentation](https://react.dev/reference/react)
3. **Tailwind CSS**: [Tailwind Docs](https://tailwindcss.com/docs)

## 💡 Tips

1. **Always provide `patientId`** for backend sync
2. **Use `clinicianId`** starting with N or D
3. **Date format**: YYYY-MM-DD
4. **Time format**: HH:MM (24-hour)
5. **Check console** for debugging info
6. **Reload modal** if UI seems out of sync

## 🚨 Important Notes

- Backend uses CSV files (nurse_schedule.csv, doctor_schedule.csv)
- Clinician ID prefix determines which file to use (N→Nurse, D→Doctor)
- All times are in 24-hour format
- Dates must be in ISO format (YYYY-MM-DD)
- Patient ID "None" means empty slot

## 🎉 Success Indicators

✅ Schedule loads on modal open
✅ Drag-and-drop works smoothly
✅ Loading spinner shows during API calls
✅ Error banner appears on failures
✅ UI stays in sync with backend
✅ No console errors

---

**Need help?** Check the full documentation in the `scheduling/` folder.
