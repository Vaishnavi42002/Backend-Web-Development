/**
 * Node.js Runtime Features — Streams, Buffers & the File System
 */

const fs = require('fs');
const path = require('path');

// Absolute, OS-safe path to the sample file
const INPUT = path.join(__dirname, 'sample-data.txt');
const OUTPUT = path.join(__dirname, 'sample-copy.txt');

// ── PART 1: read the whole file into memory ──────────────────────────────
function readWholeFile() {

    fs.readFile(INPUT, (err, data) => {

        // Check for error
        if (err) {
            console.log("Error reading file:", err);
            return;
        }

        // data is a Buffer
        console.log(
            `readFile: loaded ${data.length} bytes into memory`
        );
    });
}

// ── PART 2: stream the file and copy it ─────────────────────────────────
function streamFile() {

    // Create readable stream
    const readable = fs.createReadStream(INPUT);

    // Create writable stream
    const writable = fs.createWriteStream(OUTPUT);

    // Copy data from readable stream to writable stream
    readable.pipe(writable);

    // When copying is finished
    writable.on("finish", () => {
        console.log(
            "stream: finished copying via chunks (flat memory)"
        );
    });

    // Handle errors
    readable.on("error", (err) => {
        console.log("Error reading stream:", err);
    });

    writable.on("error", (err) => {
        console.log("Error writing stream:", err);
    });
}

// ── PART 3: explanation ─────────────────────────────────────────────────

/*
readFile loads the entire file into memory at once, so a large file
can consume a lot of RAM. A stream reads and moves the file in small
chunks, so it uses much less memory and keeps peak memory nearly flat
even when the file is very large.
*/

// Run both approaches
readWholeFile();
streamFile();

module.exports = {
    readWholeFile,
    streamFile,
    INPUT,
    OUTPUT
};