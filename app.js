/**
 * DELIVERY WEB APP - FRONT-END & MOBILE LOGIC
 * Arquitetura: Mobile-First, Vanilla JS, persistência em localStorage e integração via WhatsApp & Google Sheets
 */

// =============================================================================
// 1. CONFIGURAÇÕES DA LOJA E INTEGRAÇÃO
// =============================================================================
const CONFIG = {
  // Número da loja com DDI + DDD (Apenas dígitos)
  storeWhatsApp: "5521999893885",
  storeName: "Max Delivery",
  deliveryFee: 5.00,
  currency: "BRL",
  
  // Storage Keys
  STORAGE_CART_KEY: "@delivery_app:cart_v1",
  STORAGE_CUSTOMER_KEY: "@delivery_app:customer_v1",
  
  // URL CSV da sua planilha (para puxar os lanches)
  // Cole a URL que você já tinha gerado se quiser ler os lanches da planilha
  googleSheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNX_mpJjyNEYlCKXB1buZVTwU76vMh1OIW9J596QtSydpbkSyTgBQLUgPwlmONAh7wvP3hPUgb4Cjl/pub?output=csv",

  // URL do Google Apps Script (para GRAVAR os pedidos na aba 'Pedidos')
  // Cole a URL do Apps Script aqui. Se deixar null, ele apenas abre o WhatsApp normalmente!
  googleAppsScriptOrdersUrl: "https://script.google.com/macros/s/AKfycbwP4GrqztVgfnvbEWCKNSsYNeUHZDA6nxjG1YDuLDzB_W7VP0OqkwHLRXNLcVXgW8WVYg/exec"
};

// Catálogo Inicial / Fallback (exibido se a planilha estiver vazia)
const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    nome: "Smash Burger Duplo",
    categoria: "hamburgueres",
    descricao: "Dois smash burgers de 90g, queijo cheddar derretido, cebola caramelizada e maionese especial no pão brioche tostado.",
    valor: 32.90,
    imagem: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-2",
    nome: "Bacon Lover Artesanal",
    categoria: "hamburgueres",
    descricao: "Hambúrguer bovino 160g, fatias generosas de bacon crocante, queijo prato, alface americana e molho barbecue rústico.",
    valor: 36.50,
    imagem: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-3",
    nome: "Combo Burger + Fritas + Refri",
    categoria: "combos",
    descricao: "1 Smash Burger Duplo + 1 Porção individual de batata rústica crocante + 1 Refrigerante lata 350ml à escolha.",
    valor: 46.90,
    imagem: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-4",
    nome: "Batata Frita Rústica Especial",
    categoria: "combos",
    descricao: "Porção de batatas com corte rústico, temperadas com páprica defumada, alecrim fresco e acompanhadas de maionese da casa.",
    valor: 18.00,
    imagem: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-5",
    nome: "Coca-Cola Original 350ml",
    categoria: "bebidas",
    descricao: "Lata 350ml gelada.",
    valor: 6.50,
    imagem: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-6",
    nome: "Suco Natural de Laranja 400ml",
    categoria: "bebidas",
    descricao: "Feito na hora, 100% fruta fresca, sem adição de conservantes.",
    valor: 8.50,
    imagem: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-7",
    nome: "Brownie com Ganache de Nutella",
    categoria: "sobremesas",
    descricao: "Brownie artesanal de chocolate meio amargo, coberto com ganache de Nutella e castanhas picadas.",
    valor: 14.90,
    imagem: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80"
  }
];

// Estado da Aplicação em Memória
let products = [...INITIAL_PRODUCTS];
let currentFilter = "todos";
let searchQuery = "";

// =============================================================================
// 2. FUNÇÕES DE UTILIDADE E FORMATAÇÃO
// =============================================================================
const formatCurrency = (val) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(val || 0);
};

function escapeHTML(str) {
  return (str || "").replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// =============================================================================
// 3. CAMADA DE DADOS E LOCALSTORAGE DO CARRINHO
// =============================================================================
function getCart() {
  try {
    const rawCart = localStorage.getItem(CONFIG.STORAGE_CART_KEY);
    return rawCart ? JSON.parse(rawCart) : [];
  } catch (error) {
    console.error("Erro ao ler carrinho do localStorage:", error);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CONFIG.STORAGE_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Erro ao salvar carrinho no localStorage:", error);
  }
  updateCartUI();
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const cart = getCart();
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantidade += 1;
  } else {
    cart.push({
      id: product.id,
      nome: product.nome,
      valor: Number(product.valor),
      imagem: product.imagem,
      quantidade: 1
    });
  }

  saveCart(cart);
}

