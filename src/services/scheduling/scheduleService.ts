const BASE_URL = 'https://clinic-sim-pipeline-481780815788.europe-west1.run.app';

export interface ScheduleSlot {
  clinician_id: string;
  date: string;
  time: string;
  patient: string;
  status: string;
}

export interface UpdateSlotRequest {
  clinician_id: string;
  date: string;
  time: string;
  patient?: string;
  status?: string;
}

export interface SwitchSlotsRequest {
  clinician_id: string;
  item1: {
    date: string;
    time: string;
    patient: string;
  };
  item2: {
    date: string;
    time: string;
    patient: string;
  };
}

export const scheduleService = {
  /**
   * Get schedule for a specific clinician
   */
  async getSchedule(clinicianId: string): Promise<ScheduleSlot[]> {
    const response = await fetch(`${BASE_URL}/schedule/${clinicianId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch schedule: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Update a specific slot (patient or status)
   */
  async updateSlot(request: UpdateSlotRequest): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/schedule/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to update slot: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Switch/swap two appointment slots
   */
  async switchSlots(request: SwitchSlotsRequest): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/schedule/switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to switch slots: ${response.statusText}`);
    }
    return response.json();
  },
};
