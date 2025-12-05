require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const redis = require("redis");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase payload limit for images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Redis client setup
let redisClient = null;
let isRedisConnected = false;

const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.warn("⚠️  REDIS_URL not configured, using static file storage");
    return false;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000, // 5 second timeout
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            console.error("❌ Redis connection failed after 2 retries");
            return new Error("Redis connection failed");
          }
          return Math.min(retries * 500, 2000);
        },
      },
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis Client Error:", err.message);
      isRedisConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
      isRedisConnected = true;
    });

    redisClient.on("ready", () => {
      console.log("✅ Redis ready");
      isRedisConnected = true;
    });

    redisClient.on("reconnecting", () => {
      console.log("🔄 Redis reconnecting...");
    });

    await redisClient.connect();
    console.log("✅ Redis client initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error.message);
    console.log("⚠️  Continuing with static file storage as fallback");
    isRedisConnected = false;
    redisClient = null;
    return false;
  }
};

// Simple in-memory list of SSE clients
const sseClients = new Set();

// ============================================================================
// REDIS PUB/SUB FOR CROSS-INSTANCE SSE BROADCASTING
// ============================================================================

let redisSubscriber = null;
let redisPublisher = null;
let isSubscriberSetup = false;

const initializeRedisPubSub = async () => {
  if (!isRedisConnected) {
    console.log('⚠️  Redis not connected, skipping Pub/Sub setup');
    return false;
  }

  try {
    // Create separate Redis clients for pub and sub
    // (Redis requires separate connections for pub/sub)
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.error('❌ REDIS_URL not set');
      return false;
    }

    const { createClient } = require('redis');

    redisPublisher = createClient({ url: redisUrl });
    redisSubscriber = createClient({ url: redisUrl });

    await redisPublisher.connect();
    await redisSubscriber.connect();

    // Set up ONE global subscription that broadcasts to ALL local clients
    if (!isSubscriberSetup) {
      await redisSubscriber.subscribe('sse-events', (message) => {
        try {
          const { event, data } = JSON.parse(message);
          console.log(`📨 Received ${event} from Redis, broadcasting to ${sseClients.size} local clients`);

          // Broadcast to ALL local SSE clients
          for (const client of sseClients) {
            try {
              client.write(`event: ${event}\n`);
              client.write(`data: ${JSON.stringify(data)}\n\n`);
            } catch (err) {
              // Client disconnected, will be cleaned up
            }
          }
        } catch (err) {
          console.error('Error parsing Redis message:', err);
        }
      });
      isSubscriberSetup = true;
      console.log('✅ Redis Pub/Sub initialized - global subscription active');
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Redis Pub/Sub:', error.message);
    redisPublisher = null;
    redisSubscriber = null;
    isSubscriberSetup = false;
    return false;
  }
};

// Track currently selected item
let currentSelectedItem = {
  itemId: null,
  timestamp: null,
  item: null,
};

// Helper function to broadcast SSE messages
// Now uses Redis Pub/Sub to reach ALL serverless instances
const broadcastSSE = async (message) => {
  const eventType = message.event || "new-item";
  const data = { ...message };
  delete data.event; // Remove event from data payload

  console.log(`📤 Broadcasting ${eventType} event to ${sseClients.size} local clients`);

  // ALWAYS broadcast to local SSE clients first (immediate delivery)
  for (const client of sseClients) {
    try {
      client.write(`event: ${eventType}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (_) {
      // Client disconnected, will be cleaned up
    }
  }

  // ALSO publish to Redis channel (reaches other Vercel instances)
  if (redisPublisher && redisPublisher.isReady) {
    try {
      await redisPublisher.publish('sse-events', JSON.stringify({
        event: eventType,
        data: data,
        timestamp: Date.now()
      }));
      console.log(`📢 Published ${eventType} event to Redis (cross-instance)`);
    } catch (err) {
      console.error('❌ Redis publish error:', err);
    }
  } else {
    console.log('⚠️  Redis publisher not ready, event only sent locally');
  }
};

// SSE endpoint to push focus events to the frontend
// Redis Pub/Sub is handled globally, each client just connects to receive events
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Flush headers immediately
  if (res.flushHeaders) res.flushHeaders();

  // Initial event to confirm connection
  res.write("event: connected\n");
  res.write('data: "ok"\n\n');

  sseClients.add(res);
  console.log(`📡 SSE client connected (${sseClients.size} total clients)`);

  // Keep connection alive with heartbeat (every 15 seconds)
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\n`);
      res.write(`data: ${Date.now()}\n\n`);
    } catch (err) {
      // Client disconnected, cleanup will handle it
      console.log('⚠️  Failed to send heartbeat, client likely disconnected');
      clearInterval(heartbeat);
    }
  }, 15000); // 15 seconds

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);

    try {
      res.end();
    } catch (_) { }

    console.log(`📡 SSE client disconnected (${sseClients.size} remaining)`);
  });
});

// Load static items from file (fallback and initialization)
const loadStaticItems = async () => {
  try {
    const sourceDataPath = path.join(__dirname, "data", "boardItems.json");
    const sourceData = await fs.readFile(sourceDataPath, "utf8");
    const items = JSON.parse(sourceData);
    console.log(`📁 Loaded ${items.length} items from static file`);
    return items;
  } catch (error) {
    console.error("❌ Error loading static data:", error);
    return [];
  }
};

// Load board items from Redis (with fallback to static data)
const loadBoardItems = async () => {
  // Ensure Redis is connected
  if (!isRedisConnected) {
    const connected = await initRedis();
    if (!connected) {
      console.log("⚠️  Redis not available, loading from static file");
      return await loadStaticItems();
    }
  }

  // Try Redis first
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get("boardItems");
      if (data) {
        const items = JSON.parse(data);
        console.log(
          `✅ Loaded ${items.length} items from Redis (persistent storage)`
        );
        return items;
      }
      console.log("📦 No items in Redis yet, initializing with static data");
    } catch (error) {
      console.error("❌ Redis read error:", error);
      console.log("⚠️  Falling back to static data");
    }
  }

  // Fallback to static data and initialize Redis
  const staticItems = await loadStaticItems();

  // Try to save to Redis for next time
  if (isRedisConnected && redisClient && staticItems.length > 0) {
    try {
      await redisClient.set("boardItems", JSON.stringify(staticItems));
      console.log("✅ Initialized Redis with static data");
    } catch (error) {
      console.error("❌ Failed to initialize Redis:", error);
    }
  }

  return staticItems;
};

// Save board items to Redis (persistent storage)
const saveBoardItems = async (items) => {
  // Ensure Redis is connected
  if (!isRedisConnected) {
    const connected = await initRedis();
    if (!connected) {
      throw new Error("Redis not available - cannot save items");
    }
  }

  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set("boardItems", JSON.stringify(items));
      console.log(
        `✅ Saved ${items.length} items to Redis (persistent across all instances)`
      );
      return true;
    } catch (error) {
      console.error("❌ Redis write error:", error);
      throw error;
    }
  } else {
    console.error("❌ Redis not connected, cannot save items");
    throw new Error("Redis not available");
  }
};

// Collision detection function
const checkCollision = (item1, item2) => {
  // Skip collision check if either item has auto height (can't determine bounds)
  if (item1.height === "auto" || item2.height === "auto") {
    return false;
  }

  // Convert to numbers
  const h1 = typeof item1.height === "number" ? item1.height : 500;
  const h2 = typeof item2.height === "number" ? item2.height : 500;

  // Two rectangles overlap if they don't satisfy any of these conditions:
  const noCollision =
    item1.x + item1.width <= item2.x || // item1 is completely to the left
    item2.x + item2.width <= item1.x || // item1 is completely to the right
    item1.y + h1 <= item2.y || // item1 is completely above
    item2.y + h2 <= item1.y; // item1 is completely below

  return !noCollision;
};

// Task Management Zone boundaries
const TASK_ZONE = {
  x: 5800,
  y: -2300,
  width: 2000,
  height: 2100,
};

// Retrieved Data Zone boundaries
const RETRIEVED_DATA_ZONE = {
  x: 5800,
  y: -4600,
  width: 2000,
  height: 2100,
};

// Estimate actual height of an item based on its content
const estimateItemHeight = (item) => {
  // If height is explicitly set and not 'auto', use it
  if (
    item.height &&
    item.height !== "auto" &&
    typeof item.height === "number"
  ) {
    return item.height;
  }

  // Estimate based on item type and content
  if (item.type === "todo" && item.todoData) {
    const baseHeight = 120; // Header + padding
    const mainTodoHeight = 50; // Height per main todo item
    const subTodoHeight = 30; // Height per sub-todo item
    const descriptionHeight = item.todoData.description ? 30 : 0;

    let totalHeight = baseHeight + descriptionHeight;

    if (item.todoData.todos && Array.isArray(item.todoData.todos)) {
      item.todoData.todos.forEach((todo) => {
        totalHeight += mainTodoHeight;
        if (todo.subTodos && Array.isArray(todo.subTodos)) {
          totalHeight += todo.subTodos.length * subTodoHeight;
        }
      });
    }

    return Math.min(Math.max(totalHeight, 200), 1200); // Min 200px, max 1200px
  }

  if (item.type === "agent" && item.agentData) {
    const baseHeight = 100;
    const contentLength = item.agentData.markdown?.length || 0;
    const estimatedLines = Math.ceil(contentLength / 60);
    return Math.min(Math.max(baseHeight + estimatedLines * 20, 200), 800);
  }

  if (item.type === "lab-result") {
    return 280;
  }

  if (item.type === "component") {
    if (item.componentType === "SchedulingPanel") return 650;
    return 500;
  }

  // Default fallback
  return 450;
};



