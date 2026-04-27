import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function getRelativePath(fromFile, toFile) {
  let relativePath = path.relative(path.dirname(fromFile), toFile);
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  return relativePath.replace(/\\/g, '/').replace('.jsx', '');
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      if (fullPath.includes('src\\utils\\toast.jsx') || fullPath.includes('src/utils/toast.jsx')) continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We also need to be careful with App.jsx which imports ToastContainer
      if (fullPath.includes('App.jsx') || fullPath.includes('main.jsx')) {
         // App.jsx might import toast, but wait, looking at my earlier grep App.jsx only imports ToastContainer? No, earlier grep showed App.jsx. Let's check it manually if needed.
         // Actually, let's just replace exact match of `import { toast } from "react-toastify";`
         // or `import { toast } from 'react-toastify';`
      }
      
      const regex1 = /import\s*{\s*toast\s*}\s*from\s*["']react-toastify["'];?/g;
      const regex2 = /import\s*toast\s*from\s*["']react-toastify["'];?/g; // just in case
      
      let changed = false;
      
      if (regex1.test(content) || regex2.test(content)) {
        const toastPath = path.join(srcDir, 'utils', 'toast.jsx');
        const relativeImportPath = getRelativePath(fullPath, toastPath);
        
        content = content.replace(regex1, `import { toast } from "${relativeImportPath}";`);
        content = content.replace(regex2, `import { toast } from "${relativeImportPath}";`);
        changed = true;
      }
      
      // Handle the case where they import multiple things like `import { toast, ToastContainer } from "react-toastify";`
      const regex3 = /import\s*{\s*([^}]*?)toast([^}]*?)\s*}\s*from\s*["']react-toastify["'];?/g;
      const match = regex3.exec(content);
      if (match && !changed) {
          // It's a mixed import. Remove toast from it and add new import
          const remaining = match[0].replace(/\btoast\b\s*,?/, '').replace(/,\s*}/, '}');
          const toastPath = path.join(srcDir, 'utils', 'toast.jsx');
          const relativeImportPath = getRelativePath(fullPath, toastPath);
          
          content = content.replace(match[0], `${remaining}\nimport { toast } from "${relativeImportPath}";`);
          changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Done.');
