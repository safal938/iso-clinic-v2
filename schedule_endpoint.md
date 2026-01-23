
### API Documentation (Markdown)

Here is the updated guide. I have refined the **Switch / Swap** section to explicitly state that the date and time provided are the **Target Schedule** (destination).

***

# Clinic Schedule API Documentation

**Base URL:**
```
https://clinic-sim-pipeline-481780815788.europe-west1.run.app
```

This API manages the schedule for Clinicians (Nurses and Doctors). It connects directly to the Google Cloud Storage backend CSV files (`nurse_schedule.csv` or `doctor_schedule.csv`) based on the ID prefix.

## 1. Get Schedule
Retrieves the full list of schedule slots for a specific clinician.

*   **Endpoint:** `/schedule/{clinician_id}`
*   **Method:** `GET`
*   **Logic:**
    *   ID starts with `N` -> Fetches Nurse Schedule.
    *   ID starts with `D` -> Fetches Doctor Schedule.

### Example Request
```bash
curl -X GET "https://clinic-sim-pipeline-481780815788.europe-west1.run.app/schedule/N0001"
```

---

## 2. Update Slot
Updates specific details (Patient ID or Status) for a specific time slot.

*   **Endpoint:** `/schedule/update`
*   **Method:** `POST`

### Request Body Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `clinician_id` | string | The ID of the nurse/doctor (e.g., "N0001"). |
| `date` | string | The date of the slot (YYYY-MM-DD). |
| `time` | string | The time of the slot (e.g., "9:30"). |
| `patient` | string | *(Optional)* The new Patient ID to assign. |
| `status` | string | *(Optional)* The new status (e.g., "done", "cancelled"). |

### Example Request
*Marking a slot as "done":*
```json
{
    "clinician_id": "N0001",
    "date": "2026-01-22",
    "time": "9:30",
    "status": "done"
}
```

---

## 3. Switch / Swap Slots
This endpoint updates two schedule slots simultaneously. It is used to rearrange the schedule.

**Important:** The `date` and `time` inside the items represent the **Final Target Schedule**.

*   **Endpoint:** `/schedule/switch`
*   **Method:** `POST`
*   **Logic:**
    *   **Item 1:** "Put [Patient A] into [Target Slot 1]"
    *   **Item 2:** "Put [Patient B] into [Target Slot 2]"

### Request Body Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `clinician_id` | string | The ID of the nurse/doctor. |
| `item1` | object | Definition for the first target slot. |
| `item2` | object | Definition for the second target slot. |

**Item Object Structure:**
*   `date`: The **Target** date.
*   `time`: The **Target** time.
*   `patient`: The patient ID that should be moved **TO** this date/time.

### Example Scenario
You want to swap two patients:
1.  **P0004** (currently at 10:30) should move to **11:00**.
2.  **P0005** (currently at 11:00) should move to **10:30**.

### Example Request
```json
{
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
}
```
*   **Item 1 interpretation:** "Go to the 11:00 slot and write 'P0004' there."
*   **Item 2 interpretation:** "Go to the 10:30 slot and write 'P0005' there."

### Example Response
```json
{
    "message": "Schedule updated successfully."
}
```

---
