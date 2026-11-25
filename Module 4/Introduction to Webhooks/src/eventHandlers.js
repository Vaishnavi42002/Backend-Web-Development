'use strict';

// ─── GIVEN FILE — do not modify ───────────────────────────────────────────────
// Stub event handler: tracks calls for testing purposes

let callCount = 0;
const processedEvents = [];

async function handleEvent(event) {
  callCount++;
  processedEvents.push(event.id);
  console.log(`[handleEvent] processing event ${event.id} (type: ${event.type})`);
  // In production: update DB, send notifications, etc.
}

function getCallCount() { return callCount; }
function getProcessedEvents() { return [...processedEvents]; }
function resetCallCount() { callCount = 0; processedEvents.length = 0; }

module.exports = { handleEvent, getCallCount, getProcessedEvents, resetCallCount };
