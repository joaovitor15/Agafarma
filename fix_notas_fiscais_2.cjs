const fs = require('fs');
const path = './src/components/NotasFiscais.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the Valor Final inputs
content = content.replace(/border-\[\#0066b3\]\/30 bg-blue-50 dark:bg-blue-900\/20\/50/g, 'border-[#0066b3]/30 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-900/20');
content = content.replace(/text-\[\#0066b3\] font-bold outline-none text-sm focus:ring-2 focus:ring-\[\#0066b3\]/g, 'text-[#0066b3] dark:text-blue-400 font-bold outline-none text-sm focus:ring-2 focus:ring-[#0066b3]');

// Fix another one if exist for Vencidos
content = content.replace(/bg-blue-50 dark:bg-blue-900\/20\/50/g, 'bg-blue-50 dark:bg-blue-900/20');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed additional inputs');