// Generic function to find position in any zone using collision detection
const findPositionInZone = (newItem, existingItems, zoneConfig) => {
  const padding = 20; // Gap between items
  const zoneX = zoneConfig.x;
  const zoneY = zoneConfig.y;
  const zoneW = zoneConfig.width;
  const zoneH = zoneConfig.height;

  const newItemW = newItem.width || 500;
  const newItemH = estimateItemHeight(newItem);

  console.log(
    `🎯 Finding smart position in zone (${zoneX}, ${zoneY}) for ${newItem.type} (${newItemW}x${newItemH})`
  );

  // Filter items in zone
  const zoneItems = existingItems.filter(
    (item) =>
      item.x >= zoneX &&
      item.x < zoneX + zoneW &&
      item.y >= zoneY &&
      item.y < zoneY + zoneH
  );

  console.log(`📊 Found ${zoneItems.length} existing items in zone`);

  // 1. Generate candidate positions
  // Start with top-left of zone
  let candidates = [{ x: zoneX + 60, y: zoneY + 60 }];

  // Add positions relative to existing items
  zoneItems.forEach((item) => {
    const iH = estimateItemHeight(item);
    const iW = item.width || 500;

    // Position to the right
    candidates.push({ x: item.x + iW + padding, y: item.y });

    // Position below
    candidates.push({ x: item.x, y: item.y + iH + padding });

    // Position at start of row below (carriage return)
    candidates.push({ x: zoneX + 60, y: item.y + iH + padding });
  });

  // 2. Filter invalid candidates (out of bounds)
  candidates = candidates.filter(
    (p) =>
      p.x >= zoneX &&
      p.y >= zoneY &&
      p.x + newItemW <= zoneX + zoneW &&
      p.y + newItemH <= zoneY + zoneH
  );

  // 3. Sort candidates: Top-down, then Left-right
  // We use a small threshold for Y comparison to group items in "rows"
  candidates.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
    return a.x - b.x;
  });

  // 4. Find first non-overlapping candidate
  for (const p of candidates) {
    let overlaps = false;
    for (const item of zoneItems) {
      const iH = estimateItemHeight(item);
      const iW = item.width || 500;

      // Check intersection
      if (
        p.x < item.x + iW + padding &&
        p.x + newItemW + padding > item.x &&
        p.y < item.y + iH + padding &&
        p.y + newItemH + padding > item.y
      ) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      console.log(`✅ Found smart position at (${p.x}, ${p.y})`);
      return p;
    }
  }

  // Fallback: Stack at bottom if no gap found
  console.log("⚠️ No gap found, stacking at bottom of zone content");
  let maxY = zoneY + 60;
  zoneItems.forEach((item) => {
    const iH = estimateItemHeight(item);
    maxY = Math.max(maxY, item.y + iH + padding);
  });

  // Check if it fits in zone height
  if (maxY + newItemH > zoneY + zoneH) {
    console.log("⚠️ Item exceeds zone height, placing at top (overlap inevitable)");
    return { x: zoneX + 60, y: zoneY + 60 };
  }

  return { x: zoneX + 60, y: maxY };
};

// Doctor's Notes Zone boundaries
const DOCTORS_NOTE_ZONE = {
  x: 2600,
  y: 11400,
  width: 2000,
  height: 2100,
};





// Legacy collision detection for non-API items - Find non-overlapping position for new item
const findNonOverlappingPosition = (newItem, existingItems) => {
  const padding = 20; // Minimum gap between items
  const maxAttempts = 50; // Prevent infinite loops
  let attempts = 0;

  // Start with the original position
  let testX = newItem.x;
  let testY = newItem.y;

  // If no position specified, start at a random location
  if (!newItem.x || !newItem.y) {
    testX = Math.random() * 8000 + 100;
    testY = Math.random() * 7000 + 100;
  }

  console.log(
    `🔍 Checking collision for new item at (${testX}, ${testY}) with ${existingItems.length} existing items`
  );

  // Log all existing items for debugging
  existingItems.forEach((item, index) => {
    console.log(
      `  Existing item ${index}: ${item.id} at (${item.x}, ${item.y}) size (${item.width}, ${item.height})`
    );
  });

  while (attempts < maxAttempts) {
    let hasCollision = false;
    let collidingItem = null;

    // Check collision with all existing items
    for (const existingItem of existingItems) {
      const testItem = {
        x: testX,
        y: testY,
        width: newItem.width,
        height: newItem.height,
      };

      if (checkCollision(testItem, existingItem)) {
        console.log(
          `⚠️  Collision detected with existing item ${existingItem.id} at (${existingItem.x}, ${existingItem.y})`
        );
        hasCollision = true;
        collidingItem = existingItem;
        break;
      }
    }

    // If no collision found, use this position
    if (!hasCollision) {
      console.log(`✅ No collision found, using position (${testX}, ${testY})`);
      return { x: testX, y: testY };
    }

    // Move to next position (below existing items)
    // Strategy: Find the bottom-most item and place below it
    let maxBottom = 0;
    for (const existingItem of existingItems) {
      const bottom = existingItem.y + existingItem.height;
      if (bottom > maxBottom) {
        maxBottom = bottom;
      }
    }

    // Place below the bottom-most item with padding
    testY = maxBottom + padding;

    console.log(
      `📍 Moving to position below bottom-most item: (${testX}, ${testY})`
    );

    // If we're too far down, try a new random X position
    if (testY > 8000) {
      testX = Math.random() * 8000 + 100;
      testY = Math.random() * 7000 + 100;
      console.log(
        `🔄 Canvas too crowded, trying new random position: (${testX}, ${testY})`
      );
    }

    attempts++;
  }

  // If we couldn't find a non-overlapping position, use the last calculated position
  console.log(
    `⚠️  Could not find non-overlapping position after ${attempts} attempts, using fallback position (${testX}, ${testY})`
  );
  return { x: testX, y: testY };
};

// Helper function to update height in source data file
const updateSourceDataHeight = async (itemId, newHeight) => {
  try {
    const sourceDataPath = path.join(
      __dirname,
      "..",
      "src",
      "data",
      "boardItems.json"
    );
    const sourceData = await fs.readFile(sourceDataPath, "utf8");
    const sourceItems = JSON.parse(sourceData);

    const itemIndex = sourceItems.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1) {
      sourceItems[itemIndex].height = newHeight;
      await fs.writeFile(sourceDataPath, JSON.stringify(sourceItems, null, 2));
      console.log(
        `📏 Updated height for item ${itemId} in source data: ${newHeight}px`
      );
    }
  } catch (error) {
    console.log("Could not update source data height:", error.message);
  }
};

// GET /api/board-items - Get all board items (merged from both sources)
app.get("/api/board-items", async (req, res) => {
  try {
    // Load items from backend storage (Redis or static data)
    const items = await loadBoardItems();

    console.log(`📊 Returning ${items.length} board items`);

    res.json(items);
  } catch (error) {
    console.error("Error loading board items:", error);
    res.status(500).json({ error: "Failed to load board items" });
  }
});

// POST /api/board-items - Create a new board item
app.post("/api/board-items", async (req, res) => {
  try {
    const {
      type,
      componentType,
      x,
      y,
      width,
      height,
      content,
      color,
      rotation,
      ehrData,
    } = req.body;

    // Validate required fields
    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }

    // Generate unique ID
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Set default values based on type
    let defaultWidth, defaultHeight, defaultColor, defaultContent;

    if (type === "component") {
      // Component-specific defaults
      switch (componentType) {
        case "PatientContext":
          defaultWidth = 1600;
          defaultHeight = 300;
          break;
        case "MedicationTimeline":
          defaultWidth = 1600;
          defaultHeight = 400;
          break;
        case "AdverseEventAnalytics":
          defaultWidth = 1600;
          defaultHeight = 500;
          break;
        case "LabTable":
        case "LabChart":
        case "DifferentialDiagnosis":
          defaultWidth = 520;
          defaultHeight = 400;
          break;
        default:
          defaultWidth = 600;
          defaultHeight = 400;
      }
      defaultColor = "#ffffff";
      defaultContent = content || {};
    } else {
      // Legacy item types
      defaultWidth = type === "text" ? 200 : type === "ehr" ? 550 : 150;
      defaultHeight = type === "text" ? 100 : type === "ehr" ? 450 : 150;
      defaultColor =
        type === "sticky" ? "#ffeb3b" : type === "ehr" ? "#e8f5e8" : "#2196f3";
      defaultContent =
        type === "text"
          ? "Double click to edit"
          : type === "ehr"
            ? "EHR Data"
            : "";
    }

    // Create new board item
    const newItem = {
      id,
      type,
      componentType: componentType || undefined,
      x: x || Math.random() * 8000 + 100,
      y: y || Math.random() * 7000 + 100,
      width: width || defaultWidth,
      height: height || defaultHeight,
      content: content || defaultContent,
      color: color || defaultColor,
      rotation: rotation || 0,
      ehrData: type === "ehr" ? ehrData || {} : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Load existing items and add new one
    const existingItems = await loadBoardItems();
    const updatedItems = [...existingItems, newItem];

    // Save updated items
    await saveBoardItems(updatedItems);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating board item:", error);
    res.status(500).json({ error: "Failed to create board item" });
  }
});

