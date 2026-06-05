const fs = require('fs');
const path = './src/components/NotasFiscais.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/bg-gray-100 hover:bg-gray-200(?! dark:bg-gray-700)/g, 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600');
content = content.replace(/bg-red-50 text-red-600 rounded-full hover:bg-red-100(?! dark:bg-red-900\/30)/g, 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40');
content = content.replace(/bg-red-100(?! dark:bg-red-900\/30)/g, 'bg-red-100 dark:bg-red-900/30');

fs.writeFileSync(path, content, 'utf8');
console.log('Final refinement done!');