function decreaseItemQuantity(productId) {
  let cart = getCart();
  const existingItem = cart.find(item => item.id === productId);

  if (!existingItem) return;

  if (existingItem.quantidade > 1) {
    existingItem.quantidade -= 1;
  } else {
    cart = cart.filter(item => item.id !== productId);
  }

  saveCart(cart);
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== productId);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CONFIG.STORAGE_CART_KEY);
  updateCartUI();
}

function calculateCartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((acc, item) => acc + (item.valor * item.quantidade), 0);
  const totalQuantity = cart.reduce((acc, item) => acc + item.quantidade, 0);

  const deliveryTypeEl = document.getElementById("deliveryType");
  const isPickup = deliveryTypeEl ? deliveryTypeEl.value === "retirada" : false;
  
  const deliveryFee = isPickup ? 0 : CONFIG.deliveryFee;
  const total = subtotal > 0 ? (subtotal + deliveryFee) : 0;

  return { subtotal, deliveryFee, total, totalQuantity };
}

// =============================================================================
// 4. RENDERIZAÇÃO DA INTERFACE (CATÁLOGO & CARRINHO)
// =============================================================================
function renderCatalog() {
  const grid = document.getElementById("productsGrid");
  const counter = document.getElementById("productCount");
  const cart = getCart();

  const filtered = products.filter(item => {
    const matchesCategory = currentFilter === "todos" || item.categoria === currentFilter;
    const matchesSearch = item.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  counter.textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'itens'}`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>Nenhum produto encontrado com os filtros atuais.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const cartItem = cart.find(ci => ci.id === item.id);
    const qty = cartItem ? cartItem.quantidade : 0;

    return `
      <article class="product-card" data-id="${item.id}">
        <div class="product-info">
          <div>
            <h3 class="product-title">${escapeHTML(item.nome)}</h3>
            <p class="product-description">${escapeHTML(item.descricao)}</p>
          </div>
          <div class="product-bottom">
            <span class="product-price">${formatCurrency(item.valor)}</span>
            
            ${qty > 0 ? `
              <div class="qty-control" aria-label="Quantidade">
                <button type="button" class="qty-btn" onclick="decreaseItemQuantity('${item.id}')" aria-label="Diminuir">
                  <i class="fas fa-minus"></i>
                </button>
                <span class="qty-value">${qty}</span>
                <button type="button" class="qty-btn" onclick="addToCart('${item.id}')" aria-label="Aumentar">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            ` : `
              <button type="button" class="btn-add-item" onclick="addToCart('${item.id}')">
                <i class="fas fa-plus"></i> Adicionar
              </button>
            `}
          </div>
        </div>
        <div class="product-thumb-wrapper">
          <img src="${item.imagem}" alt="${escapeHTML(item.nome)}" class="product-thumb" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=Produto'">
        </div>
      </article>
    `;
  }).join("");
}

function updateCartUI() {
  const { subtotal, deliveryFee, total, totalQuantity } = calculateCartTotals();
  const cart = getCart();

  // 1. Atualizar Barra Flutuante
  const floatingBar = document.getElementById("cartFloatingBar");
  const badgeCount = document.getElementById("cartBadgeCount");
  const floatingTotal = document.getElementById("cartFloatingTotal");

  if (totalQuantity > 0) {
    floatingBar.classList.add("visible");
    badgeCount.textContent = totalQuantity;
    floatingTotal.textContent = formatCurrency(subtotal);
  } else {
    floatingBar.classList.remove("visible");
    closeDrawer();
  }

  // 2. Atualizar Lista do Drawer
  const cartItemsList = document.getElementById("cartItemsList");
  if (cart.length === 0) {
    cartItemsList.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 10px 0;">Seu carrinho está vazio.</p>`;
  } else {
    cartItemsList.innerHTML = cart.map(item => `
      <div class="cart-item-card">
        <img src="${item.imagem}" alt="${escapeHTML(item.nome)}" class="cart-item-thumb" onerror="this.src='https://via.placeholder.com/80?text=Foto'">
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHTML(item.nome)}</div>
          <div class="cart-item-price">${formatCurrency(item.valor * item.quantidade)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="qty-control">
            <button type="button" class="qty-btn" onclick="decreaseItemQuantity('${item.id}')">
              <i class="fas fa-minus"></i>
            </button>
            <span class="qty-value">${item.quantidade}</span>
            <button type="button" class="qty-btn" onclick="addToCart('${item.id}')">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <button type="button" class="btn-remove-item" onclick="removeFromCart('${item.id}')" title="Remover item">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `).join("");
  }

  // 3. Atualizar Resumo Financeiro
  document.getElementById("summarySubtotal").textContent = formatCurrency(subtotal);
  document.getElementById("summaryDelivery").textContent = formatCurrency(deliveryFee);
  document.getElementById("summaryTotal").textContent = formatCurrency(total);

  renderCatalog();
}