// PUT /api/board-items/:id - Update a board item
app.put("/api/board-items/:id", async (req, res) => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const updates = req.body;

    const loadStart = Date.now();
    const items = await loadBoardItems();
    const loadTime = Date.now() - loadStart;

    const itemIndex = items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Board item not found" });
    }

    // Update the item
    items[itemIndex] = {
      ...items[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Broadcast immediately for instant real-time updates (don't wait for Redis)
    const broadcastStart = Date.now();
    broadcastSSE({
      event: 'item-updated',
      item: items[itemIndex],
    }).catch(err => console.error('SSE broadcast error:', err));
    const broadcastTime = Date.now() - broadcastStart;

    // Save to Redis in parallel (don't block the response)
    const saveStart = Date.now();
    const savePromise = saveBoardItems(items);

    // If height was updated, also update the source data file
    if (updates.height !== undefined) {
      updateSourceDataHeight(id, updates.height).catch(err =>
        console.error('Source data update error:', err)
      );
    }

    // Wait for Redis save before responding (ensures data consistency)
    await savePromise;
    const saveTime = Date.now() - saveStart;

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Position update: ${id} → (${updates.x}, ${updates.y}) | Load: ${loadTime}ms, Broadcast: ${broadcastTime}ms, Save: ${saveTime}ms, Total: ${totalTime}ms`);

    res.json(items[itemIndex]);
  } catch (error) {
    console.error("Error updating board item:", error);
    res.status(500).json({ error: "Failed to update board item" });
  }
});

// DELETE /api/board-items/:id - Delete a board item
app.delete("/api/board-items/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const items = await loadBoardItems();
    const filteredItems = items.filter((item) => item.id !== id);

    if (filteredItems.length === items.length) {
      return res.status(404).json({ error: "Board item not found" });
    }

    await saveBoardItems(filteredItems);

    res.json({ message: "Board item deleted successfully" });
  } catch (error) {
    console.error("Error deleting board item:", error);
    res.status(500).json({ error: "Failed to delete board item" });
  }
});

// POST /api/board-items/batch-delete - Delete multiple items at once (prevents race conditions)
app.post("/api/board-items/batch-delete", async (req, res) => {
  try {
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: "itemIds array is required" });
    }

    console.log(`🗑️ Batch delete request for ${itemIds.length} items`);

    const items = await loadBoardItems();
    const itemIdsSet = new Set(itemIds);
    const filteredItems = items.filter((item) => !itemIdsSet.has(item.id));

    const deletedCount = items.length - filteredItems.length;

    await saveBoardItems(filteredItems);

    console.log(
      `✅ Batch deleted ${deletedCount} items. ${items.length} → ${filteredItems.length} items remaining`
    );

    res.json({
      message: `Successfully deleted ${deletedCount} items`,
      deletedCount,
      remainingCount: filteredItems.length,
      deletedIds: itemIds.filter(id => itemIdsSet.has(id))
    });
  } catch (error) {
    console.error("Error batch deleting items:", error);
    res.status(500).json({ error: "Failed to batch delete items" });
  }
});

// POST /api/todos - Create a new TODO board item
app.post("/api/todos", async (req, res) => {
  try {
    const { title, description, todo_items } = req.body || {};

    if (!title || !Array.isArray(todo_items)) {
      return res.status(400).json({
        error: "title (string) and todo_items (array) are required",
      });
    }

    // Normalize todo items: accept strings or { text, status }
    const normalizeStatus = (s) =>
      ["todo", "in_progress", "done"].includes((s || "").toLowerCase())
        ? s.toLowerCase()
        : "todo";
    const todos = todo_items.map((t) => {
      if (typeof t === "string") return { text: t, status: "todo" };
      if (t && typeof t.text === "string")
        return { text: t.text, status: normalizeStatus(t.status) };
      return { text: String(t), status: "todo" };
    });

    // Calculate dynamic height based on todo items
    const calculateTodoHeight = (todos, description) => {
      const baseHeight = 80; // Header + padding
      const itemHeight = 35; // Height per todo item
      const descriptionHeight = description ? 20 : 0; // Extra height for description
      const padding = 20; // Bottom padding

      const totalItems = todos.length;
      const contentHeight =
        baseHeight + totalItems * itemHeight + descriptionHeight + padding;

      return Math.min(Math.max(contentHeight, 200), 600); // Min 200px, max 600px
    };

    // Build item
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const dynamicHeight = calculateTodoHeight(todos, description);

    // Load existing items for positioning BEFORE creating the item
    const existingItems = await loadBoardItems();
    console.log(
      `🔍 Loaded ${existingItems.length} existing items for positioning`
    );

    // Determine position - use Task Zone if no coordinates provided
    let itemX, itemY;
    if (req.body.x !== undefined && req.body.y !== undefined) {
      // Manual positioning - use provided coordinates
      itemX = req.body.x;
      itemY = req.body.y;
      console.log(
        `📍 Using provided coordinates for TODO item at (${itemX}, ${itemY})`
      );
    } else {
      // Auto-positioning - use Task Zone
      const tempItem = { type: "todo", width: 420, height: dynamicHeight };
      const taskPosition = findPositionInZone(tempItem, existingItems, TASK_ZONE);
      itemX = taskPosition.x;
      itemY = taskPosition.y;
      console.log(
        `📍 Auto-positioned TODO item in Task Zone at (${itemX}, ${itemY})`
      );
    }

    const newItem = {
      id,
      type: "todo",
      x: itemX,
      y: itemY,
      width: 420,
      height: dynamicHeight,
      content: "Todo List",
      color: "#ffffff",
      rotation: 0,
      todoData: {
        title,
        description: description || "",
        todos,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE (new-item)
    const payload = {
      event: "new-item",
      item: newItem,
      timestamp: new Date().toISOString(),
      action: "created",
    };
    broadcastSSE(payload);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating todo item:", error);
    res.status(500).json({ error: "Failed to create todo item" });
  }
});

// POST /api/agents - Create a new agent result item
app.post("/api/agents", async (req, res) => {
  try {
    const { title, content, zone, x, y, width, height } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({
        error: "title (string) and content (string) are required",
      });
    }

    // Zone configuration mapping (matches src/data/zone-config.json)
    const zoneConfig = {
      "adv-event-zone": { x: -3000, y: 3500, width: 4000, height: 2300 },
      "dili-analysis-zone": { x: -2375, y: 7000, width: 2750, height: 3800 },
      "patient-report-zone": { x: -675, y: 12600, width: 2750, height: 3800 },
      "medico-legal-report-zone": { x: -4150, y: 12600, width: 2750, height: 3800 },
      "report-zone": { x: -4375, y: 12400, width: 6750, height: 4400 },
      "raw-ehr-data-zone": { x: -1000, y: -6600, width: 5000, height: 2500 },
      "data-zone": { x: -3500, y: 500, width: 5000, height: 1500 },

      "retrieved-data-zone": { x: 5800, y: -4600, width: 2000, height: 2100 },
      "doctors-note-zone": { x: 2600, y: 12400, width: 2000, height: 2100 },
      "task-management-zone": { x: 5800, y: -2300, width: 2000, height: 2100 },
      "easl-chatbot-zone": { x: 1000, y: 7000, width: 2000, height: 1400 },
    };

    // Calculate dynamic height based on content
    const calculateHeight = (content) => {
      const baseHeight = 100; // Header + padding
      const lineHeight = 20; // Approximate line height
      const maxWidth = 480; // Container width (accounting for padding)

      // Estimate lines based on content length and width
      const estimatedLines = Math.ceil(content.length / (maxWidth / 8)); // ~8px char width
      const contentHeight = Math.max(estimatedLines * lineHeight, 120); // Minimum 120px

      return Math.min(baseHeight + contentHeight, 800); // Cap at 800px
    };

    // Build item
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const itemWidth = width || 520;
    const dynamicHeight = height || calculateHeight(content);

    // Load existing items for positioning BEFORE creating the item
    const existingItems = await loadBoardItems();
    console.log(
      `🔍 Loaded ${existingItems.length} existing items for positioning`
    );

    // Determine position based on zone parameter
    let itemX, itemY;
    if (x !== undefined && y !== undefined) {
      // Manual positioning - use provided coordinates
      itemX = x;
      itemY = y;
      console.log(
        `📍 Using provided coordinates for AGENT item at (${itemX}, ${itemY})`
      );
    } else if (zone && zoneConfig[zone]) {
      // Zone-based positioning with proper spacing
      const targetZone = zoneConfig[zone];
      const tempItem = { type: "agent", width: itemWidth, height: dynamicHeight };

      // Use generic zone positioning function for consistent spacing
      const zonePosition = findPositionInZone(
        tempItem,
        existingItems,
        targetZone
      );
      itemX = zonePosition.x;
      itemY = zonePosition.y;
      console.log(
        `📍 Auto-positioned AGENT item in ${zone} at (${itemX}, ${itemY})`
      );
    } else {
      // Default: Auto-positioning - use Task Management Zone
      const tempItem = { type: "agent", width: itemWidth, height: dynamicHeight };
      const taskPosition = findPositionInZone(tempItem, existingItems, TASK_ZONE);
      itemX = taskPosition.x;
      itemY = taskPosition.y;
      console.log(
        `📍 Auto-positioned AGENT item in Task Management Zone (default) at (${itemX}, ${itemY})`
      );
    }

    const newItem = {
      id,
      type: "agent",
      x: itemX,
      y: itemY,
      width: itemWidth,
      height: dynamicHeight,
      content: content,
      color: "#ffffff",
      rotation: 0,
      agentData: {
        title,
        markdown: content,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE (new-item)
    const payload = {
      event: "new-item",
      item: newItem,
      timestamp: new Date().toISOString(),
      action: "created",
      zone: zone || "task-management-zone",
    };
    broadcastSSE(payload);

    console.log(`✅ Created agent item ${id} in ${zone || "task-management-zone"} at (${itemX}, ${itemY})`);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating agent item:", error);
    res.status(500).json({ error: "Failed to create agent item" });
  }
});

// POST /api/lab-results - Create a new lab result board item
app.post("/api/lab-results", async (req, res) => {
  try {
    const { parameter, value, unit, status, range, trend } = req.body || {};

    if (!parameter || !value || !unit || !status || !range) {
      return res.status(400).json({
        error: "parameter, value, unit, status, and range are required",
      });
    }

    // Validate status
    const validStatuses = ["optimal", "warning", "critical"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "status must be one of: optimal, warning, critical",
      });
    }

    // Validate range
    if (!range.min || !range.max || range.min >= range.max) {
      return res.status(400).json({
        error: "range must have valid min and max values where min < max",
      });
    }

    // Build item
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Load existing items for positioning BEFORE creating the item
    const existingItems = await loadBoardItems();
    console.log(
      `🔍 Loaded ${existingItems.length} existing items for positioning`
    );

    // Determine position - use Task Zone if no coordinates provided
    let itemX, itemY;
    if (req.body.x !== undefined && req.body.y !== undefined) {
      // Manual positioning - use provided coordinates
      itemX = req.body.x;
      itemY = req.body.y;
      console.log(
        `📍 Using provided coordinates for LAB RESULT item at (${itemX}, ${itemY})`
      );
    } else {
      // Auto-positioning - use Retrieved Data Zone
      const tempItem = { type: "lab-result", width: 400, height: 280 };
      const retrievedDataPosition = findPositionInZone(
        tempItem,
        existingItems,
        RETRIEVED_DATA_ZONE
      );
      itemX = retrievedDataPosition.x;
      itemY = retrievedDataPosition.y;
      console.log(
        `📍 Auto-positioned LAB RESULT item in Retrieved Data Zone at (${itemX}, ${itemY})`
      );
    }

    const newItem = {
      id,
      type: "lab-result",
      x: itemX,
      y: itemY,
      width: 400,
      height: 280,
      content: parameter,
      color: "#ffffff",
      rotation: 0,
      labResultData: {
        parameter,
        value,
        unit,
        status,
        range,
        trend: trend || "stable",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE (new-item)
    const sseMessage = {
      type: "new-item",
      item: newItem,
    };
    broadcastSSE(sseMessage);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating lab result:", error);
    res.status(500).json({ error: "Failed to create lab result" });
  }
});

// POST /api/ehr-data - Create a new EHR data item in Retrieved Data Zone
app.post("/api/ehr-data", async (req, res) => {
  try {
    const { title, content, dataType, source, x, y, width, height } =
      req.body || {};

    if (!title || !content) {
      return res.status(400).json({
        error: "Title and content are required for EHR data items",
      });
    }

    const existingItems = await loadBoardItems();
    const itemId = `item-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Determine positioning
    let itemX, itemY;
    if (x !== undefined && y !== undefined) {
      itemX = x;
      itemY = y;
      console.log(
        `📍 Using provided coordinates for EHR DATA item at (${itemX}, ${itemY})`
      );
    } else {
      // Auto-positioning - use Retrieved Data Zone
      const tempItem = {
        type: "ehr-data",
        width: width || 400,
        height: height || 300,
      };
      const retrievedDataPosition = findPositionInZone(
        tempItem,
        existingItems,
        RETRIEVED_DATA_ZONE
      );
      itemX = retrievedDataPosition.x;
      itemY = retrievedDataPosition.y;
      console.log(
        `📍 Auto-positioned EHR DATA item in Retrieved Data Zone at (${itemX}, ${itemY})`
      );
    }

    const newItem = {
      id: itemId,
      type: "ehr-data",
      title: title,
      content: content,
      dataType: dataType || "clinical",
      source: source || "EHR System",
      x: itemX,
      y: itemY,
      width: width || 400,
      height: height || 300,
      timestamp: new Date().toISOString(),
    };

    // Add to items array
    existingItems.push(newItem);

    // Save to file
    await saveBoardItems(existingItems);

    console.log(`✅ Created EHR data item: ${itemId} - "${title}"`);

    // Notify live clients via SSE (new-item)
    const sseMessage = {
      type: "new-item",
      item: newItem,
    };
    broadcastSSE(sseMessage);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating EHR data item:", error);
    res.status(500).json({ error: "Failed to create EHR data item" });
  }
});

