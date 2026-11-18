const safeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const $ = s => document.querySelector(s);

const readCart = () => {
    try {
        const cart = JSON.parse(localStorage.getItem('may_store_cart') || '{}');
        const normalized = {};
        for (const [k, v] of Object.entries(cart)) {
            let cleanKey = String(k).trim();
            normalized[cleanKey] = Number(v);
        }
        return normalized;
    } catch {
        return {};
    }
};

async function getAllProductsForCart() {
    try {
        const response = await fetch('../backend/api/get_products.php');
        const result = await response.json();
        if (response.ok && result.data) return result.data.map(p => ({
            id: String(p.id), name: p.ten_san_pham, category: p.danh_muc,
            price: Number(p.gia_ban), sale: p.gia_khuyen_mai ? Number(p.gia_khuyen_mai) : null,
            stock: Number(p.so_luong_ton), image: p.hinh_anh, symbol: ''
        }));
    } catch (error) { console.error('Không tải được sản phẩm từ máy chủ:', error); }
    return [];
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Xử lý Đăng nhập
    const login = $('#login-form'); 
    if (login) {
        login.addEventListener('submit', async e => {
            e.preventDefault(); 
            const d = Object.fromEntries(new FormData(login)), m = $('#form-message'); 
            try {
                const r = await fetch('../backend/api/login.php', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d)
                }); 
                const raw = await r.text();
                let j;
                try { j = JSON.parse(raw); } catch { throw Error('Máy chủ trả về dữ liệu không hợp lệ. Hãy kiểm tra PHP, MySQL và đường dẫn /maystore/backend/api/login.php.'); }
                if (!r.ok || !j.thanh_cong) throw Error(j.thong_bao || 'Đăng nhập thất bại'); 
                localStorage.setItem('may_store_user', JSON.stringify(j.nguoi_dung)); 
                if (m) { m.textContent = j.thong_bao; m.style.color = '#3d7044'; }
                setTimeout(() => location.href = j.nguoi_dung.vai_tro === 'quan_tri' ? 'admin/dashboard.html' : 'index.html', 600);
            } catch (err) {
                if (m) {
                    m.textContent = err.message || 'Sai tên đăng nhập hoặc mật khẩu.';
                    m.style.color = '#ff4d4d';
                }
            }
        });
    }

    // 2. Xử lý Giỏ hàng
    const table = $('#cart-table'); 
    if (table) {
        async function renderCart() {
            const cart = readCart();
            const allProducts = await getAllProductsForCart();
            
            const items = Object.entries(cart).map(([cartKey, q]) => {
                const found = allProducts.find(p => {
                    const pid = String(p.id).trim();
                    const cid = String(cartKey).trim();
                    return pid === cid;
                });
                return { cartKey, p: found, q: Number(q) };
            }).filter(x => x.p && x.q > 0); 

            const total = items.reduce((s, x) => s + (x.p.sale || x.p.price) * x.q, 0); 
            if ($('#cart-subtotal')) $('#cart-subtotal').textContent = fmt(total); 
            if ($('#cart-total')) $('#cart-total').textContent = fmt(total); 

            const itemCount = items.reduce((s,x)=>s+x.q,0);
            const countNode = document.querySelector('#cart-items-count');
            if(countNode) countNode.textContent = `${itemCount} sản phẩm`;
            if (!items.length) {
                table.innerHTML = `<div class="cart-empty"><div class="cart-empty-symbol">▢</div><h2>Giỏ hàng đang trống</h2><p>Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p><a class="cart-shopping-link" href="index.html#products">KHÁM PHÁ SẢN PHẨM →</a></div>`;
                return;
            }
            table.innerHTML = items.map(({ cartKey, p, q }) => `
                <article class="cart-item cart-item-v8">
                    <a class="cart-product-image" href="product_detail.html?id=${encodeURIComponent(p.id)}"><img src="${p.image||''}" alt="${safeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'"></a>
                    <div class="cart-product-info">
                        <span class="cart-product-label">SẢN PHẨM CHÍNH HÃNG</span>
                        <h3><a href="product_detail.html?id=${encodeURIComponent(p.id)}">${safeHTML(p.name)}</a></h3>
                        <small>Mã sản phẩm: ${safeHTML(String(p.id))}</small>
                        <div class="cart-product-controls">
                            <div class="quantity-control" aria-label="Điều chỉnh số lượng">
                                <button type="button" data-qty="${cartKey}" data-d="-1" aria-label="Giảm số lượng">−</button>
                                <span>${q}</span>
                                <button type="button" data-qty="${cartKey}" data-d="1" ${q >= p.stock ? 'disabled' : ''} aria-label="Tăng số lượng">+</button>
                            </div>
                            <button type="button" class="remove-item" data-remove="${cartKey}">Xóa khỏi giỏ</button>
                        </div>
                    </div>
                    <div class="cart-product-price"><span>Thành tiền</span><b class="cart-price">${fmt((p.sale || p.price) * q)}</b><small>${fmt(p.sale || p.price)} / sản phẩm</small></div>
                </article>
            `).join('');

            // Nút tăng giảm số lượng
            table.querySelectorAll('[data-qty]').forEach(b => b.addEventListener('click', () => {
                const c = readCart();
                const key = b.dataset.qty;
                const realKey = key;
                const p = allProducts.find(x => String(x.id) === String(key));
                if (!p) return;
                
                c[realKey] = Math.max(0, Math.min(p.stock, (c[realKey] || 0) + Number(b.dataset.d))); 
                if (!c[realKey]) delete c[realKey]; 
                
                localStorage.setItem('may_store_cart', JSON.stringify(c)); 
                renderCart();
            })); 

            // Nút xóa sản phẩm
            table.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
                const c = readCart(); 
                const keyToRemove = b.dataset.remove;
                
                for (const k of Object.keys(c)) {
                    if (k === keyToRemove) {
                        delete c[k];
                    }
                }
                delete c[keyToRemove];

                localStorage.setItem('may_store_cart', JSON.stringify(c)); 
                renderCart();
            }));
        }
        await renderCart(); 
    }
});

