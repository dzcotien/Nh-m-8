document.addEventListener("DOMContentLoaded", () => {
  cartCount();
  loadProductsFromAPI();
  setupCategoryTabs();
  setupSearch();
  setupShowAll();
  setupNewsletter();
  setupAccountDropdown();
});

let currentCategory = "Tất cả";
let showAllProducts = false;
let allProductsData = [];

const money = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);

const $ = (s) => document.querySelector(s);

const cartRead = () => {
  try {
    return JSON.parse(localStorage.getItem("may_store_cart") || "{}");
  } catch {
    return {};
  }
};

function cartCount() {
  const e = $("#cart-count");
  if (e)
    e.textContent = Object.values(cartRead()).reduce(
      (a, b) => a + Number(b || 0),
      0,
    );
}

function notify(t) {
  const e = $("#toast");
  if (!e) return;
  e.textContent = t;
  e.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => e.classList.remove("show"), 2500);
}

async function loadProductsFromAPI() {
  const grid = $("#product-grid");
  if (!grid) return;

  grid.innerHTML =
    '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #aaa;">Đang tải danh sách sản phẩm...</div>';

  let apiProducts = [];

  try {
    const response = await fetch("../backend/api/get_products.php");
    const result = await response.json();
    if (result.success && result.data) {
      apiProducts = result.data;
    }
  } catch (error) {
    console.warn(
      "Không gọi được API backend, chuyển sang dùng dữ liệu cục bộ.",
      error,
    );
  }

  // Chỉ dùng dữ liệu MySQL làm nguồn sự thật, không ghép sản phẩm giả từ localStorage.
  allProductsData = apiProducts;
  const tabBox=document.getElementById('category-tabs');
  if(tabBox){const categories=['Tất cả',...new Set(apiProducts.map(p=>p.danh_muc).filter(Boolean))];tabBox.replaceChildren(...categories.map(c=>{const b=document.createElement('button');b.type='button';b.dataset.category=c;b.textContent=c;b.className=c===currentCategory?'active':'';return b;}));}

  document.querySelectorAll('[data-product-total]').forEach(el => el.textContent = String(allProductsData.length));

  if (allProductsData.length > 0) {
    renderProducts();
  } else {
    grid.innerHTML =
      '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff6b6b;">Không có sản phẩm nào trong hệ thống.</div>';
  }
}