// POST /api/components - Create a new dashboard component
app.post("/api/components", async (req, res) => {
  try {
    const { componentType, x, y, width, height, props } = req.body;

    if (!componentType) {
      return res.status(400).json({
        error: "componentType is required",
      });
    }

    // Set default dimensions based on component type
    let defaultWidth, defaultHeight;
    switch (componentType) {
      case "PatientContext":
        defaultWidth = 1600;
        defaultHeight = 300;
        break;
      case "MedicationTimeline":
        defaultWidth = 1600;
        defaultHeight = 400;
        break;
      case "AdverseEventAnalytics":
        defaultWidth = 1600;
        defaultHeight = 500;
        break;
      case "LabTable":
      case "LabChart":
      case "DifferentialDiagnosis":
        defaultWidth = 520;
        defaultHeight = 400;
        break;
      default:
        defaultWidth = 600;
        defaultHeight = 400;
    }

    const id = `dashboard-item-${componentType.toLowerCase()}-${Date.now()}`;

    const newItem = {
      id,
      type: "component",
      componentType,
      x: x || Math.random() * 8000 + 100,
      y: y || Math.random() * 7000 + 100,
      width: width || defaultWidth,
      height: height || defaultHeight,
      content: {
        title: componentType,
        props: props || {},
      },
      color: "#ffffff",
      rotation: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Load existing items for collision detection
    const existingItems = await loadBoardItems();
    console.log(
      `🔍 Loaded ${existingItems.length} existing items for collision detection`
    );

    // Find non-overlapping position
    const finalPosition = findNonOverlappingPosition(newItem, existingItems);
    newItem.x = finalPosition.x;
    newItem.y = finalPosition.y;

    console.log(
      `📍 Positioned new ${componentType} component at (${newItem.x}, ${newItem.y})`
    );

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE
    const payload = {
      event: "new-item",
      item: newItem,
      timestamp: new Date().toISOString(),
      action: "created",
    };
    broadcastSSE(payload);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating component:", error);
    res.status(500).json({ error: "Failed to create component" });
  }
});

// POST /api/enhanced-todo - Create enhanced todo with agent delegation
app.post("/api/enhanced-todo", async (req, res) => {
  try {
    const {
      title,
      description,
      todos,
      x,
      y,
      width = 450,
      height = "auto",
      color = "#ffffff",
      dataSource = "Manual Entry",
    } = req.body;

    // Validate required fields
    if (!title || !todos || !Array.isArray(todos)) {
      return res.status(400).json({
        error: "title and todos array are required",
      });
    }

    // Validate and generate IDs for todo items
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i];

      if (!todo.text || !todo.status || !todo.agent) {
        return res.status(400).json({
          error: "Each main todo item must have text, status, and agent fields",
        });
      }
      if (!["pending", "executing", "finished"].includes(todo.status)) {
        return res.status(400).json({
          error: "Todo status must be one of: pending, executing, finished",
        });
      }

      // Generate unique task ID if not provided
      if (!todo.id) {
        const taskId = `task-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 6)}-${i}`;
        todo.id = taskId;
        console.log(`🔧 Generated task ID: ${taskId} for task: ${todo.text}`);
      } else {
        console.log(
          `✅ Using provided task ID: ${todo.id} for task: ${todo.text}`
        );
      }

      // Ensure the ID is set in the todos array
      todos[i] = todo;

      // Validate sub-todos if they exist
      if (todo.subTodos && Array.isArray(todo.subTodos)) {
        for (const subTodo of todo.subTodos) {
          if (!subTodo.text || !subTodo.status) {
            return res.status(400).json({
              error: "Each sub-todo item must have text and status fields",
            });
          }
          if (!["pending", "executing", "finished"].includes(subTodo.status)) {
            return res.status(400).json({
              error:
                "Sub-todo status must be one of: pending, executing, finished",
            });
          }
        }
      }
    }

    // Generate unique ID
    const id = `enhanced-todo-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Load existing items for positioning BEFORE creating the item
    const existingItems = await loadBoardItems();
    console.log(
      `🔍 Loaded ${existingItems.length} existing items for positioning`
    );

    // Determine position - use Task Zone if no coordinates provided
    let itemX, itemY;
    if (x !== undefined && y !== undefined) {
      // Manual positioning - use provided coordinates
      itemX = x;
      itemY = y;
      console.log(
        `📍 Using provided coordinates for ENHANCED TODO item at (${itemX}, ${itemY})`
      );
    } else {
      // Auto-positioning - use Task Zone with estimated height
      const tempItem = {
        type: "todo",
        width: width,
        height: height,
        todoData: { todos, description },
      };
      const taskPosition = findPositionInZone(tempItem, existingItems, TASK_ZONE);
      itemX = taskPosition.x;
      itemY = taskPosition.y;
      console.log(
        `📍 Auto-positioned ENHANCED TODO item in Task Zone at (${itemX}, ${itemY})`
      );
    }

    // Create the new enhanced todo item
    const newItem = {
      id,
      type: "todo",
      x: itemX,
      y: itemY,
      width,
      height,
      color,
      description: description || title,
      todoData: {
        title,
        description: description || "",
        todos,
      },
      rotation: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(
      `📍 Positioned new enhanced todo at (${newItem.x}, ${newItem.y})`
    );

    // Save to board items
    const updatedItems = [...existingItems, newItem];
    await saveBoardItems(updatedItems);

    // Broadcast to all connected clients
    const payload = {
      event: "new-item",
      item: newItem,
      timestamp: new Date().toISOString(),
      action: "created",
    };
    broadcastSSE(payload);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating enhanced todo:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to create enhanced todo",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// POST /api/schedule - Create a new scheduling panel item
app.post("/api/schedule", async (req, res) => {
  try {
    const {
      title,
      patientId,
      currentStatus,
      schedulingContext,
      zone,
      x,
      y,
      width = 600,
      height = "auto",
      color = "#ffffff",
    } = req.body;

    // Validate required fields
    if (!schedulingContext) {
      return res.status(400).json({
        error: "schedulingContext is required",
      });
    }

    // Zone configuration mapping (matches src/data/zone-config.json)
    const zoneConfig = {
      "adv-event-zone": { x: -3000, y: 3500, width: 4000, height: 2300 },
      "dili-analysis-zone": { x: -2375, y: 7000, width: 2750, height: 3800 },
      "patient-report-zone": { x: -675, y: 12600, width: 2750, height: 3800 },
      "medico-legal-report-zone": { x: -4150, y: 12600, width: 2750, height: 3800 },
      "report-zone": { x: -4375, y: 12400, width: 6750, height: 4400 },
      "raw-ehr-data-zone": { x: -1000, y: -6600, width: 5000, height: 2500 },
      "data-zone": { x: -3500, y: 500, width: 5000, height: 1500 },

      "retrieved-data-zone": { x: 5800, y: -4600, width: 2000, height: 2100 },
      "doctors-note-zone": { x: 2600, y: 12400, width: 2000, height: 2100 },
      "task-management-zone": { x: 5800, y: -2300, width: 2000, height: 2100 },
      "easl-chatbot-zone": { x: 1000, y: 7000, width: 2000, height: 1400 },
    };

    // Generate unique ID
    const id = `dashboard-item-${Date.now()}-scheduling-panel`;

    // Load existing items for positioning BEFORE creating the item
    const existingItems = await loadBoardItems();
    console.log(
      `🔍 Loaded ${existingItems.length} existing items for positioning`
    );

    // Determine position
    let itemX, itemY;
    if (x !== undefined && y !== undefined) {
      // Manual positioning - use provided coordinates
      itemX = x;
      itemY = y;
      console.log(
        `📍 Using provided coordinates for SCHEDULING PANEL item at (${itemX}, ${itemY})`
      );
    } else if (zone && zoneConfig[zone]) {
      // Zone-based positioning
      const targetZone = zoneConfig[zone];
      const tempItem = {
        type: "component",
        width: width,
        height: 600, // Estimate height
      };
      const position = findPositionInZone(tempItem, existingItems, targetZone);
      itemX = position.x;
      itemY = position.y;
      console.log(
        `📍 Auto-positioned SCHEDULING PANEL item in ${zone} at (${itemX}, ${itemY})`
      );
    } else {
      // Default: Auto-positioning - use Task Management Zone
      const tempItem = {
        type: "component",
        width: width,
        height: 600, // Estimate height
      };
      // Use findTaskZonePosition as default fallback logic for task management zone
      // Or use findPositionInZone with task-management-zone config
      const targetZone = zoneConfig["task-management-zone"];
      const position = findPositionInZone(tempItem, existingItems, targetZone);

      itemX = position.x;
      itemY = position.y;
      console.log(
        `📍 Auto-positioned SCHEDULING PANEL item in Task Management Zone (default) at (${itemX}, ${itemY})`
      );
    }

    // Create the new item
    const newItem = {
      id,
      type: "component",
      x: itemX,
      y: itemY,
      width,
      height,
      componentType: "SchedulingPanel",
      color,
      description: "Integrated scheduling and investigation ordering panel",
      content: {
        title: title || "Care Coordination & Scheduling",
        component: "SchedulingPanel",
        props: {
          patientId: patientId || "Unknown",
          currentStatus: currentStatus || "Unknown",
          schedulingContext,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(
      `📍 Positioned new scheduling panel at (${newItem.x}, ${newItem.y})`
    );

    // Save to board items
    const updatedItems = [...existingItems, newItem];
    await saveBoardItems(updatedItems);

    // Broadcast to all connected clients
    const payload = {
      event: "new-item",
      item: newItem,
      timestamp: new Date().toISOString(),
      action: "created",
    };
    broadcastSSE(payload);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating scheduling panel:", error);
    res.status(500).json({
      error: "Failed to create scheduling panel",
      message: error.message,
    });
  }
});

// POST /api/update-todo-status - Update task or subtask status dynamically
app.post("/api/update-todo-status", async (req, res) => {
  console.log("🔄 POST /api/update-todo-status - Updating todo status");

  try {
    const { id, task_id, index, status } = req.body;

    // Validate required fields
    if (!id || !task_id || status === undefined) {
      return res.status(400).json({
        error: "id, task_id, and status are required",
      });
    }

    // Validate status value
    const validStatuses = ["pending", "executing", "finished"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "status must be one of: pending, executing, finished",
      });
    }

    // Load existing items
    const items = await loadBoardItems();

    // Find the todo item by id
    const itemIndex = items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return res.status(404).json({
        error: `Todo item with id '${id}' not found`,
      });
    }

    const todoItem = items[itemIndex];

    // Validate that it's a todo type item
    if (todoItem.type !== "todo" || !todoItem.todoData) {
      return res.status(400).json({
        error: "Item is not a valid todo item",
      });
    }

    // Find the task by task_id
    const taskIndex = todoItem.todoData.todos.findIndex(
      (task) => task.id === task_id
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        error: `Task with id '${task_id}' not found in todo item '${id}'`,
      });
    }

    // Update status based on index parameter
    if (index === "" || index === undefined || index === null) {
      // Update main task status
      todoItem.todoData.todos[taskIndex].status = status;
      console.log(
        `✅ Updated task '${task_id}' status to '${status}' in todo '${id}'`
      );
    } else {
      // Update subtask status
      const subTaskIndex = parseInt(index, 10);

      if (isNaN(subTaskIndex)) {
        return res.status(400).json({
          error: "index must be a valid number or empty string",
        });
      }

      const task = todoItem.todoData.todos[taskIndex];

      if (!task.subTodos || !Array.isArray(task.subTodos)) {
        return res.status(404).json({
          error: `Task '${task_id}' does not have subtasks`,
        });
      }

      if (subTaskIndex < 0 || subTaskIndex >= task.subTodos.length) {
        return res.status(404).json({
          error: `Subtask index ${subTaskIndex} is out of range (0-${task.subTodos.length - 1
            })`,
        });
      }

      task.subTodos[subTaskIndex].status = status;
      console.log(
        `✅ Updated subtask at index ${subTaskIndex} of task '${task_id}' status to '${status}' in todo '${id}'`
      );
    }

    // Update the item's updatedAt timestamp
    todoItem.updatedAt = new Date().toISOString();

    // Save updated items
    await saveBoardItems(items);

    // Broadcast update to all connected clients via SSE
    const payload = {
      event: "item-updated",
      item: todoItem,
      timestamp: new Date().toISOString(),
      action: "status-updated",
      details: {
        task_id,
        index: index === "" ? null : index,
        status,
      },
    };
    broadcastSSE(payload);

    res.json({
      success: true,
      message: "Todo status updated successfully",
      item: todoItem,
      updated: {
        task_id,
        index: index === "" ? null : index,
        status,
      },
    });
  } catch (error) {
    console.error("❌ Error updating todo status:", error);
    res.status(500).json({
      error: "Failed to update todo status",
      message: error.message,
    });
  }
});

// POST /api/doctor-notes - Create a new doctor's note
app.post("/api/doctor-notes", async (req, res) => {
  console.log("📝 POST /api/doctor-notes - Creating doctor's note");

  try {
    const { content, x, y, width, height } = req.body || {};

    // Generate unique ID
    const noteId = `doctor-note-${Date.now()}`;

    // Determine position - use provided or default to Doctor's Note Zone
    const noteX = x !== undefined ? x : 2600;
    const noteY = y !== undefined ? y : 11400;
    const noteWidth = width || 450;
    const noteHeight = height || 600;

    // Create note item
    const noteItem = {
      id: noteId,
      type: "doctor-note",
      x: noteX,
      y: noteY + 20,
      width: noteWidth,
      height: noteHeight,
      noteData: {
        content: content || "",
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Load existing items
    const items = await loadBoardItems();

    // Find optimal position in Doctor's Notes Zone
    const position = findPositionInZone(noteItem, items, DOCTORS_NOTE_ZONE);
    noteItem.x = position.x;
    noteItem.y = position.y;

    // Add to items
    items.push(noteItem);

    // Save to file
    await saveBoardItems(items);

    console.log(
      `✅ Created doctor's note: ${noteId} at (${position.x}, ${position.y})`
    );

    // Broadcast to SSE clients
    broadcastSSE({
      type: "new-item",
      item: noteItem,
    });

    res.status(201).json({
      success: true,
      message: "Doctor's note created successfully",
      item: noteItem,
    });
  } catch (error) {
    console.error("❌ Error creating doctor's note:", error);
    res.status(500).json({
      error: "Failed to create doctor's note",
      message: error.message,
    });
  }
});

