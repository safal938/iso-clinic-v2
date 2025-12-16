---
## 4. Configuration Parameters
|   |   |   |
|---|---|---|
|Parameter|Description|Impact|
|**Duration**|Length of the workday (e.g., 480 mins = 8 hours).|Defines when the simulation stops spawning.|
|**Arrival Interval**|Average time between patients (e.g., 6 mins).|Lower number = More patients (Higher load).|
|**Receptionists**|Number of staff at Standard front desk.|Reduces bottlenecks at the Standard entry.|
|**Doctors (Std/AI)**|Number of doctors available.|**Critical Resource.** Increasing this drastically improves throughput if the doctor is the bottleneck.|
|**Reception Time**|Avg time to check in manually.|Speed of the Standard entry process.|
|**Doctor Time**|Avg consultation time.|Usually set higher for Standard (manual notes) and lower for AI (automated notes).|
|**Digital Adoption**|% of patients using mobile check-in.|Higher % reduces load on physical Kiosks.|
|**Kiosks/Nurses**|Number of machines/staff in AI intake.|Handles the AI intake volume.|

---