const fs = require('fs');

function replaceColors(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');

    // Replace teal with red
    content = content.replace(/teal-(\d+)/g, 'red-$1');
    // Replace emerald with red
    content = content.replace(/emerald-(\d+)/g, 'red-$1');
    
    // Specific hex replacements for gradients
    content = content.replace(/#14b8a6/g, '#b91c1c');
    content = content.replace(/#0d9488/g, '#991b1b');
    content = content.replace(/#0f766e/g, '#7f1d1d');

    fs.writeFileSync(filepath, content, 'utf-8');
}

replaceColors(String.raw`c:\Users\eMu\emuList-M-S-G\src\frontend\pages\MyShowsPage.tsx`);
replaceColors(String.raw`c:\Users\eMu\emuList-M-S-G\src\frontend\pages\HomePage.tsx`);

console.log("Color replacement complete.");