// POST /api/images - Create a new image board item
app.post("/api/images", async (req, res) => {
  console.log("🖼️ POST /api/images - Creating image item");

  try {
    const { imageData, imageUrl, title, x, y, width, height } = req.body || {};

    // Validate that either imageData or imageUrl is provided
    if (!imageData && !imageUrl) {
      return res.status(400).json({
        error: "Either imageData (base64) or imageUrl is required",
      });
    }

    // Generate unique ID
    const imageId = `image-${Date.now()}`;

    // Determine position - use provided or find optimal position
    const imageX = x !== undefined ? x : 100;
    const imageY = y !== undefined ? y : 100;
    const imageWidth = width || 400;
    const imageHeight = height || 300;

    // Create image item
    const imageItem = {
      id: imageId,
      type: "image",
      x: imageX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
      imageData: imageData || null, // Base64 encoded image
      imageUrl: imageUrl || null, // External URL
      title: title || "Image",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Load existing items
    const items = await loadBoardItems();

    // If no position specified, find non-overlapping position
    if (x === undefined || y === undefined) {
      const position = findNonOverlappingPosition(imageItem, items);
      imageItem.x = position.x;
      imageItem.y = position.y;
    }

    // Add to items
    items.push(imageItem);

    // Save to storage
    await saveBoardItems(items);

    console.log(
      `✅ Created image item: ${imageId} at (${imageItem.x}, ${imageItem.y})`
    );

    // Broadcast to SSE clients
    broadcastSSE({
      type: "new-item",
      item: imageItem,
    });

    res.status(201).json({
      success: true,
      message: "Image item created successfully",
      item: imageItem,
    });
  } catch (error) {
    console.error("❌ Error creating image item:", error);
    res.status(500).json({
      error: "Failed to create image item",
      message: error.message,
    });
  }
});

// POST /api/focus - Focus on a specific canvas item (enhanced with sub-element support)
app.post("/api/focus", (req, res) => {
  const { objectId, itemId, subElement, focusOptions } = req.body;

  // Support both objectId (legacy) and itemId (new)
  const targetId = itemId || objectId;

  if (!targetId) {
    return res.status(400).json({
      error: "objectId or itemId is required",
    });
  }

  // Default options - higher zoom for sub-elements
  const defaultOptions = {
    zoom: subElement ? 1.5 : 1.2,
    highlight: !!subElement,
    duration: subElement ? 1500 : 1200,
    scrollIntoView: true,
  };

  const options = { ...defaultOptions, ...(focusOptions || {}) };

  console.log(
    `🎯 Focus request: ${targetId}${subElement ? `#${subElement}` : ""}`
  );

  // Broadcast focus event to all connected SSE clients
  const payload = {
    event: "focus",
    objectId: targetId, // Keep legacy field for compatibility
    itemId: targetId,
    subElement: subElement || null,
    focusOptions: options,
    timestamp: new Date().toISOString(),
  };

  broadcastSSE(payload);

  // Return success
  res.json({
    success: true,
    message: `Focus event broadcasted`,
    itemId: targetId,
    subElement: subElement || null,
    focusOptions: options,
  });
});

// POST /api/notification - Show notification to all connected clients
app.post("/api/notification", (req, res) => {
  const { message, type = 'info' } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Validate notification type
  const validTypes = ['success', 'error', 'warning', 'info'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: "Invalid type",
      message: `Type must be one of: ${validTypes.join(', ')}`
    });
  }

  console.log(`📢 Broadcasting notification: [${type}] ${message}`);

  // Broadcast notification via SSE to all connected clients
  const notificationPayload = {
    event: "notification",
    message,
    type,
    timestamp: new Date().toISOString(),
  };
  broadcastSSE(notificationPayload);

  res.json({
    success: true,
    message: "Notification sent successfully",
    notification: { message, type }
  });
});

