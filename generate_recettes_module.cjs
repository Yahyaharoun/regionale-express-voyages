const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
    fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

const depositsPath = 'src/app/dashboard/deposits';
const recettesPath = 'src/app/dashboard/recettes';

// 1. Copy directory
copyFolderSync(depositsPath, recettesPath);

// 2. Recursively replace terms in files
function replaceInFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Replacements
            content = content.replace(/Versements bancaires/g, 'Recettes journalières');
            content = content.replace(/Versement bancaire/g, 'Recette journalière');
            content = content.replace(/versement bancaire/gi, 'recette journalière');
            content = content.replace(/versements bancaires/gi, 'recettes journalières');
            
            content = content.replace(/Versements/g, 'Recettes');
            content = content.replace(/Versement/g, 'Recette');
            content = content.replace(/versement/gi, 'recette');
            content = content.replace(/VERSEMENT/g, 'RECETTE');
            
            content = content.replace(/deposits/g, 'recettes');
            content = content.replace(/deposit/g, 'recette');
            
            content = content.replace(/createDepositAction/g, 'createRecetteAction');
            
            // Fix grammar
            content = content.replace(/un recette/gi, 'une recette');
            content = content.replace(/Un recette/gi, 'Une recette');
            content = content.replace(/ce recette/gi, 'cette recette');
            content = content.replace(/Ce recette/gi, 'Cette recette');
            content = content.replace(/le recette/gi, 'la recette');
            content = content.replace(/Le recette/gi, 'La recette');
            content = content.replace(/Nouveau Recette/gi, 'Nouvelle Recette');
            
            // Remove Bank fields from form/table since Recette doesn't have a Bank
            // This is a rough replace, we will clean it up further if needed.
            content = content.replace(/bank/gi, 'agency'); // fallback hack, will clean up manually if needed
            
            fs.writeFileSync(fullPath, content);
        }
    }
}

replaceInFiles(recettesPath);
console.log('Recettes module created successfully.');
