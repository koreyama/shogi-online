
const fs = require('fs');
const path = require('path');

const dataPath = path.resolve('server/src/lib/quiz/data.ts');
const content = fs.readFileSync(dataPath, 'utf8');

// Extract the array content
const match = content.match(/export const QUIZ_DATA: QuizQuestion\[\] = \[([\s\S]*)\];/);
if (!match) {
    console.log("Could not find QUIZ_DATA array");
    process.exit(1);
}

const arrayContent = match[1];
const lines = arrayContent.split('\n');

const counts = {};

lines.forEach(line => {
    const categoryMatch = line.match(/category: "([^"]+)"/);
    if (categoryMatch) {
        const category = categoryMatch[1];
        counts[category] = (counts[category] || 0) + 1;
    }
});

console.log("Current Counts per Category:");
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`${cat}: ${count}`);
});
