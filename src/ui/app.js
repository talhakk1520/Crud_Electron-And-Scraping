// ------- Getting All Fields or required data through DOM ------- //

const productForm = document.querySelector("#productForm");
const productName = document.querySelector("#name");
const productPrice = document.querySelector("#price");
const productDescription = document.querySelector("#description");
const productsList = document.querySelector("#products");
const scrapeText = document.querySelector("#scrapeText");

let products = [];
let editingStatus = false;
let editProductId;

// ------- Calling Scrape E commerce Function ------- //

const scrapeEcommerceSite = async () => {
    scrapeText.innerText = 'Scraping started...';
    
    try {
        const response = await window.electron.scrapeEcommerceSite();
        if (response.success) {
            scrapeText.innerText = `Scraping completed. File saved at: ${response.filePath}`;
        } else {
            scrapeText.innerText = `Scraping failed: ${response.error}`;
        }
    } catch (error) {
        scrapeText.innerText = `Error: ${error.message}`;
    }
}

document.getElementById('scrapeButton').addEventListener('click', scrapeEcommerceSite);

// ------- Calling Delete Product Function ------- //

const deleteProduct = async (id) => {
    const response = confirm("Are you sure you want to delete it?");
    if(response){
        await window.electron.deleteProduct(id);
        await getProducts();
    }
}

// ------- Calling Edit Product Function ------- //

const editProduct = async (id) => {
    const product = await window.electron.getProductById(id);
    productName.value = product.name;
    productDescription.value = product.description;
    productPrice.value = product.price;

    editingStatus = true;
    editProductId = id;
}

// ------- Form Add Event Listener When Submit Button pressed For Create or Update Product ------- //

productForm.addEventListener("submit", async(e) => {
    
    try {
        e.preventDefault();

        const product = {
            name: productName.value,
            description: productDescription.value,
            price: productPrice.value
        }

        if(!editingStatus){
            const saveProduct = await window.electron.createProduct(product);
            console.log(saveProduct);
        } else {
            await window.electron.updateProduct(editProductId, product);
            console.log('Product updated');
            editingStatus = false;
            editProductId = "";
        }
        
        
        productForm.reset();
        productName.focus();
        getProducts();
    } catch (error) {
        console.log(error);
    }
});

// ------- Rendering Products and Showing them ------- //

async function renderProducts(tasks) {
    productsList.innerHTML = '';
    tasks.forEach((t) => {
        productsList.innerHTML += `
        <div class="card card-body my-2 animated fadeInLeft">
            <h4>${t.name}</h4>
            <p>${t.description}</p>
            <h3>${t.price}$</h3>
            <p>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${t.id}')">
            DELETE
            </button>
            <button class="btn btn-secondary btn-sm" onclick="editProduct('${t.id}')">
            EDIT 
            </button>
            </p>
        </div>
        `;
    });
}


// ------- Get Product Function Called ------- //

const getProducts = async () => {
    products = await window.electron.getProducts();
    renderProducts(products);
}

// ------- Calling Get Products Initially ------- //

async function init() {
    getProducts();
}

init();