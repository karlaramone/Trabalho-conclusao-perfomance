const fs = require('fs');
const { faker } = require('@faker-js/faker');

const args = process.argv.slice(2);
const count = parseInt(args[0], 10) || 100;
const out = args[1] || 'tmp/emails.json';

const emails = [];
for (let i = 0; i < count; i++) {
  emails.push(faker.internet.email().toLowerCase());
}

fs.mkdirSync(require('path').dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(emails, null, 2));
console.log(`Wrote ${emails.length} emails to ${out}`);
