/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- TU JEST ZMIANA
    autoprefixer: {},
  },
};

export default config;