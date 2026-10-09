# 📱 Delivery Web App (Mobile-First & WhatsApp)

Aplicativo de Delivery e Cardápio Digital moderno, 100% responsivo e otimizado para navegadores móveis (Safari, Chrome Mobile, etc.), com persistência de carrinho em `localStorage` e finalização automática via WhatsApp.

---

## 🚀 Como Executar Localmente

Como o projeto é construído em **Vanilla HTML5, CSS3 e JavaScript Moderno**, você não precisa compilar nada.

### Opção 1: Abrir diretamente no navegador
Dê um duplo clique no arquivo [`index.html`](file:///d:/Antigravity/Delivery/index.html) ou arraste-o para o navegador de sua preferência.

### Opção 2: Servidor Local (Recomendado para testar no celular via Wi-Fi)
Abra o terminal na pasta do projeto e execute:

```bash
python -m http.server 8080
```
Acesse `http://localhost:8080` no seu computador ou `http://IP_DO_SEU_PC:8080` no navegador do celular conectado na mesma rede Wi-Fi.

---

## ⚙️ Como Configurar o Aplicativo

No topo do arquivo [`app.js`](file:///d:/Antigravity/Delivery/app.js), você encontrará a constante de configuração `CONFIG`:

```javascript
const CONFIG = {
  // Número com DDI (55) + DDD + Telefone (apenas números)
  storeWhatsApp: "5511999998888",
  storeName: "Burger & Co. Delivery",
  deliveryFee: 5.00,
  currency: "BRL",
  
  // URL do Google Sheets (opcional)
  googleSheetCsvUrl: null
};
```

---

## 📊 Integração com Google Sheets / AppSheet

Seus produtos podem vir de uma planilha do Google Sheets ou do AppSheet sem precisar de backend:

1. Crie uma planilha no Google Sheets com as seguintes colunas na Linha 1:
   - `Nome`
   - `Descricao`
   - `Valor` (Ex: `32.90`)
   - `Imagem` (URL da foto do produto)
   - `Categoria` (Ex: `hamburgueres`, `combos`, `bebidas`, `sobremesas`)

2. No Google Sheets, vá em **Arquivo > Compartilhar > Publicar na Web**:
   - Selecione a aba desejada e escolha o formato **Valores separados por vírgula (.csv)**.
   - Clique em **Publicar** e copie a URL gerada.

3. Cole essa URL no campo `googleSheetCsvUrl` em [`app.js`](file:///d:/Antigravity/Delivery/app.js):
   ```javascript
   googleSheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1v.../pub?output=csv"
   ```

A função `loadProductsFromGoogleSheet()` carregará e atualizará o catálogo dinamicamente sempre que o cliente abrir a página.

---

## 🛒 Lógica de Negócio e Funcionalidades

- **Mobile-First & Touch UI**:
  - Touch targets mínimos de 44px para facilidade de toque.
  - Barra de carrinho inferior flutuante (*Sticky Bottom Bar*) com badge animado.
  - Drawer deslizante estilo *Bottom Sheet* para checkout sem recarregar a tela.
  - Suporte a *Safe Areas* do iPhone (`env(safe-area-inset-bottom)`).

- **Persistência em `localStorage`**:
  - Os itens e quantidades são salvos em `@delivery_app:cart_v1`. Se o cliente fechar ou atualizar o navegador, o carrinho é mantido intacto.
  - Os dados do cliente (Nome, Endereço, Preferência de Pagamento) são salvos em `@delivery_app:customer_v1`, poupando digitação nos próximos pedidos.

- **Opções de Pedido**:
  - Seleção entre **Entrega** (aplica taxa configurável e exige endereço) e **Retirada** (zera taxa e esconde endereço).
  - Seleção de pagamento: **PIX**, **Cartão de Crédito/Débito** ou **Dinheiro** (com campo automático de "Troco para quanto?").
  - Campo de observações (ex: "sem cebola", "molho à parte").

- **Envio Formatado para o WhatsApp**:
  - Validação de campos obrigatórios.
  - Gera link seguro `https://wa.me/NUMERO?text=...` com formatação limpa de emojis, quebras de linha e totais.
