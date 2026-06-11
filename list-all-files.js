import fs from 'fs';
import path from 'path';

function findFiles(dir, list = []) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fullPath.includes('node_modules') || fullPath.includes('.git') || fullPath.includes('.cache')) continue;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          findFiles(fullPath, list);
        } else {
          if (/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file)) {
            list.push(fullPath);
          }
        }
      } catch (err) {}
    }
  } catch (err) {}
  return list;
}

const images = findFiles('.');
console.log('Images in project:', images);
