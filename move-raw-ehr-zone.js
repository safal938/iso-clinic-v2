/**
 * Script to move zones and all their contents up by 3000px
 * This includes:
 * - The zone definitions in zone-config.json
 * - All board items (nodes, components, ehrHubs, sub-zones) within the zone boundaries
 */

const fs = require('fs');
const path = require('path');

const MOVE_OFFSET_Y = -3000; // Move up by 3000px (negative Y = up)

// Zones to move with their boundaries
const ZONES_TO_MOVE = [
  {
    name: 'retrieved-data-zone',
    x: 5800,
    y: -4600,
    width: 2000,
    height: 2100
  },
  {
    name: 'task-management-zone',
    x: 5800,
    y: -2300,
    width: 2000,
    height: 2100
  }
];

console.log('Zones to move:');
ZONES_TO_MOVE.forEach(zone => {
  console.log(`  ${zone.name}: X(${zone.x} to ${zone.x + zone.width}), Y(${zone.y} to ${zone.y + zone.height})`);
});
console.log(`  Moving by: ${MOVE_OFFSET_Y}px (up)`);
console.log('');

/**
 * Check if an item is within any of the zones to move
 */
function isItemInZones(item) {
  const itemX = item.x;
  const itemY = item.y;
  
  return ZONES_TO_MOVE.some(zone => {
    const zoneMinX = zone.x;
    const zoneMaxX = zone.x + zone.width;
    const zoneMinY = zone.y;
    const zoneMaxY = zone.y + zone.height;
    
    return (
      itemX >= zoneMinX &&
      itemX <= zoneMaxX &&
      itemY >= zoneMinY &&
      itemY <= zoneMaxY
    );
  });
}

/**
 * Update zone-config.json
 */
function updateZoneConfig() {
  const filePath = path.join(__dirname, 'src/data/zone-config.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const zoneNames = ZONES_TO_MOVE.map(z => z.name);
  let updatedCount = 0;
  
  data.zones.forEach(zone => {
    if (zoneNames.includes(zone.name)) {
      console.log(`Updating zone: ${zone.name}`);
      console.log(`  Old Y: ${zone.y}`);
      zone.y += MOVE_OFFSET_Y;
      console.log(`  New Y: ${zone.y}`);
      updatedCount++;
    }
  });
  
  if (updatedCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✓ Updated ${updatedCount} zones in zone-config.json\n`);
  }
  
  return updatedCount;
}

/**
 * Update boardItems.json files
 */
function updateBoardItems(filePath) {
  console.log(`Processing: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  File not found, skipping.\n`);
    return 0;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updatedCount = 0;
  
  data.forEach(item => {
    if (isItemInZones(item)) {
      console.log(`  Moving item: ${item.id || item.type} (${item.componentType || item.type})`);
      console.log(`    Old position: (${item.x}, ${item.y})`);
      item.y += MOVE_OFFSET_Y;
      console.log(`    New position: (${item.x}, ${item.y})`);
      updatedCount++;
    }
  });
  
  if (updatedCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✓ Updated ${updatedCount} items in ${path.basename(filePath)}\n`);
  } else {
    console.log(`  No items found in zone.\n`);
  }
  
  return updatedCount;
}

// Main execution
console.log('='.repeat(60));
console.log('Moving retrieved-data-zone and task-management-zone up by 3000px');
console.log('='.repeat(60));
console.log('');

// Update zone config
updateZoneConfig();

// Update board items in src/data
const srcBoardItemsPath = path.join(__dirname, 'src/data/boardItems.json');
const srcCount = updateBoardItems(srcBoardItemsPath);

// Update board items in api/data
const apiBoardItemsPath = path.join(__dirname, 'api/data/boardItems.json');
const apiCount = updateBoardItems(apiBoardItemsPath);

console.log('='.repeat(60));
console.log('Summary:');
console.log(`  Zones moved: ${ZONES_TO_MOVE.map(z => z.name).join(', ')}`);
console.log(`  Items moved in src/data/boardItems.json: ${srcCount}`);
console.log(`  Items moved in api/data/boardItems.json: ${apiCount}`);
console.log(`  Total offset: ${MOVE_OFFSET_Y}px (Y axis)`);
console.log('='.repeat(60));
