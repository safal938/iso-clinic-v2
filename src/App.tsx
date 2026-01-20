import React, { useState, useCallback, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import styled from "styled-components";
import Canvas2 from "./components/Canvas2";
import Canvas3 from "./components/Canvas3";
import Canvas4 from "./components/Canvas4";
import InvisibleConnectorExample from "./components/InvisibleConnectorExample";
import MeetSidePanel from "./components/MeetSidePanel";
import MeetMainStage from "./components/MeetMainStage";
import IsometricMap from "./components/isoclinic/IsometricMap";
import IsometricMap2 from "./components/isoclinic-2/IsometricMap2";
import NurseSimApp from "./components/nurse-sim/NurseSimApp";
import NurseSimStatic from "./components/nurse-sim/NurseSimStatic";
import { PreConsultationApp } from "./components/pre-consultation";
import { PreConsultationFormPage } from "./components/pre-consultation/PreConsultationFormPage";
import BoardPatientSelect from "./components/board/BoardPatientSelect";
import ClinicTriageApp from "./components/clinical-triage/ClinicTriageApp";
import { MonitoringPage } from "./components/monitoring/MonitoringPage";
import boardItemsData from "./data/boardItems.json";

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  background-color: #f5f5f5;
`;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/meet/Sidepanel" element={<MeetSidePanel />} />
        <Route path="/meet/sidepanel" element={<MeetSidePanel />} />
        <Route path="/meet/Mainstage" element={<MeetMainStage />} />
        <Route path="/meet/mainstage" element={<MeetMainStage />} />
        <Route path="/canvas3" element={<Canvas3 />} />
        <Route path="/canvas4" element={<Canvas4 />} />
        <Route path="/invisible-connector" element={<InvisibleConnectorExample />} />
        <Route path="/board/select" element={<BoardPatientSelect />} />
        <Route path="/board" element={<BoardApp />} />
        <Route path="/nurse-sim/*" element={<NurseSimApp />} />
        <Route path="/nurse-sim-1" element={<NurseSimStatic />} />
        <Route path="/pre-consultation" element={<PreConsultationApp />} />
        <Route path="/pre-consultation-form/:patientId" element={<PreConsultationFormPage />} />
        <Route path="/clinic-triage" element={<ClinicTriageApp />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/isoclinic-2" element={<IsometricMap2 />} />
        <Route path="/" element={<IsometricMap />} />
      </Routes>
    </Router>
  );
}

// Main board application component - now uses Canvas2 which handles everything internally
export function BoardApp() {
  // Canvas2 handles all state, API calls, SSE, and global functions internally
  return (
    <AppContainer>
      <Canvas2 />
    </AppContainer>
  );
}

// Legacy code below - kept for reference but not used
/*
export function BoardAppLegacy() {

  // Expose selected item globally and sync with backend
  useEffect(() => {
    // Make selected item info available globally
    (window as any).getSelectedItem = () => {
      if (!selectedItemId) return null;
      const selectedItem = items.find((item) => item.id === selectedItemId);
      return selectedItem || null;
    };

    // Sync selected item to backend
    if (selectedItemId) {
      fetch(`${API_BASE_URL}/api/selected-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedItemId }),
      }).catch((err) => {
        console.error("Failed to sync selected item:", err);
      });
    }
  }, [selectedItemId, items, API_BASE_URL]);

  // Load items from both backend API and static data
  useEffect(() => {
    const loadItemsFromBothSources = async () => {
      try {
        setIsLoading(true);

        // Start with static data from src/data/boardItems.json
        let allItems = [...boardItemsData];
        console.log("📁 Loaded static items:", boardItemsData.length, "items");
        console.log("🌐 API Base URL:", API_BASE_URL);
        console.log("🌐 Current URL:", window.location.href);
        console.log(
          "🌐 Is Meet addon:",
          window.location.pathname.includes("/meet/")
        );

        // Try to load additional items from backend API
        try {
          const apiUrl = `${API_BASE_URL}/api/board-items`;
          console.log("📡 Fetching from:", apiUrl);
          const response = await fetch(apiUrl);
          console.log(
            "📡 Response status:",
            response.status,
            response.statusText
          );

          if (response.ok) {
            const apiItems = await response.json();
            console.log("🌐 Loaded API items:", apiItems.length, "items");
            console.log(
              "🌐 API item IDs:",
              apiItems.map((i) => i.id).join(", ")
            );

            // Merge API items with static items, avoiding duplicates
            const staticIds = new Set(boardItemsData.map((item) => item.id));
            const uniqueApiItems = apiItems.filter(
              (item) => !staticIds.has(item.id)
            );

            allItems = [...boardItemsData, ...uniqueApiItems];
            console.log("✅ Combined items:", allItems.length, "total items");
            console.log(
              "✅ All item IDs:",
              allItems.map((i) => i.id).join(", ")
            );
          } else {
            console.log(
              "⚠️ API not available, using only static data. Status:",
              response.status
            );
          }
        } catch (apiError) {
          console.log(
            "⚠️ API not available, using only static data:",
            apiError.message
          );
        }

        setItems(allItems);

        // Debug: Log items by zone
        const retrievedDataZone = allItems.filter(
          (item) =>
            item.x >= 4200 && item.x < 6200 && item.y >= -4600 && item.y < -2500
        );
        console.log(
          `📊 Retrieved Data Zone items (${retrievedDataZone.length}):`,
          retrievedDataZone.map((i) => ({
            id: i.id,
            type: i.type,
            x: i.x,
            y: i.y,
          }))
        );
      } catch (error) {
        console.error("❌ Error loading items:", error);
        setItems(boardItemsData);
      } finally {
        setIsLoading(false);
      }
    };

    loadItemsFromBothSources();
  }, [API_BASE_URL]);

  // Note: Items are now managed by the backend API, no localStorage needed

  const addItem = useCallback((type) => {
    const newItem = {
      id: `item-${Date.now()}`,
      type,
      x: Math.random() * 2000 + 1000,
      y: Math.random() * 2000 + 1000,
      width: type === "text" ? 200 : type === "ehr" ? 550 : 150,
      height: type === "text" ? 100 : type === "ehr" ? 450 : 150,
      content:
        type === "text"
          ? "Double click to edit"
          : type === "ehr"
          ? "EHR Data"
          : "",
      color:
        type === "sticky" ? "#ffeb3b" : type === "ehr" ? "#e8f5e8" : "#2196f3",
      rotation: 0,
      ehrData:
        type === "ehr"
          ? {
              encounter_id: "EHR_2015_08_10_001",
              patient: {
                id: "P001",
                name: "Sarah Miller",
                age: 63,
                sex: "Female",
                occupation: "Retired carpenter",
              },
              encounter_metadata: {
                date: "2015-08-10",
                time: "11:00",
                type: "Outpatient",
                clinician: "Dr. Elizabeth Hayes",
                specialty: "Rheumatology",
              },
              chief_complaint: "Bilateral joint pain and swelling.",
              sections: {
                history_of_present_illness: {
                  summary:
                    "6-month history of progressive, symmetrical joint pain and swelling in hands and feet, worse in morning (>1h stiffness), with fatigue.",
                  details:
                    "Patient reports fatigue impacting daily activities, limited relief with NSAIDs, no fever or systemic symptoms.",
                },
                impression: {
                  working_diagnosis:
                    "Seropositive Rheumatoid Arthritis (RA), active disease",
                  differential_diagnoses: [
                    "Psoriatic Arthritis",
                    "Systemic Lupus Erythematosus",
                    "Crystal Arthropathy",
                  ],
                },
              },
            }
          : null,
    };
    setItems((prev) => [...prev, newItem]);
  }, []);

  const updateItem = useCallback(
    (id, updates) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );

      // Sync updates to backend (height, noteData, content, patientData, etc.)
      if (
        updates.height !== undefined ||
        updates.noteData !== undefined ||
        updates.content !== undefined ||
        updates.patientData !== undefined
      ) {
        fetch(`${API_BASE_URL}/api/board-items/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }).catch((err) => {
          console.error("Failed to sync update to backend:", err);
        });
      }
    },
    [API_BASE_URL]
  );

  const deleteItem = useCallback(
    async (id) => {
      try {
        // 1. Optimistically update UI (immediate feedback)
        setItems((prev) => prev.filter((item) => item.id !== id));
        
        // 2. Clear selection if deleted item was selected
        if (selectedItemId === id) {
          setSelectedItemId(null);
        }

        // 3. Sync deletion to backend
        const response = await fetch(
          `${API_BASE_URL}/api/board-items/${id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          console.error("Failed to delete item from backend:", response.status);
          // Optionally: reload items to sync state
          const reloadResponse = await fetch(
            `${API_BASE_URL}/api/board-items`
          );
          if (reloadResponse.ok) {
            const data = await reloadResponse.json();
            setItems(data);
          }
        } else {
          console.log(`✅ Item ${id} deleted successfully`);
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        // Optionally: reload items to sync state
      }
    },
    [selectedItemId, API_BASE_URL]
  );

  const focusOnItem = useCallback((itemId) => {
    setSelectedItemId(itemId);
  }, []);

  const resetBoard = useCallback(async () => {
    try {
      // Reset to both static data and API data
      let allItems = [...boardItemsData];

      try {
        const response = await fetch(`${API_BASE_URL}/api/board-items`);
        if (response.ok) {
          const apiItems = await response.json();
          const staticIds = new Set(boardItemsData.map((item) => item.id));
          const uniqueApiItems = apiItems.filter(
            (item) => !staticIds.has(item.id)
          );
          allItems = [...boardItemsData, ...uniqueApiItems];
          console.log(
            "✅ Board reset with combined data:",
            allItems.length,
            "items"
          );
        } else {
          console.log("⚠️ API not available for reset, using only static data");
        }
      } catch (apiError) {
        console.log("⚠️ API not available for reset, using only static data");
      }

      setItems(allItems);
      setSelectedItemId(null);
    } catch (error) {
      console.error("❌ Error resetting board:", error);
      setItems(boardItemsData);
      setSelectedItemId(null);
    }
  }, [API_BASE_URL]);

  // Handle focus requests from POST requests (simulated)
  const handleFocusRequest = useCallback(
    (request) => {
      console.log("🎯 Focus request received:", request);
      console.log(
        "📋 Available items:",
        items.map((i) => ({ id: i.id, type: i.type }))
      );

      const targetId = request.objectId || request.itemId;
      const item = items.find((i) => i.id === targetId);

      if (item) {
        console.log("✅ Item found, focusing:", item.id, item.type);

        // Extract focus options with defaults
        const focusOptions = request.focusOptions || {};
        const zoom = focusOptions.zoom || 0.8;
        const duration = focusOptions.duration || 1200;

        // First select the item
        focusOnItem(targetId);

        // Handle sub-element focusing
        if (request.subElement) {
          console.log("🎯 Sub-element focus requested:", request.subElement);

          // Center on sub-element
          if ((window as any).centerOnSubElement) {
            console.log(
              "🚀 Calling centerOnSubElement with:",
              targetId,
              request.subElement,
              "zoom:",
              zoom,
              "duration:",
              duration
            );
            (window as any).centerOnSubElement(
              targetId,
              request.subElement,
              zoom,
              duration
            );

            // Add highlight to sub-element after centering starts
            setTimeout(() => {
              const subElement = document.querySelector(
                `[data-focus-id="${request.subElement}"]`
              );
              if (subElement) {
                console.log("✨ Highlighting sub-element:", request.subElement);
                subElement.classList.add("focus-highlighted");

                // Remove highlight after animation
                setTimeout(() => {
                  subElement.classList.remove("focus-highlighted");
                }, duration);
              } else {
                console.warn("⚠️ Sub-element not found:", request.subElement);
              }
            }, 100);
          } else {
            console.error(
              "❌ centerOnSubElement function not available on window"
            );
          }
        } else {
          // Center the viewport on the item (no sub-element)
          if ((window as any).centerOnItem) {
            console.log(
              "🚀 Calling centerOnItem with:",
              targetId,
              "zoom:",
              zoom,
              "duration:",
              duration
            );
            (window as any).centerOnItem(targetId, zoom, duration);
          } else {
            console.error("❌ centerOnItem function not available on window");
          }
        }
      } else {
        console.error("❌ Item not found:", targetId);
        console.error(
          "📋 Available item IDs:",
          items.map((i) => i.id).join(", ")
        );
      }
    },
    [items, focusOnItem]
  );

  // Sync dynamic heights for agent and todo items
  useEffect(() => {
    const syncDynamicHeights = () => {
      items.forEach((item) => {
        if ((item.type === "agent" || item.type === "todo") && item.id) {
          // Check if the item has a DOM element and measure its actual height
          const element = document.querySelector(`[data-item-id="${item.id}"]`);
          if (element) {
            const actualHeight = element.scrollHeight;
            const storedHeight = item.height;

            // If actual height differs significantly from stored height, update it
            if (Math.abs(actualHeight - storedHeight) > 10) {
              console.log(
                `📏 Syncing height for ${item.id}: ${storedHeight}px -> ${actualHeight}px`
              );
              updateItem(item.id, { height: actualHeight });
            }
          }
        }
      });
    };

    // Sync heights after items are rendered
    const timeoutId = setTimeout(syncDynamicHeights, 100);
    return () => clearTimeout(timeoutId);
  }, [items, updateItem]);

  // Connect to backend SSE to receive focus events
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectDelay = 30000; // Max 30 seconds between reconnects

    const connect = () => {
      try {
        // Connect directly to the backend SSE endpoint
        const sseUrl = `${API_BASE_URL}/api/events`;
        console.log(`🔌 Connecting to SSE (attempt ${reconnectAttempts + 1}):`, sseUrl);
        es = new EventSource(sseUrl);

        es.addEventListener("connected", (event: any) => {
          console.log("✅ Connected to SSE:", sseUrl);
          console.log("📡 SSE connection established:", event);
          reconnectAttempts = 0; // Reset counter on successful connection
        });

        es.addEventListener("ping", (event: any) => {
          // Heartbeat received - connection is alive
          console.log(
            "💓 SSE heartbeat:",
            new Date(parseInt(event.data)).toISOString()
          );
        });

        es.addEventListener("focus", (event: any) => {
          try {
            const data = JSON.parse(event.data);
            console.log("🎯 Focus event received via SSE:", data);
            handleFocusRequest({
              objectId: data.objectId || data.itemId,
              subElement: data.subElement,
              focusOptions: data.focusOptions,
            });
          } catch (err) {
            console.error("❌ Error handling focus event:", err);
          }
        });

        // Handle new items (todos, agents) created via API
        es.addEventListener("new-item", (event: any) => {
          try {
            console.log("📦 Raw SSE event received:", event);
            const data = JSON.parse(event.data);
            console.log("📦 Parsed new-item data:", data);
            const newItem = data.item;
            if (!newItem) {
              console.warn("⚠️ No item in new-item event");
              return;
            }

            // Use the coordinates from the backend (Task Zone positioning)
            // Don't override them with viewport center
            console.log(
              `📍 Item positioned by backend at (${newItem.x}, ${newItem.y})`
            );
            console.log(`📦 Adding item to state:`, newItem);

            // Add the new item to the frontend state with backend coordinates
            setItems((prev: any[]) => {
              const exists = prev.some((it) => it.id === newItem.id);
              if (exists) {
                console.warn(`⚠️ Item ${newItem.id} already exists, skipping`);
                return prev;
              }
              console.log(`✅ Adding new item ${newItem.id} to state`);
              return [...prev, newItem];
            });

            // Auto-focus on the newly added item after a short delay
            setTimeout(() => {
              if ((window as any).centerOnItem) {
                console.log("🎯 Auto-focusing on new item:", newItem.id);
                const zoomLevel = newItem.type === "doctor-note" ? 1.0 : 0.8;
                (window as any).centerOnItem(newItem.id, zoomLevel, 1200);
              } else {
                console.error("❌ centerOnItem not available on window");
              }
            }, 500);
          } catch (err) {
            console.error("❌ Error handling new-item event:", err);
          }
        });

        // Handle EASL query events from API
        es.addEventListener("easl-query", (event: any) => {
          try {
            const { query, metadata } = JSON.parse(event.data);
            console.log("📨 EASL query event received:", query);
            if ((window as any).sendQueryToEASL) {
              (window as any).sendQueryToEASL(query, metadata);
            } else {
              console.warn("⚠️ sendQueryToEASL not available on window");
            }
          } catch (err) {
            console.error("❌ Error handling easl-query event:", err);
          }
        });

        es.onerror = (error) => {
          console.error("❌ SSE connection error:", error);
          es?.close();
          
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), maxReconnectDelay);
          
          console.log(`🔄 Will attempt to reconnect in ${delay / 1000} seconds... (attempt ${reconnectAttempts})`);
          reconnectTimeout = setTimeout(connect, delay);
        };

        es.onopen = () => {
          console.log("🌐 SSE connection opened");
          reconnectAttempts = 0; // Reset on successful open
        };
      } catch (error) {
        console.error("❌ Error creating SSE connection:", error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (es) {
        console.log("🔌 Closing SSE connection");
        es.close();
      }
    };
  }, [handleFocusRequest, API_BASE_URL]);

  if (isLoading) {
    return (
      <AppContainer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          color: "#666",
        }}
      >
        Loading board items...
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Canvas2 />
    </AppContainer>
  );
}
*/

export default App;