document.addEventListener('DOMContentLoaded',()=>{const form=document.querySelector('#address-form');if(!form)return;const list=document.querySelector('#address-list'),msg=document.querySelector('#address-message');const load=async()=>{try{const r=await fetch('../backend/api/address.php');const j=await r.json();if(!r.ok)throw Error(j.thong_bao);list.innerHTML=(j.data||[]).map(a=>`<article style="padding:12px;border:1px solid #ddd;margin-top:8px"><b>${safeHTML(a.nguoi_nhan)}</b> · ${safeHTML(a.so_dien_thoai)}<p>${safeHTML(a.dia_chi_chi_tiet)}, ${safeHTML(a.phuong_xa||'')}, ${safeHTML(a.quan_huyen)}, ${safeHTML(a.tinh_thanh)}</p>${Number(a.mac_dinh)?'<b>Địa chỉ mặc định</b>':''} <button type="button" data-address-edit="${a.id}">Sửa địa chỉ</button></article>`).join('')||'Bạn chưa lưu địa chỉ giao hàng nào.'}catch(e){list.textContent=e.message}};list.addEventListener('click',async e=>{const b=e.target.closest('[data-address-edit]');if(!b)return;const r=await fetch('../backend/api/address.php');const j=await r.json();const a=(j.data||[]).find(x=>String(x.id)===b.dataset.addressEdit);if(!a)return;for(const [k,v] of Object.entries(a)){const el=form.querySelector(`[name="${k}"]`);if(el){if(el.type==='checkbox')el.checked=!!Number(v);else el.value=v}}form.dataset.editId=a.id;form.scrollIntoView({behavior:'smooth'})});form.addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(form));if(form.dataset.editId)d.id=form.dataset.editId;d.mac_dinh=form.querySelector('[name=mac_dinh]').checked?1:0;try{const r=await fetch('../backend/api/address.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});const j=await r.json();if(!r.ok)throw Error(j.thong_bao);msg.textContent=j.thong_bao;form.reset();delete form.dataset.editId;load()}catch(e){msg.textContent=e.message}});load()});


document.addEventListener('DOMContentLoaded',()=>{const btn=document.querySelector('#checkout-btn');if(!btn)return;btn.addEventListener('click',async()=>{let user=null;try{const sr=await fetch('../backend/api/session.php',{credentials:'same-origin',cache:'no-store'});const sj=await sr.json();user=sj.nguoi_dung||null}catch{}if(!user){alert('Vui lòng đăng nhập trước khi thanh toán.');location.href='login.html';return}let addressId=0;try{const ar=await fetch('../backend/api/address.php');const aj=await ar.json();const addresses=aj.data||[];if(!addresses.length){alert('Bạn chưa có địa chỉ giao hàng. Hãy cập nhật tại trang tài khoản.');location.href='profile.html';return}const chosen=addresses.find(a=>Number(a.mac_dinh))||addresses[0];addressId=Number(chosen.id);if(!confirm('Giao hàng đến: '+chosen.nguoi_nhan+' - '+chosen.dia_chi_chi_tiet+', '+chosen.quan_huyen+', '+chosen.tinh_thanh+'?'))return}catch(e){alert('Không tải được địa chỉ giao hàng. Hãy đăng nhập lại.');return}const cart=readCart();try{const r=await fetch('../backend/api/checkout.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cart,id_dia_chi:addressId,ma_giam_gia:document.getElementById('promo-code')?.value||''})});const j=await r.json();if(!r.ok)throw Error(j.thong_bao);localStorage.removeItem('may_store_cart');alert(j.thong_bao+' Mã đơn hàng: '+j.ma_don_hang);location.href='orders.html'}catch(e){alert(e.message)}})});


// Trang lịch sử đơn hàng: hiển thị thông tin có cấu trúc, không dùng kiểu nội tuyến.
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.querySelector('#my-orders-list');
  if (!root) return;
  const money = n => new Intl.NumberFormat('vi-VN', {style:'currency',currency:'VND',maximumFractionDigits:0}).format(Number(n || 0));
  const clean = value => safeHTML(value == null ? '' : value);
  const dateLabel = value => {
    if (!value) return 'Chưa xác định';
    const d = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? clean(value) : d.toLocaleString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  };
  const statusClass = value => {
    const t = String(value || '').toLowerCase();
    if (/hủy|huy/.test(t)) return 'cancelled';
    if (/hoàn thành|giao thành công|đã giao/.test(t)) return 'complete';
    if (/đang giao|vận chuyển/.test(t)) return 'shipping';
    return 'pending';
  };
  try {
    const response = await fetch('../backend/api/my_orders.php', {credentials:'same-origin',cache:'no-store'});
    const result = await response.json();
    if (!response.ok || result.thanh_cong === false) throw Error(result.thong_bao || 'Không tải được đơn hàng.');
    const orders = Array.isArray(result.data) ? result.data : [];
    if (!orders.length) {
      root.innerHTML = '<div class="orders-empty"><div class="orders-empty-icon">▢</div><h2>Bạn chưa có đơn hàng nào</h2><p>Hãy khám phá các sản phẩm công nghệ tại May Store.</p><a href="index.html#products" class="orders-shop-btn">XEM SẢN PHẨM →</a></div>';
      return;
    }
    root.innerHTML = orders.map(order => {
      const products = Array.isArray(order.san_pham) ? order.san_pham : [];
      const address = [order.dia_chi_chi_tiet,order.phuong_xa,order.quan_huyen,order.tinh_thanh].filter(Boolean).map(clean).join(', ') || 'Chưa cập nhật';
      return `<article class="order-card">
        <div class="order-head"><div><span class="order-overline">MÃ ĐƠN HÀNG</span><h2>${clean(order.ma_don_hang)}</h2><span class="order-date">Đặt lúc ${dateLabel(order.ngay_tao)}</span></div><span class="order-status ${statusClass(order.trang_thai)}">${clean(order.trang_thai || 'Đang xử lý')}</span></div>
        <div class="order-delivery"><div><span class="order-field-label">NGƯỜI NHẬN</span><strong>${clean(order.nguoi_nhan || 'Chưa cập nhật')}</strong><span>${clean(order.so_dien_thoai || '')}</span></div><div><span class="order-field-label">ĐỊA CHỈ GIAO HÀNG</span><p>${address}</p></div></div>
        <div class="order-products"><div class="order-products-title">SẢN PHẨM TRONG ĐƠN <span>${products.length} mặt hàng</span></div>${products.map(p=>`<div class="order-product"><div class="order-product-image">${p.hinh_anh ? `<img src="${clean(p.hinh_anh)}" alt="${clean(p.ten_san_pham)}" loading="lazy" onerror="this.style.display='none'">` : ''}</div><div class="order-product-name"><strong>${clean(p.ten_san_pham)}</strong><span>Số lượng: ${Math.max(0,Number(p.so_luong)||0)}</span></div><strong class="order-product-price">${money(Number(p.don_gia||0)*Number(p.so_luong||0))}</strong></div>`).join('')}</div>
        <div class="order-footer"><span>Tổng thanh toán</span><strong>${money(order.tong_tien)}</strong></div>
      </article>`;
    }).join('');
  } catch (error) {
    root.innerHTML = `<div class="orders-error"><h2>Không thể tải đơn hàng</h2><p>${clean(error.message)}</p><a href="login.html">Đăng nhập lại</a></div>`;
  }
});

// Đăng ký tài khoản: gửi dữ liệu tới PHP và hiển thị lỗi cụ thể.
document.addEventListener('DOMContentLoaded',()=>{
 const form=document.querySelector('#register-form');if(!form)return;
 form.addEventListener('submit',async e=>{e.preventDefault();const msg=document.querySelector('#form-message');const data=Object.fromEntries(new FormData(form));const submit=form.querySelector('button');if(submit)submit.disabled=true;
 if(data.mat_khau!==data.xac_nhan){msg.textContent='Mật khẩu nhập lại không khớp.';msg.style.color='#c0392b';if(submit)submit.disabled=false;return;}
 try{const r=await fetch('../backend/api/register.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const raw=await r.text();let result;try{result=JSON.parse(raw)}catch{throw Error('Không thể kết nối API đăng ký. Hãy kiểm tra Apache/MySQL và đường dẫn cài đặt.')}if(!r.ok||!result.thanh_cong)throw Error(result.thong_bao||'Không thể đăng ký.');
 localStorage.setItem('may_store_user',JSON.stringify(result.nguoi_dung||{}));msg.textContent='Tạo tài khoản thành công. Đang chuyển đến cửa hàng...';msg.style.color='#267343';setTimeout(()=>location.href='index.html',700);
 }catch(err){msg.textContent=err.message;msg.style.color='#c0392b';}finally{if(submit)submit.disabled=false;}
 });
});
