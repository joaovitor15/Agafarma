const fs = require('fs');
const path = './src/components/NotasFiscais.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replacements
content = content.replace(/bg-gray-50\/50/g, 'bg-gray-50\/50 dark:bg-gray-800\/50');
content = content.replace(/bg-gray-50(?! dark:bg)/g, 'bg-gray-50 dark:bg-gray-800/50');
content = content.replace(/hover:bg-red-50(?! dark:hover:bg)/g, 'hover:bg-red-50 dark:hover:bg-red-900/30');
content = content.replace(/disabled:bg-gray-100(?! dark:disabled:bg)/g, 'disabled:bg-gray-100 dark:disabled:bg-gray-800');
content = content.replace(/disabled:text-gray-400(?! dark:disabled:text)/g, 'disabled:text-gray-400 dark:disabled:text-gray-600');

fs.writeFileSync(path, content, 'utf8');
console.log('Refinements done!');