// POST /api/send-to-easl - Send query to EASL iframe via SSE
app.post("/api/send-to-easl", (req, res) => {
  const { query, metadata } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  console.log("📨 Sending query to EASL:", query);

  // Broadcast via SSE to all connected clients
  sseClients.forEach((client) => {
    client.write(`event: easl-query\n`);
    client.write(`data: ${JSON.stringify({ query, metadata })}\n\n`);
  });

  // Also broadcast focus event to focus on EASL iframe
  const focusPayload = {
    event: "focus",
    itemId: "iframe-item-easl-interface",
    focusOptions: {
      zoom: 0.7,
      highlight: false,
      duration: 1000,
      scrollIntoView: true,
    },
    timestamp: new Date().toISOString(),
  };
  broadcastSSE(focusPayload);

  res.json({
    success: true,
    message: "Query sent to EASL",
    query,
    metadata,
  });
});

// POST /api/easl-response - Receive complete response from EASL chat app
app.post("/api/easl-response", async (req, res) => {
  const { response_type, query, response, metadata } = req.body;

  try {
    // Only process complete responses
    if (response_type !== 'complete') {
      return res.status(400).json({
        error: "Only complete responses are accepted",
        received_type: response_type
      });
    }

    if (!query || !response) {
      return res.status(400).json({
        error: "query and response are required"
      });
    }

    console.log("📥 Received complete response from EASL");
    console.log("   Query:", query);
    console.log("   Response length:", response.length, "characters");

    // Load existing board items
    const items = await loadBoardItems();

    // Find the EASL iframe item
    const easlItemIndex = items.findIndex(item => item.id === "iframe-item-easl-interface");

    if (easlItemIndex === -1) {
      console.warn("⚠️  EASL iframe item not found in board items");
      return res.status(404).json({
        error: "EASL iframe item not found"
      });
    }

    // Initialize conversationHistory if it doesn't exist
    if (!items[easlItemIndex].conversationHistory) {
      items[easlItemIndex].conversationHistory = [];
    }

    // Add the conversation to history
    const conversationEntry = {
      id: `conv-${Date.now()}`,
      query: query,
      response: response,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
      response_type: response_type
    };

    items[easlItemIndex].conversationHistory.push(conversationEntry);
    items[easlItemIndex].updatedAt = new Date().toISOString();

    // Keep only last 100 conversations to prevent file from growing too large
    if (items[easlItemIndex].conversationHistory.length > 100) {
      items[easlItemIndex].conversationHistory = items[easlItemIndex].conversationHistory.slice(-100);
    }

    // Save updated items to storage
    await saveBoardItems(items);

    console.log("✅ EASL response saved to board items");
    console.log(`   Total conversations: ${items[easlItemIndex].conversationHistory.length}`);

    res.json({
      success: true,
      message: "Response saved successfully",
      conversationId: conversationEntry.id,
      totalConversations: items[easlItemIndex].conversationHistory.length
    });

  } catch (error) {
    console.error("❌ Error saving EASL response:", error);
    res.status(500).json({
      error: "Failed to save EASL response",
      details: error.message
    });
  }
});

// GET /api/easl-history - Get conversation history from EASL
app.get("/api/easl-history", async (req, res) => {
  try {
    const items = await loadBoardItems();
    const easlItem = items.find(item => item.id === "iframe-item-easl-interface");

    if (!easlItem) {
      return res.status(404).json({
        error: "EASL iframe item not found"
      });
    }

    const conversationHistory = easlItem.conversationHistory || [];
    const limit = parseInt(req.query.limit) || conversationHistory.length;

    res.json({
      success: true,
      totalConversations: conversationHistory.length,
      conversations: conversationHistory.slice(-limit)
    });

  } catch (error) {
    console.error("❌ Error retrieving EASL history:", error);
    res.status(500).json({
      error: "Failed to retrieve EASL history",
      details: error.message
    });
  }
});

// POST /api/easl-reset - Reset EASL conversation history
app.post("/api/easl-reset", async (req, res) => {
  try {
    const items = await loadBoardItems();
    const easlItemIndex = items.findIndex(item => item.id === "iframe-item-easl-interface");

    if (easlItemIndex === -1) {
      console.warn("⚠️  EASL iframe item not found in board items");
      return res.status(404).json({
        error: "EASL iframe item not found"
      });
    }

    // Clear conversation history
    const previousCount = items[easlItemIndex].conversationHistory?.length || 0;
    items[easlItemIndex].conversationHistory = [];
    items[easlItemIndex].updatedAt = new Date().toISOString();

    // Save updated items to storage
    await saveBoardItems(items);

    console.log(`✅ EASL conversation history reset (cleared ${previousCount} conversations)`);

    res.json({
      success: true,
      message: "EASL conversation history reset successfully",
      previousCount: previousCount
    });

  } catch (error) {
    console.error("❌ Error resetting EASL history:", error);
    res.status(500).json({
      error: "Failed to reset EASL history",
      details: error.message
    });
  }
});

// POST /api/reload-board-items - Force reload from static file (clears Redis cache)
app.post("/api/reload-board-items", async (req, res) => {
  try {
    console.log("🔄 Force reloading board items from static file...");

    // Load from static file
    const staticItems = await loadStaticItems();

    // Save to Redis (overwrite existing data)
    if (isRedisConnected && redisClient) {
      await redisClient.set("boardItems", JSON.stringify(staticItems));
      console.log(`✅ Reloaded ${staticItems.length} items from static file to Redis`);
    }

    // Broadcast reload event to all connected clients so they refresh
    await broadcastSSE({
      event: 'board-reloaded',
      message: 'Board items reloaded from static file',
      itemCount: staticItems.length,
      timestamp: new Date().toISOString()
    });

    console.log(`📡 Broadcasted board-reloaded event to all clients`);

    res.json({
      success: true,
      message: "Board items reloaded from static file. All clients will refresh automatically.",
      itemCount: staticItems.length,
      hasIframeItem: staticItems.some(item => item.id === "iframe-item-easl-interface")
    });
  } catch (error) {
    console.error("❌ Error reloading board items:", error);
    res.status(500).json({
      error: "Failed to reload board items",
      details: error.message
    });
  }
});

// POST /api/redis/clear - Clear all Redis data
app.post("/api/redis/clear", async (req, res) => {
  try {
    if (!isRedisConnected || !redisClient) {
      return res.status(503).json({
        error: "Redis not connected",
        message: "Redis is not available"
      });
    }

    console.log("🗑️ Clearing all Redis data...");

    // Delete the boardItems key
    await redisClient.del("boardItems");

    console.log("✅ Redis data cleared");

    res.json({
      success: true,
      message: "Redis data cleared successfully"
    });
  } catch (error) {
    console.error("❌ Error clearing Redis:", error);
    res.status(500).json({
      error: "Failed to clear Redis",
      details: error.message
    });
  }
});

// GET /api/redis/info - Get Redis connection info and stats
app.get("/api/redis/info", async (req, res) => {
  try {
    if (!isRedisConnected || !redisClient) {
      return res.json({
        connected: false,
        message: "Redis not connected"
      });
    }

    // Get boardItems data
    const data = await redisClient.get("boardItems");
    const itemCount = data ? JSON.parse(data).length : 0;

    res.json({
      connected: true,
      itemCount: itemCount,
      hasData: !!data,
      redisUrl: process.env.REDIS_URL ? "configured" : "not configured"
    });
  } catch (error) {
    console.error("❌ Error getting Redis info:", error);
    res.status(500).json({
      error: "Failed to get Redis info",
      details: error.message
    });
  }
});

