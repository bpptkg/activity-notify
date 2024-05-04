const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: 'BPPTKG Notify',
      fileName: (format) => `bpptkg-notify.${format}.js`
    }
  }
});