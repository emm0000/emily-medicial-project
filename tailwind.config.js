/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0061a4',
        'on-primary': '#ffffff',
        'primary-container': '#d1e4ff',
        'on-primary-container': '#001d36',
        'secondary': '#535f70',
        'on-secondary': '#ffffff',
        'secondary-container': '#d7e3f7',
        'on-secondary-container': '#101c2b',
        'tertiary': '#6b5778',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#f2daff',
        'on-tertiary-container': '#251431',
        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#410002',
        'background': '#fdfcff',
        'on-background': '#1a1c1e',
        'surface': '#fdfcff',
        'on-surface': '#1a1c1e',
        'surface-variant': '#dfe2eb',
        'on-surface-variant': '#43474e',
        'outline': '#73777f',
        'outline-variant': '#c3c7cf',
        'surface-container-highest': '#e2e2e6',
        'surface-container-high': '#e8e8ec',
        'surface-container': '#eeeeF2',
        'surface-container-low': '#f3f3f7',
        'surface-container-lowest': '#ffffff',
      }
    },
  },
  plugins: [],
}
