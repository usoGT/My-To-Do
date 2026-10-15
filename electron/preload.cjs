// Masaüstü uygulamasında sayfaya sadece platform bilgisini açar (Node erişimi verilmez).
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('planlayiciDesktop', {
  platform: process.platform,
});