// =============================================================================
// 5. GERENCIAMENTO DO DRAWER / CHECKOUT MODAL
// =============================================================================
function openDrawer() {
  const cart = getCart();
  if (cart.length === 0) return;

  document.getElementById("checkoutDrawer").classList.add("active");
  document.getElementById("modalBackdrop").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  document.getElementById("checkoutDrawer").classList.remove("active");
  document.getElementById("modalBackdrop").classList.remove("active");
  document.body.style.overflow = "";
}

// =============================================================================
// 6. FORMATAÇÃO DA MENSAGEM E REDIRECIONAMENTO WHATSAPP
// =============================================================================
function buildWhatsAppUrl(cart, details, totals) {
  const dataHora = new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });

  const itensFormatados = cart.map(item => {
    const itemTotal = formatCurrency(item.valor * item.quantidade);
    return `▪️ *${item.quantidade}x* ${item.nome}\n   _${formatCurrency(item.valor)} cada → Total: ${itemTotal}_`;
  }).join("\n\n");

  let enderecoOuRetirada = "";
  if (details.deliveryType === "delivery") {
    enderecoOuRetirada = `🛵 *Modo:* Entrega em Domicílio\n📍 *Endereço:* ${details.address}`;
  } else {
    enderecoOuRetirada = `🏪 *Modo:* Retirada no Balcão`;
  }

  let infoPagamento = `💳 *Forma de Pagamento:* ${details.paymentMethod}`;
  if (details.paymentMethod === "Dinheiro" && details.changeFor) {
    infoPagamento += ` (Troco para: ${details.changeFor})`;
  }

  const observacoesTxt = details.notes 
    ? `\n📝 *Observações:* ${details.notes}\n` 
    : "";

  const mensagem = 
`🍔 *NOVO PEDIDO - ${CONFIG.storeName.toUpperCase()}*
📅 _${dataHora}_
══════════════════════
👤 *Cliente:* ${details.customerName}
${enderecoOuRetirada}
${infoPagamento}
${observacoesTxt}══════════════════════
🛒 *ITENS DO PEDIDO:*

${itensFormatados}

══════════════════════
💰 *RESUMO DE VALORES:*
• Subtotal: ${formatCurrency(totals.subtotal)}
• Taxa de Entrega: ${details.deliveryType === "delivery" ? formatCurrency(totals.deliveryFee) : "Grátis (Retirada)"}
⭐ *TOTAL A PAGAR: ${formatCurrency(totals.total)}*
══════════════════════
_Por favor, confirme o recebimento e o tempo estimado de entrega!_`;

  const phone = CONFIG.storeWhatsApp.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Validação do checkout, gravação opcional na planilha e disparo para o WhatsApp
 */
function handleWhatsAppCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    alert("Seu carrinho está vazio! Adicione produtos antes de continuar.");
    return;
  }

  const customerName = document.getElementById("customerName").value.trim();
  const deliveryType = document.getElementById("deliveryType").value;
  const customerAddress = document.getElementById("customerAddress").value.trim();
  const paymentMethod = document.getElementById("paymentMethod").value;
  const changeFor = document.getElementById("changeFor").value.trim();
  const orderNotes = document.getElementById("orderNotes").value.trim();

  // Validações
  if (!customerName) {
    alert("Por favor, informe seu nome para identificar o pedido.");
    document.getElementById("customerName").focus();
    return;
  }

  if (deliveryType === "delivery" && !customerAddress) {
    alert("Por favor, preencha o endereço completo para a entrega.");
    document.getElementById("customerAddress").focus();
    return;
  }

  // Salvar dados do cliente para agilizar futuros pedidos
  saveCustomerDetails({
    customerName,
    customerAddress,
    deliveryType,
    paymentMethod
  });

  const totals = calculateCartTotals();
  const details = {
    customerName,
    deliveryType,
    address: customerAddress,
    paymentMethod,
    changeFor,
    notes: orderNotes
  };

  // Grava o pedido na planilha do Google em segundo plano
  if (CONFIG.googleAppsScriptOrdersUrl) {
    try {
      fetch(CONFIG.googleAppsScriptOrdersUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataHora: new Date().toLocaleString("pt-BR"),
          cliente: customerName,
          tipoEntrega: deliveryType === "delivery" ? "Entrega" : "Retirada",
          endereco: customerAddress,
          pagamento: paymentMethod + (changeFor ? " (Troco p/ " + changeFor + ")" : ""),
          itens: cart,
          subtotal: totals.subtotal,
          taxaEntrega: totals.deliveryFee,
          total: totals.total,
          observacoes: orderNotes
        })
      }).catch(err => console.warn("Aviso ao salvar pedido na planilha:", err));
    } catch (e) {
      console.warn("Falha no disparo para o Apps Script:", e);
    }
  }

  // Redireciona o usuário para o aplicativo do WhatsApp
  const whatsappUrl = buildWhatsAppUrl(cart, details, totals);
  window.open(whatsappUrl, "_blank");

  // 1. Limpa o carrinho
  clearCart();

  // 2. Limpa campos específicos do pedido anterior
  document.getElementById("orderNotes").value = "";
  document.getElementById("changeFor").value = "";

  // 3. Fecha a tela de checkout imediatamente
  closeDrawer();

  // 4. Exibe notificação suave de sucesso na tela
  showToast("Pedido enviado com sucesso! 🎉");
}

