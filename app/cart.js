const floatingCart = document.getElementById("floatingCart");
const cartCount = document.getElementById("cartCount");
let cartItems = JSON.parse(localStorage.getItem("cart")) || {};
const cartProducts = localStorage.getItem('cartProducts');
const products = JSON.parse(cartProducts);

const userData = JSON.parse(localStorage.getItem('user'));
const shopData = JSON.parse(localStorage.getItem('shop'));




function addToCart(productId) {
    const currentShopId = shopData.shopId;
    const storedShopId = localStorage.getItem("cartShopId");

    if (storedShopId && storedShopId !== String(currentShopId)) {
        showClearCartModal(() => {
            clearCartAndAddItem(productId, currentShopId);
        });
        return;
    }

    addItemToCart(productId, currentShopId);
}



// Show the fancy confirmation popup
function showClearCartModal(confirmCallback) {
    const modal = document.getElementById("clearCartModal");
    modal.style.display = "flex";

    document.getElementById("cancelClearCart").onclick = () => {
        modal.style.display = "none";
    };

    document.getElementById("confirmClearCart").onclick = () => {
        modal.style.display = "none";
        confirmCallback(); // Proceed to clear cart and add item
    };
}

// Clear cart and add the new product
function clearCartAndAddItem(productId, currentShopId) {
    cartItems = {};
    localStorage.removeItem("cart");
    localStorage.removeItem("cartProducts");
    localStorage.setItem("cartShopId", currentShopId);
    addItemToCart(productId, currentShopId);
}

// Add an item to the cart
function addItemToCart(productId, currentShopId) {
    localStorage.setItem("cartShopId", currentShopId);
    cartItems[productId] = (cartItems[productId] || 0) + 1;
    saveCart();
    saveCartProducts(productId)
    updateCartUI();
}

function changeQuantity(productId, change) {
    if (!cartItems[productId]) return;

    cartItems[productId] = Math.max(0, cartItems[productId] + change);

    if (cartItems[productId] === 0) 
{
    delete cartItems[productId]; // Remove item if quantity is 0
    removeCartProduct(productId);
}
  
     
    saveCart();
    updateCartUI();

    if (document.getElementById("checkoutModal").style.display === "flex") viewCart();
}

function saveCart(productId) {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    updateCartCount();
}
function saveCartProducts(productId) {
    const cartProductsArr = localStorage.getItem('cartProducts');
        const cartProdData = JSON.parse(cartProductsArr);
        if(!cartProdData){
            var cartProducts = [];
        }else{
            var cartProducts = cartProdData;
        }
    const product = products.find(p => p.productId === productId);
    cartProducts.push(product);
    localStorage.setItem("cartProducts", JSON.stringify(cartProducts));
}
function removeCartProduct(productId){
    const cartProducts = localStorage.getItem('cartProducts');
    const cartProdData = JSON.parse(cartProducts);
            //const product = cartProdData.find(p => p.productId === productId);
    const updatedProducts = cartProdData.filter(product => product.productId !== productId);
    localStorage.setItem("cartProducts", JSON.stringify(updatedProducts));
    if(updatedProducts.length==0) localStorage.removeItem('cartShopId');
}


function updateCartUI() {
    products.forEach(product => {
        let controls = document.getElementById(`cartControls-${product.productId}`);
        if (controls) {
            if (cartItems[product.productId] && cartItems[product.productId] > 0) {
                controls.innerHTML = `
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="changeQuantity('${product.productId}', -1)">-</button>
                        <span class="cart-quantity">${cartItems[product.productId]}</span>
                        <button class="quantity-btn" onclick="changeQuantity('${product.productId}', 1)">+</button>
                    </div>
                `;
            } else {
                controls.innerHTML = `<button class="cart-btn" onclick="addToCart('${product.productId}')">Add to Cart</button>`;
            }
        }
    });

    updateCartCount();
}

function updateCartCount() {
    let totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
    cartCount.textContent = totalItems;
    floatingCart.style.display = totalItems > 0 ? "flex" : "none";
}

function viewCart() {
    const checkoutCartItems = document.getElementById("checkoutCartItems");
    checkoutCartItems.innerHTML = "";

    let subtotal = 0, discount = 0, taxRate = 0.05, platformCharge = 10, deliveryCharge = 30;

    for (const productId in cartItems) {
       // const product = products.find(p => p.productId === productId);
            const cartProducts = localStorage.getItem('cartProducts');
            const cartProdData = JSON.parse(cartProducts);
            const product = cartProdData.find(p => p.productId === productId);
        if (product) {
            let itemTotal = product.sellPrice * cartItems[productId];
            subtotal += itemTotal;
            discount += 10; // Example discount

            checkoutCartItems.innerHTML += `
                <div class="checkout-item">
                    ${product.medias.length !== 0 ? `<img src="/odata/v4${product.medias[0].url}" class="checkout-img">` : ''}
                    <div>
                        <p><strong>${product.productName}</strong></p>
                        <p>₹${product.sellPrice.toFixed(2)} x ${cartItems[productId]} = ₹${(product.sellPrice * cartItems[productId]).toFixed(2)}</p>
                        <div class="quantity-control">
                            <button class="quantity-btn" onclick="changeQuantity('${productId}', -1)">-</button>
                            <span>${cartItems[productId]}</span>
                            <button class="quantity-btn" onclick="changeQuantity('${productId}', 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    let tax = subtotal * taxRate;
    let totalAmount = subtotal - discount + tax + platformCharge + deliveryCharge;

    document.getElementById("subtotal").textContent = subtotal.toFixed(2);
    document.getElementById("discount").textContent = discount.toFixed(2);
    document.getElementById("tax").textContent = tax.toFixed(2);
    document.getElementById("totalAmount").textContent = totalAmount.toFixed(2);

    document.getElementById("checkoutModal").style.display = subtotal > 0 ? "flex" : "none";
}

function closeCheckoutModal() {
    document.getElementById("checkoutModal").style.display = "none";
}

function proceedCheckout() {
    alert("Ordered Successfully!!");
    cartItems = {}; 
    localStorage.removeItem("cart");
    localStorage.removeItem("cartShopId"); // Reset shop restriction
    updateCartUI();
    closeCheckoutModal();
}
document.addEventListener("click", function () {
    window.parent.postMessage("iframe-clicked", "*");
});
// Login
// document.addEventListener("DOMContentLoaded", function () {
//     const token = localStorage.getItem('refreshToken');
//     const user = localStorage.getItem('user');
// if(!token && !user){
//     window.parent.document.getElementById('loginButton').style.display = 'none'; //  login button
//     const url="./iframe/login.html";
//     loadContent(url);
// }
// });