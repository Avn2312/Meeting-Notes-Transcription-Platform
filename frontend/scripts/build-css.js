const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const inputCss = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';
const globalsCssPath = path.join(__dirname, '../src/app/globals.css');

postcss([
  tailwind({
    darkMode: 'class',
    content: [path.join(__dirname, '../src/**/*.{js,ts,jsx,tsx}')],
    theme: {
      extend: {
        colors: {
          violet: {
            50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
            400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
            800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065',
          }
        }
      }
    }
  }),
  autoprefixer
]).process(inputCss, { from: globalsCssPath, to: globalsCssPath })
.then(result => {
  fs.writeFileSync(globalsCssPath, result.css);
  console.log('✓ Compiled Tailwind CSS successfully (' + Math.round(result.css.length / 1024) + ' KB)');
})
.catch(err => {
  console.error('Error compiling Tailwind CSS:', err);
});