/**
 * Exibe notificação Toast flutuante suave na tela
 */
function showToast(message) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "toast-notification";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}
// =============================================================================
// 7. PERSISTÊNCIA DOS DADOS DO CLIENTE (NOME, ENDEREÇO, ETC)
// =============================================================================
function saveCustomerDetails(data) {
  try {
    localStorage.setItem(CONFIG.STORAGE_CUSTOMER_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Não foi possível salvar os dados do cliente.", e);
  }
}

function loadCustomerDetails() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_CUSTOMER_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    if (data.customerName) document.getElementById("customerName").value = data.customerName;
    if (data.customerAddress) document.getElementById("customerAddress").value = data.customerAddress;
    if (data.deliveryType) {
      document.getElementById("deliveryType").value = data.deliveryType;
      handleDeliveryTypeChange();
    }
    if (data.paymentMethod) {
      document.getElementById("paymentMethod").value = data.paymentMethod;
      handlePaymentMethodChange();
    }
  } catch (e) {
    console.warn("Falha ao carregar dados persistidos do cliente.", e);
  }
}

// =============================================================================
// 8. INTEGRAÇÃO COM GOOGLE SHEETS (LEITURA DO CARDÁPIO VIA CSV)
// =============================================================================
async function loadProductsFromGoogleSheet(csvUrl) {
  if (!csvUrl) return;

  try {
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    const rows = csvText.trim().split("\n");
    
    const parsedProducts = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(",").map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 4 && cols[0]) {
        parsedProducts.push({
          id: `sheet-${i}`,
          nome: cols[0],
          descricao: cols[1] || "",
          valor: parseFloat(cols[2].replace("R$", "").replace(",", ".")) || 0,
          imagem: cols[3] || "https://via.placeholder.com/150",
          categoria: cols[4] ? cols[4].toLowerCase() : "outros"
        });
      }
    }

    if (parsedProducts.length > 0) {
      products = parsedProducts;
      renderCatalog();
    }
  } catch (err) {
    console.error("Erro ao carregar catálogo da planilha:", err);
  }
}

// =============================================================================
// 9. EVENT LISTENERS E INICIALIZAÇÃO
// =============================================================================
function handleDeliveryTypeChange() {
  const deliveryType = document.getElementById("deliveryType").value;
  const addressGroup = document.getElementById("addressGroup");
  const summaryDeliveryRow = document.getElementById("summaryDeliveryRow");

  if (deliveryType === "retirada") {
    addressGroup.style.display = "none";
    document.getElementById("customerAddress").required = false;
    summaryDeliveryRow.style.display = "none";
  } else {
    addressGroup.style.display = "block";
    document.getElementById("customerAddress").required = true;
    summaryDeliveryRow.style.display = "flex";
  }

  updateCartUI();
}

function handlePaymentMethodChange() {
  const paymentMethod = document.getElementById("paymentMethod").value;
  const changeGroup = document.getElementById("changeGroup");
  changeGroup.style.display = (paymentMethod === "Dinheiro") ? "block" : "none";
}

// Inicialização da Página
document.addEventListener("DOMContentLoaded", () => {
  renderCatalog();
  updateCartUI();
  loadCustomerDetails();

  if (CONFIG.googleSheetCsvUrl) {
    loadProductsFromGoogleSheet(CONFIG.googleSheetCsvUrl);
  }

  const categoryPills = document.querySelectorAll(".category-pill");
  categoryPills.forEach(pill => {
    pill.addEventListener("click", () => {
      categoryPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentFilter = pill.dataset.category;
      renderCatalog();
    });
  });

  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    clearSearchBtn.style.display = searchQuery ? "flex" : "none";
    renderCatalog();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.style.display = "none";
    renderCatalog();
    searchInput.focus();
  });

  document.getElementById("openCartBtn").addEventListener("click", openDrawer);
  document.getElementById("closeCartBtn").addEventListener("click", closeDrawer);
  document.getElementById("modalBackdrop").addEventListener("click", closeDrawer);

  document.getElementById("deliveryType").addEventListener("change", handleDeliveryTypeChange);
  document.getElementById("paymentMethod").addEventListener("change", handlePaymentMethodChange);

  document.getElementById("btnSendWhatsApp").addEventListener("click", handleWhatsAppCheckout);
});
