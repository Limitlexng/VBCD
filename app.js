const products = [
  {
    id: "ui-kit-pro",
    name: "SaaS UI Kit Pro",
    description: "200+ production-ready SaaS components for Figma.",
    price: 49,
    category: "Design Kits",
    fileName: "saas-ui-kit-pro.fig"
  },
  {
    id: "notion-pack",
    name: "Freelancer Notion OS",
    description: "Client CRM, project board, invoices, and content calendar.",
    price: 29,
    category: "Templates",
    fileName: "freelancer-notion-os.zip"
  },
  {
    id: "course-launch",
    name: "Launch a Digital Product",
    description: "Video course on validating, shipping, and scaling products.",
    price: 79,
    category: "Courses",
    fileName: "launch-digital-product-course.pdf"
  },
  {
    id: "audio-pack",
    name: "Podcast Intro Bundle",
    description: "Royalty-free intros/outros with editing guide.",
    price: 19,
    category: "Audio",
    fileName: "podcast-intro-bundle.zip"
  },
  {
    id: "resume-pack",
    name: "Creative Resume Pack",
    description: "ATS-friendly resume and cover letter templates.",
    price: 15,
    category: "Templates",
    fileName: "creative-resume-pack.zip"
  }
];

const state = {
  cart: JSON.parse(localStorage.getItem("pv_cart") ?? "[]"),
  orders: JSON.parse(localStorage.getItem("pv_orders") ?? "[]")
};

const el = {
  productGrid: document.getElementById("product-grid"),
  productTemplate: document.getElementById("product-template"),
  cartToggle: document.getElementById("cart-toggle"),
  cartCount: document.getElementById("cart-count"),
  cartPanel: document.getElementById("cart-panel"),
  cartItems: document.getElementById("cart-items"),
  cartSubtotal: document.getElementById("cart-subtotal"),
  checkoutBtn: document.getElementById("checkout-btn"),
  clearCart: document.getElementById("clear-cart"),
  search: document.getElementById("search"),
  categoryFilter: document.getElementById("category-filter"),
  checkoutSection: document.getElementById("checkout-section"),
  checkoutForm: document.getElementById("checkout-form"),
  libraryList: document.getElementById("library-list")
};

function money(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function save() {
  localStorage.setItem("pv_cart", JSON.stringify(state.cart));
  localStorage.setItem("pv_orders", JSON.stringify(state.orders));
}

function findProduct(id) {
  return products.find((product) => product.id === id);
}

function renderProducts() {
  const query = el.search.value.toLowerCase();
  const category = el.categoryFilter.value;
  el.productGrid.innerHTML = "";

  products
    .filter((product) =>
      (category === "all" || product.category === category) &&
      (product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query))
    )
    .forEach((product) => {
      const node = el.productTemplate.content.cloneNode(true);
      node.querySelector("[data-name]").textContent = product.name;
      node.querySelector("[data-description]").textContent = product.description;
      node.querySelector("[data-category]").textContent = product.category;
      node.querySelector("[data-price]").textContent = money(product.price);
      node.querySelector("[data-action='add']").addEventListener("click", () => addToCart(product.id));
      el.productGrid.append(node);
    });
}

function addToCart(productId) {
  const item = state.cart.find((line) => line.productId === productId);
  if (item) {
    item.qty += 1;
  } else {
    state.cart.push({ productId, qty: 1 });
  }
  save();
  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((line) => line.productId !== productId);
  save();
  renderCart();
}

function renderCart() {
  el.cartItems.innerHTML = "";
  let count = 0;
  let subtotal = 0;

  for (const line of state.cart) {
    const product = findProduct(line.productId);
    if (!product) continue;
    const lineTotal = product.price * line.qty;
    count += line.qty;
    subtotal += lineTotal;

    const item = document.createElement("li");
    item.innerHTML = `
      <span>${product.name} × ${line.qty}</span>
      <span>
        ${money(lineTotal)}
        <button class="button button-ghost" data-remove="${product.id}">Remove</button>
      </span>
    `;
    item.querySelector("button").addEventListener("click", () => removeFromCart(product.id));
    el.cartItems.append(item);
  }

  el.cartCount.textContent = String(count);
  el.cartSubtotal.textContent = money(subtotal);
  el.checkoutBtn.disabled = state.cart.length === 0;
}

function renderLibrary() {
  if (state.orders.length === 0) {
    el.libraryList.innerHTML = "<p>No purchases yet.</p>";
    return;
  }

  el.libraryList.innerHTML = state.orders
    .map(
      (order) => `
      <article>
        <h3>Order ${order.orderId}</h3>
        <p class="muted">Purchased on ${new Date(order.timestamp).toLocaleString()}</p>
        ${order.items
          .map(
            (item) => `
              <div class="order-item">
                <span>${item.name}</span>
                <button class="button button-primary" data-download="${item.fileName}">Download</button>
              </div>
            `
          )
          .join("")}
      </article>
    `
    )
    .join("");

  el.libraryList.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", () => {
      const fileName = button.getAttribute("data-download");
      const fileContent = `Thank you for purchasing ${fileName} from PixelVault.`;
      const blob = new Blob([fileContent], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  });
}

el.search.addEventListener("input", renderProducts);
el.categoryFilter.addEventListener("change", renderProducts);
el.cartToggle.addEventListener("click", () => el.cartPanel.classList.toggle("hidden"));
el.clearCart.addEventListener("click", () => {
  state.cart = [];
  save();
  renderCart();
});

el.checkoutBtn.addEventListener("click", () => {
  el.checkoutSection.classList.remove("hidden");
  el.checkoutSection.scrollIntoView({ behavior: "smooth" });
});

el.checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const orderItems = state.cart
    .map((line) => {
      const product = findProduct(line.productId);
      return product ? Array.from({ length: line.qty }, () => product) : [];
    })
    .flat();

  const order = {
    orderId: `PV-${Math.floor(Math.random() * 900000 + 100000)}`,
    timestamp: new Date().toISOString(),
    items: orderItems
  };

  state.orders.unshift(order);
  state.cart = [];
  save();
  renderCart();
  renderLibrary();
  el.checkoutForm.reset();
  el.checkoutSection.classList.add("hidden");
  alert(`Payment successful! Order ${order.orderId} is ready for download.`);
});

renderProducts();
renderCart();
renderLibrary();