function renderProducts() {
  const grid = $("#product-grid");
  if (!grid) return;

  const urlParams = new URLSearchParams(location.search);
  const q = (urlParams.get("q") || $("#search-input")?.value || "")
    .toLowerCase()
    .trim();

  const filtered = allProductsData.filter((p) => {
    const matchCategory =
      currentCategory === "Tất cả" ||
      (p.danh_muc && p.danh_muc.trim() === currentCategory.trim());
    const matchKeyword =
      !q ||
      (p.ten_san_pham && p.ten_san_pham.toLowerCase().includes(q)) ||
      (p.ma_san_pham && p.ma_san_pham.toLowerCase().includes(q)) ||
      (p.danh_muc && p.danh_muc.toLowerCase().includes(q));
    return matchCategory && matchKeyword;
  });

  const shown = showAllProducts ? filtered : filtered.slice(0, 8);

  if (!shown.length) {
    grid.innerHTML =
      '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #aaa;">Không tìm thấy sản phẩm phù hợp. Hãy thử từ khóa khác.</div>';
    return;
  }

  grid.innerHTML = shown
    .map((p) => {
      const price = Number(p.gia_ban || 0);
      const sale = p.gia_khuyen_mai ? Number(p.gia_khuyen_mai) : null;
      const stock = Number(p.so_luong_ton || 0);

      const imageUrl = String(p.hinh_anh || "").replace(/["<>]/g, "");
      const escapeText = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const safeName = escapeText(p.ten_san_pham || 'Sản phẩm');

      return `
        <article class="product-card">
          <div class="product-image">
            <span class="product-badge ${stock === 0 ? "out" : ""}">
              ${stock === 0 ? "HẾT HÀNG" : sale ? "GIÁ ƯU ĐÃI" : "MAY STORE"}
            </span>
            <a class="product-image-link" href="product_detail.html?id=${encodeURIComponent(p.id)}">
              <img
                src="${imageUrl}"
                alt="${safeName}"
                loading="lazy"
                onerror="this.onerror=null;this.classList.add('image-unavailable');this.insertAdjacentHTML('afterend','<span class=&quot;image-fallback&quot;>Ảnh sản phẩm chưa khả dụng</span>')"
              >
            </a>
          </div>
          <div class="product-info">
            <p class="product-category">${escapeText(p.danh_muc || "Công nghệ")}</p>
            <h3 class="product-name">
              <a href="product_detail.html?id=${encodeURIComponent(p.id)}">${safeName}</a>
            </h3>
            <div class="product-rating" aria-label="Đánh giá ${Number(p.diem_danh_gia || 0).toFixed(1)} trên 5">
              <span>${Number(p.so_danh_gia || 0) > 0 ? "★★★★★" : "☆☆☆☆☆"}</span>
              <small>${Number(p.diem_danh_gia || 0).toFixed(1)} · ${Number(p.so_danh_gia || 0)} đánh giá</small>
            </div>
            <div class="price-row">
              <span class="price">${money(sale || price)}</span>
              ${sale ? `<span class="old-price">${money(price)}</span>` : ""}
            </div>
            <div class="product-bottom">
              <span class="stock ${stock < 10 ? "low" : ""}">
                ${stock === 0 ? "Tạm hết hàng" : stock < 10 ? "Chỉ còn " + stock + " sản phẩm" : "Còn hàng"}
              </span>
              <button class="add" data-add="${p.id || p.ma_san_pham}" aria-label="Thêm ${safeName} vào giỏ" ${stock === 0 ? "disabled" : ""}><span aria-hidden="true">＋</span> Thêm giỏ</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll("[data-add]").forEach((b) => {
    b.addEventListener("click", () => {
      const product = allProductsData.find(
        (x) => String(x.id || x.ma_san_pham) === String(b.dataset.add),
      );
      if (!product) return;
      const cart = cartRead();
      const prodId = product.id || product.ma_san_pham;
      const currentQty = cart[prodId] || 0;
      if (currentQty >= Number(product.so_luong_ton)) {
        notify("Số lượng sản phẩm trong kho không đủ.");
        return;
      }
      cart[prodId] = currentQty + 1;
      localStorage.setItem("may_store_cart", JSON.stringify(cart));
      cartCount();
      notify("Đã thêm “" + product.ten_san_pham + "” vào giỏ hàng.");
    });
  });
}

function setupCategoryTabs() {
  const tabsContainer = $("#category-tabs");
  if (!tabsContainer) return;

  tabsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    currentCategory = btn.dataset.category;
    tabsContainer
      .querySelectorAll("button")
      .forEach((x) => x.classList.toggle("active", x === btn));
    showAllProducts = false;
    const showAllBtn = $("#show-all");
    if (showAllBtn) showAllBtn.textContent = "HIỂN THỊ TẤT CẢ SẢN PHẨM ↓";
    renderProducts();
  });
}

function setupShowAll() {
  const showAllBtn = $("#show-all");
  if (!showAllBtn) return;

  showAllBtn.addEventListener("click", () => {
    showAllProducts = !showAllProducts;
    showAllBtn.textContent = showAllProducts
      ? "THU GỌN DANH SÁCH ↑"
      : "HIỂN THỊ TẤT CẢ SẢN PHẨM ↓";
    renderProducts();
  });
}

function setupSearch() {
  const form = $("#search-form");
  const input = $("#search-input");
  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    const u = new URL(location.href);
    q ? u.searchParams.set("q", q) : u.searchParams.delete("q");
    history.replaceState({}, "", u);
    currentCategory = "Tất cả";
    $("#category-tabs")
      ?.querySelectorAll("button")
      .forEach((x) =>
        x.classList.toggle("active", x.dataset.category === "Tất cả"),
      );
    showAllProducts = true;
    const showAllBtn = $("#show-all");
    if (showAllBtn) showAllBtn.textContent = "THU GỌN DANH SÁCH ↑";
    renderProducts();
    $("#products")?.scrollIntoView({ behavior: "smooth" });
  });
}

function setupNewsletter() {
  const newsletter = $("#newsletter");
  if (!newsletter) return;

  newsletter.addEventListener("submit", (e) => {
    e.preventDefault();
    notify("Cảm ơn bạn đã đăng ký nhận tin từ May Store.");
    e.target.reset();
  });
}

async function setupAccountDropdown() {
  const accountLink=document.querySelector(".head-links a[href='login.html']");
  if(!accountLink)return;
  let user=null;
  try {const r=await fetch('../backend/api/session.php',{credentials:'same-origin',cache:'no-store'});const j=await r.json();if(r.ok)user=j.nguoi_dung;}catch(e){console.warn('Không kiểm tra được phiên đăng nhập',e);}
  if(!user){localStorage.removeItem('may_store_user');return;}
  localStorage.setItem('may_store_user',JSON.stringify(user));
  const wrap=document.createElement('div');wrap.className='user-account-wrapper';wrap.style.position='relative';
  accountLink.replaceWith(wrap);
  const btn=document.createElement('button');btn.type='button';btn.textContent=user.ho_ten||'Tài khoản';btn.className='account-trigger';
  const menu=document.createElement('div');menu.className='account-menu';menu.hidden=true;
  const links=[['Thông tin tài khoản','profile.html'],['Đơn hàng','orders.html']];
  if(user.vai_tro==='quan_tri')links.push(['Quản trị','admin/dashboard.html']);
  for(const [label,url] of links){const a=document.createElement('a');a.href=url;a.textContent=label;menu.append(a);}
  const logout=document.createElement('button');logout.type='button';logout.textContent='Đăng xuất';
  logout.addEventListener('click',async()=>{try{await fetch('../backend/api/logout.php',{method:'POST',credentials:'same-origin'});}finally{localStorage.removeItem('may_store_user');location.href='index.html';}});
  menu.append(logout);btn.addEventListener('click',()=>menu.hidden=!menu.hidden);wrap.append(btn,menu);
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))menu.hidden=true;});
}

// Lối tắt danh mục: dùng cùng bộ lọc sản phẩm hiện có.
document.querySelectorAll('[data-shortcut]').forEach(link=>link.addEventListener('click',()=>{
 const name=link.dataset.shortcut;
 const tab=Array.from(document.querySelectorAll('#category-tabs button')).find(b=>b.dataset.category===name);
 if(tab) tab.click();
}));