// POST /api/selected-item - Update currently selected item
app.post("/api/selected-item", async (req, res) => {
  const { selectedItemId } = req.body;

  try {
    if (!selectedItemId) {
      // Clear selection
      currentSelectedItem = {
        itemId: null,
        timestamp: null,
        item: null,
      };
      console.log("🔵 Selection cleared");
    } else {
      // Load items to get full item details
      const items = await loadBoardItems();
      const item = items.find((i) => i.id === selectedItemId);

      currentSelectedItem = {
        itemId: selectedItemId,
        timestamp: new Date().toISOString(),
        item: item || null,
      };

      console.log("🔵 Item selected:", selectedItemId, item?.type || "unknown");
    }

    res.json({
      success: true,
      selectedItemId: currentSelectedItem.itemId,
      timestamp: currentSelectedItem.timestamp,
    });
  } catch (error) {
    console.error("Error updating selected item:", error);
    res.status(500).json({ error: "Failed to update selected item" });
  }
});

// GET /api/selected-item - Get currently selected/active item
app.get("/api/selected-item", async (req, res) => {
  try {
    if (!currentSelectedItem.itemId) {
      return res.json({
        selected: false,
        message: "No item currently selected",
        selectedItem: null,
      });
    }

    // Refresh item data from current board state
    const items = await loadBoardItems();
    const item = items.find((i) => i.id === currentSelectedItem.itemId);

    if (!item) {
      // Item no longer exists, clear selection
      currentSelectedItem = {
        itemId: null,
        timestamp: null,
        item: null,
      };

      return res.json({
        selected: false,
        message: "Previously selected item no longer exists",
        selectedItem: null,
      });
    }

    res.json({
      selected: true,
      selectedItemId: currentSelectedItem.itemId,
      timestamp: currentSelectedItem.timestamp,
      selectedItem: {
        id: item.id,
        type: item.type,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        title: item.title || item.content?.title || null,
        content: item.content || null,
        // Include type-specific data
        ...(item.type === "todo" && { todoData: item.todoData }),
        ...(item.type === "agent" && { agentData: item.agentData }),
        ...(item.type === "lab-result" && { labData: item.labData }),
        ...(item.type === "ehr-data" && { ehrData: item.ehrData }),
        ...(item.type === "doctor-note" && { noteData: item.noteData }),
        ...(item.type === "component" && {
          componentType: item.componentType,
          props: item.content?.props,
        }),
      },
    });
  } catch (error) {
    console.error("Error getting selected item:", error);
    res.status(500).json({ error: "Failed to get selected item" });
  }
});

// POST /api/reset-cache - Force reload data from file
app.post("/api/reset-cache", async (req, res) => {
  try {
    // Simply reload from file - this clears any in-memory items
    const items = await loadBoardItems();
    console.log(`🔄 Cache reset: loaded ${items.length} items from file`);

    res.json({
      success: true,
      message: `Cache reset successfully. Loaded ${items.length} items from file.`,
      itemCount: items.length,
    });
  } catch (error) {
    console.error("Error resetting cache:", error);
    res.status(500).json({ error: "Failed to reset cache" });
  }
});

// DELETE /api/task-zone - Clear all API items from Task Management Zone
app.delete("/api/task-zone", async (req, res) => {
  try {
    const items = await loadBoardItems();

    // Filter out items in Task Management Zone that are API-created
    const filteredItems = items.filter((item) => {
      const inTaskZone =
        item.x >= TASK_ZONE.x &&
        item.x < TASK_ZONE.x + TASK_ZONE.width &&
        item.y >= TASK_ZONE.y &&
        item.y < TASK_ZONE.y + TASK_ZONE.height;

      const isApiItem = item.type === "todo";

      return !(inTaskZone && isApiItem);
    });

    const removedCount = items.length - filteredItems.length;

    await saveBoardItems(filteredItems);

    console.log(
      `🧹 Cleared ${removedCount} API items from Task Management Zone`
    );

    res.json({
      success: true,
      message: `Cleared ${removedCount} API items from Task Management Zone`,
      removedCount,
      remainingCount: filteredItems.length,
    });
  } catch (error) {
    console.error("Error clearing task zone:", error);
    res.status(500).json({ error: "Failed to clear task zone" });
  }
});

