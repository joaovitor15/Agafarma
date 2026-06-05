const fs = require('fs');

const path = './src/components/NotasFiscais.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace bg-white
content = content.replace(/bg-white/g, 'bg-white dark:bg-gray-800');

// Replace text-gray-800
content = content.replace(/text-gray-800/g, 'text-gray-800 dark:text-gray-100');

// Replace text-gray-900
content = content.replace(/text-gray-900/g, 'text-gray-900 dark:text-gray-100');

// Replace text-gray-700
content = content.replace(/text-gray-700/g, 'text-gray-700 dark:text-gray-300');

// Replace text-gray-600
content = content.replace(/text-gray-600/g, 'text-gray-600 dark:text-gray-400');

// Replace text-gray-500
content = content.replace(/text-gray-500/g, 'text-gray-500 dark:text-gray-400');

// Replace border-gray-100
content = content.replace(/border-gray-100/g, 'border-gray-100 dark:border-gray-700');

// Replace border-gray-200
content = content.replace(/border-gray-200/g, 'border-gray-200 dark:border-gray-700');

// Replace border-gray-300
content = content.replace(/border-gray-300/g, 'border-gray-300 dark:border-gray-600');

// Fix duplicated dark mode classes if any (just in case)
content = content.replace(/dark:bg-gray-800 dark:bg-gray-800/g, 'dark:bg-gray-800');
content = content.replace(/dark:text-gray-100 dark:text-gray-100/g, 'dark:text-gray-100');
content = content.replace(/dark:text-gray-300 dark:text-gray-300/g, 'dark:text-gray-300');
content = content.replace(/dark:text-gray-400 dark:text-gray-400/g, 'dark:text-gray-400');
content = content.replace(/dark:border-gray-700 dark:border-gray-700/g, 'dark:border-gray-700');
content = content.replace(/dark:border-gray-600 dark:border-gray-600/g, 'dark:border-gray-600');

// Fix specific input styles
content = content.replace(/bg-blue-50/g, 'bg-blue-50 dark:bg-blue-900\/20');

// Fix 'bg-[#0066b3]' not needing dark if it's primary, but maybe adjusting hover
// content = content.replace(/hover:bg-gray-50/g, 'hover:bg-gray-50 dark:hover:bg-gray-700');
content = content.replace(/hover:bg-gray-50/g, 'hover:bg-gray-50 dark:hover:bg-gray-700');

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');
