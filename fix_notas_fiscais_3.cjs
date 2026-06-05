const fs = require('fs');
const path = './src/components/NotasFiscais.tsx';
let content = fs.readFileSync(path, 'utf8');

// replace incorrect text-gray definitions to make sure inputs have white text in dark mode
content = content.replace(/text-gray-700 dark:text-gray-300 appearance-none cursor-pointer shadow-sm text-gray-900 dark:text-gray-100/g, 'text-gray-800 dark:text-white appearance-none cursor-pointer shadow-sm');
content = content.replace(/bg-gray-50 dark:bg-gray-800 dark:text-gray-100 text-gray-900/g, 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white');

// fix the "ao selecionar fica esquisito branco e a letra no digitar no lançar ficapreto deveria ser branco"
// inputs in lancar have "text-gray-900 dark:text-gray-100" let's just make sure all inputs have dark:text-white
content = content.replace(/text-gray-900 dark:text-gray-100/g, 'text-gray-900 dark:text-white');
content = content.replace(/dark:bg-blue-900\/20 cursor-pointer/g, 'dark:hover:bg-blue-900/30 cursor-pointer');

// Fix text-gray-900 dark:text-white in general for the inputs
content = content.replace(/className="([^"]*outline-none[^"]*)"/g, (match, p1) => {
    let replaced = p1;
    if(replaced.includes("dark:text-gray-100")) replaced = replaced.replace("dark:text-gray-100", "dark:text-white");
    return `className="${replaced}"`;
});

content = content.replace(/bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white/g, 'bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white'); // it was already text-gray-900 dark:text-white (changed above)

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed inputs');
