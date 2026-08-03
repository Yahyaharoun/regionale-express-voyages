const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

const featuresDeposits = 'src/features/deposits';
const featuresRecettes = 'src/features/recettes';

copyFolderSync(featuresDeposits, featuresRecettes);

// Rename file
fs.renameSync(path.join(featuresRecettes, 'DepositForm.tsx'), path.join(featuresRecettes, 'RecetteForm.tsx'));

function replaceInFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            content = content.replace(/DepositForm/g, 'RecetteForm');
            content = content.replace(/depositSchema/g, 'recetteSchema');
            content = content.replace(/createDepositAction/g, 'createRecetteAction');
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
            
            fs.writeFileSync(fullPath, content);
        }
    }
}

replaceInFiles(featuresRecettes);
console.log('Recettes features created.');