// DELETE /api/dynamic-items - Delete ALL dynamically added items (keeps only static data)
app.delete("/api/dynamic-items", async (req, res) => {
  try {
    console.log("🗑️  Deleting all dynamically added items...");

    // Load current items
    const currentItems = await loadBoardItems();
    console.log(`📊 Current total items: ${currentItems.length}`);

    // Load static items from source
    const sourceDataPath = path.join(__dirname, "data", "boardItems.json");
    const sourceData = await fs.readFile(sourceDataPath, "utf8");
    const staticItems = JSON.parse(sourceData);
    const staticIds = new Set(staticItems.map((item) => item.id));

    console.log(`📁 Static items: ${staticItems.length}`);

    // Filter to keep only static items
    const filteredItems = currentItems.filter((item) => staticIds.has(item.id));
    const removedCount = currentItems.length - filteredItems.length;

    // Save the filtered list
    await saveBoardItems(filteredItems);

    console.log(
      `✅ Removed ${removedCount} dynamic items, kept ${filteredItems.length} static items`
    );

    // Broadcast reset event to all connected clients
    broadcastSSE({
      event: "items-reset",
      message: "Dynamic items cleared",
      removedCount,
      remainingCount: filteredItems.length,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Deleted ${removedCount} dynamically added items. ${filteredItems.length} static items remain.`,
      removedCount,
      remainingCount: filteredItems.length,
      staticItemsCount: staticItems.length,
    });
  } catch (error) {
    console.error("❌ Error deleting dynamic items:", error);
    res.status(500).json({
      error: "Failed to delete dynamic items",
      details: error.message,
    });
  }
});

// Root API endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Canvas Board API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      boardItems: "/api/board-items",
      events: "/api/events (SSE)",
      joinMeeting: "/api/join-meeting",
      resetCache: "POST /api/reset-cache",
      clearTaskZone: "DELETE /api/task-zone",
      clearDynamicItems: "DELETE /api/dynamic-items",
    },
    documentation: "https://github.com/your-repo/board-v4-working",
  });
});

// POST /api/patient-report - Create a new Patient Report
app.post("/api/patient-report", async (req, res) => {
  try {
    console.log("📋 POST /api/patient-report - Creating Patient Report");

    let { patientData, zone, x, y, width, height } = req.body || {};

    // If patientData is not provided but name/mrn exists at root, use the whole body as patientData
    if (!patientData && req.body.name && req.body.mrn) {
      patientData = req.body;
    }

    // Validate required fields
    if (!patientData || !patientData.name || !patientData.mrn) {
      return res.status(400).json({
        error: "patientData object with name and mrn is required",
      });
    }

    // Zone configuration mapping (matches src/data/zone-config.json)
    const zoneConfig = {
      "adv-event-zone": { x: -3000, y: 3500, width: 4000, height: 2300 },
      "dili-analysis-zone": { x: -2375, y: 7700, width: 2750, height: 3800 },
      "patient-report-zone": { x: -425, y: 13300, width: 2750, height: 3800 },
      "medico-legal-report-zone": { x: -4150, y: 13300, width: 2750, height: 3800 },
      "report-zone": { x: -4375, y: 13100, width: 6750, height: 4400 },
      "raw-ehr-data-zone": { x: -1000, y: -6600, width: 5000, height: 2500 },
      "data-zone": { x: -3500, y: 500, width: 5000, height: 1500 },

      "retrieved-data-zone": { x: 5800, y: -4600, width: 2000, height: 2100 },
      "doctors-note-zone": { x: 2600, y: 12400, width: 2000, height: 2100 },
      "task-management-zone": { x: 5800, y: -2300, width: 2000, height: 2100 },
      "easl-chatbot-zone": { x: 1000, y: 7000, width: 2000, height: 1400 },
    };

    // Build item
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const itemWidth = width || 2200; // Much wider two-column layout
    const itemHeight = height || 850;

    // Load existing items for positioning
    const existingItems = await loadBoardItems();
    console.log(`🔍 Loaded ${existingItems.length} existing items for positioning`);

    // Determine position based on zone parameter
    let itemX, itemY;
    if (x !== undefined && y !== undefined) {
      itemX = x;
      itemY = y;
      console.log(`📍 Using provided coordinates for Patient Report at (${itemX}, ${itemY})`);
    } else if (zone && zoneConfig[zone]) {
      const targetZone = zoneConfig[zone];
      const tempItem = { type: "patient-report", width: itemWidth, height: itemHeight };
      const zonePosition = findPositionInZone(tempItem, existingItems, targetZone);
      itemX = zonePosition.x;
      itemY = zonePosition.y;
      console.log(`📍 Auto-positioned Patient Report in ${zone} at (${itemX}, ${itemY})`);
    } else {
      // Default to Patient Report Zone
      const targetZone = zoneConfig["patient-report-zone"];
      const tempItem = { type: "patient-report", width: itemWidth, height: itemHeight };
      const zonePosition = findPositionInZone(tempItem, existingItems, targetZone);
      itemX = zonePosition.x;
      itemY = zonePosition.y;
      console.log(`📍 Auto-positioned Patient Report in Patient Report Zone (default) at (${itemX}, ${itemY})`);
    }

    const newItem = {
      id,
      type: "patient-report",
      x: itemX,
      y: itemY,
      width: itemWidth,
      height: itemHeight,
      content: "Patient Report",
      color: "#ffffff",
      rotation: 0,
      patientData: {
        ...patientData,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE
    const payload = {
      event: "new-item",
      item: newItem,
      timestamp: new Date().toISOString(),
      action: "created",
      zone: zone || "patient-report-zone",
    };
    broadcastSSE(payload);

    console.log(`✅ Created Patient Report ${id} in ${zone || "task-management-zone"} at (${itemX}, ${itemY})`);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating Patient Report:", error);
    res.status(500).json({ error: "Failed to create Patient Report" });
  }
});

// POST /api/diagnostic-report - Create a new Diagnostic Report
app.post("/api/diagnostic-report", async (req, res) => {
  try {
    console.log("🔬 POST /api/diagnostic-report - Creating Diagnostic Report");

    let { diagnosticData, zone, x, y, width, height } = req.body || {};

    // If diagnosticData is not provided but patientInformation exists at root, use the whole body as diagnosticData
    if (!diagnosticData && req.body.patientInformation) {
      diagnosticData = req.body;
    }

    // Validate required fields
    if (!diagnosticData || !diagnosticData.patientInformation) {
      return res.status(400).json({
        error: "diagnosticData object with patientInformation is required",
      });
    }

    // Zone configuration mapping (matches src/data/zone-config.json)
    const zoneConfig = {
      "adv-event-zone": { x: -3000, y: 3500, width: 4000, height: 2300 },
      "dili-analysis-zone": { x: -2250, y: 7700, width: 2750, height: 3800 },
      "patient-report-zone": { x: -675, y: 12600, width: 2750, height: 3800 },
      "medico-legal-report-zone": { x: -4150, y: 12600, width: 2750, height: 3800 },
      "report-zone": { x: -4375, y: 12400, width: 6750, height: 4400 },
      "raw-ehr-data-zone": { x: -1000, y: -6600, width: 5000, height: 2500 },
      "data-zone": { x: -3500, y: 500, width: 5000, height: 1500 },
      "retrieved-data-zone": { x: 5800, y: -4600, width: 2000, height: 2100 },
      "doctors-note-zone": { x: 2600, y: 12400, width: 2000, height: 2100 },
      "task-management-zone": { x: 5800, y: -2300, width: 2000, height: 2100 },
      "easl-chatbot-zone": { x: 1000, y: 7000, width: 2000, height: 1400 },
    };
    // Build item
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const itemWidth = width || 2400; // Much wider for two-column layout with more content
    const itemHeight = height || 900;

    // Load existing items for positioning
    const existingItems = await loadBoardItems();
    console.log(`🔍 Loaded ${existingItems.length} existing items for positioning`);

    // Determine position based on zone parameter
    let itemX, itemY;
    if (x !== undefined && y !== undefined) {
      itemX = x;
      itemY = y;
      console.log(`📍 Using provided coordinates for Diagnostic Report at (${itemX}, ${itemY})`);
    } else if (zone && zoneConfig[zone]) {
      const targetZone = zoneConfig[zone];
      const tempItem = { type: "diagnostic-report", width: itemWidth, height: itemHeight };
      const zonePosition = findPositionInZone(tempItem, existingItems, targetZone);
      itemX = zonePosition.x;
      itemY = zonePosition.y;
      console.log(`📍 Auto-positioned Diagnostic Report in ${zone} at (${itemX}, ${itemY})`);
    } else {
      // Default to DILI Analysis Zone
      const targetZone = zoneConfig["dili-analysis-zone"];
      const tempItem = { type: "diagnostic-report", width: itemWidth, height: itemHeight };
      const zonePosition = findPositionInZone(tempItem, existingItems, targetZone);
      itemX = zonePosition.x;
      itemY = zonePosition.y;
      console.log(`📍 Auto-positioned Diagnostic Report in DILI Analysis Zone (default) at (${itemX}, ${itemY})`);
    }

    const newItem = {
      id,
      type: "diagnostic-report",
      x: itemX,
      y: itemY,
      width: itemWidth,
      height: itemHeight,
      content: "Diagnostic Report",
      color: "#ffffff",
      rotation: 0,
      diagnosticData: {
        ...diagnosticData,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE
    const payload = {
      event: "new-item",
      item: newItem,
      timestamp: new Date().toISOString(),
      action: "created",
      zone: zone || "dili-analysis-zone",
    };
    broadcastSSE(payload);

    console.log(`✅ Created Diagnostic Report ${id} in ${zone || "dili-analysis-zone"} at (${itemX}, ${itemY})`);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating Diagnostic Report:", error);
    res.status(500).json({ error: "Failed to create Diagnostic Report" });
  }
});

// POST /api/legal-compliance - Create a new Legal Compliance Report
app.post("/api/legal-compliance", async (req, res) => {
  try {
    console.log("⚖️ POST /api/legal-compliance - Creating Legal Compliance Report");

    let { legalData, zone, x, y, width, height } = req.body || {};

    // If legalData is not provided but identification_verification exists at root, use the whole body as legalData
    if (!legalData && req.body.identification_verification) {
      legalData = req.body;
    }

    // Validate required fields
    if (!legalData || !legalData.identification_verification) {
      return res.status(400).json({
        error: "legalData object with identification_verification is required",
      });
    }

    // Zone configuration mapping (matches src/data/zone-config.json)
    const zoneConfig = {
      "adv-event-zone": { x: -3000, y: 3500, width: 4000, height: 2300 },
      "dili-analysis-zone": { x: -2375, y: 7000, width: 2750, height: 3800 },
      "patient-report-zone": { x: -425, y: 12600, width: 2750, height: 3800 },
      "medico-legal-report-zone": { x: -3930, y: 13564, width: 2750, height: 3800 },
      "report-zone": { x: -4375, y: 12400, width: 6750, height: 4400 },
      "raw-ehr-data-zone": { x: -1000, y: -6600, width: 5000, height: 2500 },
      "data-zone": { x: -3500, y: 500, width: 5000, height: 1500 },
      "retrieved-data-zone": { x: 5800, y: -4600, width: 2000, height: 2100 },
      "doctors-note-zone": { x: 2600, y: 12400, width: 2000, height: 2100 },
      "task-management-zone": { x: 5800, y: -2300, width: 2000, height: 2100 },
      "easl-chatbot-zone": { x: 1000, y: 7000, width: 2000, height: 1400 },
    };

    // Build item
    const id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const itemWidth = width || 2200; // Wide two-column layout
    const itemHeight = height || 850;

    // Load existing items for positioning
    const existingItems = await loadBoardItems();
    console.log(`🔍 Loaded ${existingItems.length} existing items for positioning`);

    // Determine position based on zone parameter
    let itemX, itemY;
    if (x !== undefined && y !== undefined) {
      itemX = x;
      itemY = y;
      console.log(`📍 Using provided coordinates for Legal Compliance at (${itemX}, ${itemY})`);
    } else if (zone && zoneConfig[zone]) {
      const targetZone = zoneConfig[zone];
      const tempItem = { type: "legal-compliance", width: itemWidth, height: itemHeight };
      const zonePosition = findPositionInZone(tempItem, existingItems, targetZone);
      itemX = zonePosition.x;
      itemY = zonePosition.y;
      console.log(`📍 Auto-positioned Legal Compliance in ${zone} at (${itemX}, ${itemY})`);
    } else {
      // Default to Medico-Legal Report Zone
      const targetZone = zoneConfig["medico-legal-report-zone"];
      const tempItem = { type: "legal-compliance", width: itemWidth, height: itemHeight };
      const zonePosition = findPositionInZone(tempItem, existingItems, targetZone);
      itemX = zonePosition.x;
      itemY = zonePosition.y;
      console.log(`📍 Auto-positioned Legal Compliance in Medico-Legal Report Zone (default) at (${itemX}, ${itemY})`);
    }

    const newItem = {
      id,
      type: "legal-compliance",
      x: itemX,
      y: itemY,
      width: itemWidth,
      height: itemHeight,
      content: "Legal Compliance Report",
      color: "#ffffff",
      rotation: 0,
      legalData: {
        ...legalData,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist
    const items = [...existingItems, newItem];
    await saveBoardItems(items);

    // Notify live clients via SSE
    const payload = {
      event: "new-item",
      item: newItem,
      timestamp: new Date().toISOString(),
      action: "created",
      zone: zone || "medico-legal-report-zone",
    };
    broadcastSSE(payload);

    console.log(`✅ Created Legal Compliance ${id} in ${zone || "medico-legal-report-zone"} at (${itemX}, ${itemY})`);

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating Legal Compliance:", error);
    res.status(500).json({ error: "Failed to create Legal Compliance" });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  let redisStatus = "disconnected";
  let redisInfo = null;

  if (isRedisConnected && redisClient) {
    try {
      await redisClient.ping();
      redisStatus = "connected";
      const itemsData = await redisClient.get("boardItems");
      const itemCount = itemsData ? JSON.parse(itemsData).length : 0;
      redisInfo = {
        itemCount,
        configured: true,
      };
    } catch (error) {
      redisStatus = "error";
      redisInfo = { error: error.message };
    }
  } else if (process.env.REDIS_URL) {
    redisStatus = "configured but not connected";
  } else {
    redisStatus = "not configured";
  }

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    storage: isRedisConnected ? "redis (persistent)" : "fallback (static file)",
    redis: {
      status: redisStatus,
      ...redisInfo,
    },
  });
});

// Initialize Redis on startup
initRedis().then(() => {
  if (isRedisConnected) {
    initializeRedisPubSub();
  }
}).catch((error) => {
  console.error("❌ Failed to initialize Redis on startup:", error);
  console.log("⚠️  Server will continue with static file fallback");
});

// Export for Vercel serverless
module.exports = app;

// Start server (only in local development)
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(
      `🔗 Redis URL configured: ${process.env.REDIS_URL ? "Yes" : "No"}`
    );

    // Try to connect to Redis
    if (process.env.REDIS_URL) {
      console.log("🔄 Connecting to Redis...");
      const connected = await initRedis();
      if (connected) {
        console.log("✅ Redis connection successful");
        await initializeRedisPubSub();
      } else {
        console.log("⚠️  Redis connection failed, using static file fallback");
      }
    }
  });
}
