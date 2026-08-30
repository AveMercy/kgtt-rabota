const fs = require('fs');

const json = fs.readFileSync('courses.json', 'utf-8');
const ts = `import type { Course } from '@/types/lecture';\n\nexport const courses: Course[] = ${json};\n`;

fs.writeFileSync('src/data/courses.ts', ts);
console.log('✅ courses.ts обновлён!');