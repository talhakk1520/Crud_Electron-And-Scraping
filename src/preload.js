// ------- Rendering Functions From main and making two way communication ------- //

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    createProduct: (product) => ipcRenderer.invoke("createProduct", product),
    getProducts: () => ipcRenderer.invoke("getProducts"),
    deleteProduct: (id) => ipcRenderer.invoke("deleteProduct", id),
    getProductById: (id) => ipcRenderer.invoke("getProductById", id),
    updateProduct: (id, product) => ipcRenderer.invoke("updateProduct", id, product),
    scrapeEcommerceSite: () => ipcRenderer.invoke("scrapeEcommerceSite"),
});