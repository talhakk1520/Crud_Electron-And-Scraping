const { Builder, By } = require('selenium-webdriver');
const ExcelJS = require('exceljs');
const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const mysql = require("promise-mysql");

// ------- DataBase Connection ------- //

let connection;

async function createConnection() {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'electron_crud'
    })
}

createConnection();

// ------- DataBase Connection End ------- //


// ------- Scrape Site Function ------- //

ipcMain.handle('scrapeEcommerceSite', async() => {
    const driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('https://www.reliablechef.com');

        await driver.sleep(5000);

        let products = await driver.findElements(By.css('.product-body'));

        let productData = await Promise.all(products.map(async (product) => {
            try {
                let styleCode = await product.findElement(By.css('.product-cat')).getText();
                styleCode = styleCode.split('\n')[0];

                let price = await product.findElement(By.css('.product-price.m-0')).getText();
                price = price.split('\n')[0];

                let name = await product.findElement(By.css('.product-title a')).getText();

                return { name, styleCode, price };
            } catch (err) {
                console.error('Error fetching product data:', err);
                return null;
            }
        }));

        productData = productData.filter(item => item !== null);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Products');

        worksheet.columns = [
            { header: 'Product Name', key: 'name', width: 30 },
            { header: 'Style Code', key: 'styleCode', width: 20 },
            { header: 'Price', key: 'price', width: 15 },
        ];

        productData.forEach(product => {
            worksheet.addRow(product);
        });

        const filePath = './ProductData.xlsx';
        await workbook.xlsx.writeFile(filePath);

        return { success: true, filePath };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        await driver.quit();
    }
});

// ------- Scrape Site Function End ------- //


// ------- Create Product Data Function Start ------- //

ipcMain.handle('createProduct', async(event, product) => {
    try {
        const result = await connection.query('INSERT INTO products SET ?', product);
        product.id = result.insertId;
        new Notification({
            title: 'Product created',
            body: `Product ${product.name} created successfully`,
        }).show();
        return product;
    } catch (error) {
        console.log(error)
    }
});

// ------- Create Product Data Function End ------- //


// ------- Get Product Data Function Start ------- //

ipcMain.handle('getProducts', async() => {
    try {
        const result = await connection.query('SELECT * FROM products');
        return result;
    } catch (error) {
        console.log(error);
    }
});

// ------- Get Product Data Function End ------- //


// ------- Delete Product Data Function Start ------- //

ipcMain.handle('deleteProduct', async(event, id) => {
    try {
        const result = await connection.query('DELETE FROM products WHERE id = ?', id);
        return result;
    } catch (error) {
        console.log(error);
    }
});

// ------- Delete Product Data Function End ------- //


// ------- Get Product By ID Data Function Start ------- //

ipcMain.handle('getProductById', async (event, id) => {
    try {
        const product = await connection.query('SELECT * FROM products WHERE id = ?', id);
        return product[0];
    } catch (error) {
        console.log(error);
    }
});

// ------- Get Product By ID Data Function End ------- //


// ------- Update Product By ID Data Function Start ------- //

ipcMain.handle('updateProduct', async (event, id, product) => {
    try {
        const result = await connection.query("UPDATE products SET ? WHERE id = ?", [product, id]);
        new Notification({
            title: 'Product updated',
            body: `Product updated successfully`,
        }).show();
        return result;
    } catch (error) {
        console.log(error);
    }
})

// ------- Update Product By ID Data Function End ------- //


// ------- Creating Window Function Start ------- //

function createWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, 
            contextIsolation: true  
        }
    });

    win.loadFile(path.join(__dirname, 'ui', 'index.html'));
}

// ------- Creating Window Function End ------- //


// ------- App ready ------- //

app.whenReady().then(() => {
    createWindow();
});


// ------- App on all window close ------- //

app.on('window-all-closed', () => {
    if (process.platform == 'darwin'){
        app.quit();
    }
})