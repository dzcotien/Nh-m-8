"use strict";

/* =====================================================
   CẤU HÌNH
===================================================== */

const DUONG_DAN_API = "../../backend/api/products.php";
const DUONG_DAN_DANG_XUAT = "../../backend/api/logout.php";
const DUONG_DAN_GOC = new URL("../../", window.location.href).pathname;

let danhSachSanPham = [];
let idSanPhamDangSua = null;
let anhXemTruocTam = null;

const formSanPham = document.getElementById("product-form");
const bangSanPham = document.getElementById("admin-product-rows");
const oTimKiem = document.getElementById("admin-product-search");
const locDanhMuc = document.getElementById("admin-category-filter");
const nutMoForm = document.getElementById("open-product-form");
const nutHuy = document.getElementById("cancel-product-form");
const nutDangXuat = document.getElementById("admin-logout");
const oThongBao = document.getElementById("product-form-message");
const oTieuDeForm = document.getElementById("product-form-title");
const oDemSanPham = document.getElementById("product-count");
const oChonAnh = document.getElementById("product-image-file");
const oAnhXemTruoc = document.getElementById("product-image-preview");

/* =====================================================
   HÀM HỖ TRỢ
===================================================== */

// Hiển thị thông báo
function hienThongBao(noiDung, thanhCong = false) {
    if (!oThongBao) return;

    oThongBao.textContent = noiDung;
    oThongBao.style.color = thanhCong ? "green" : "red";
}

// Định dạng tiền Việt Nam
function dinhDangTien(soTien) {
    return Number(soTien || 0).toLocaleString("vi-VN") + " ₫";
}

// Chống lỗi khi tên sản phẩm chứa ký tự HTML
function lamSachHTML(giaTri) {
    return String(giaTri ?? "").replace(/[&<>"']/g, function (kyTu) {
        const bangMa = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return bangMa[kyTu];
    });
}

// Chuẩn hóa đường dẫn ảnh
function layDuongDanAnh(duongDan) {
    if (!duongDan) {
        return "";
    }

    duongDan = String(duongDan).trim();

    if (/^https?:\/\//i.test(duongDan)) {
        return duongDan;
    }

    if (duongDan.startsWith("/")) {
        return duongDan;
    }

    // Xử lý đường dẫn cũ lưu trong cơ sở dữ liệu
    duongDan = duongDan.replace(/^(\.\.\/)+/, "");

    return DUONG_DAN_GOC + duongDan;
}

// Gửi yêu cầu đến PHP và kiểm tra phản hồi
async function guiYeuCau(url, tuyChon = {}) {
    const phanHoi = await fetch(url, {
        credentials: "same-origin",
        ...tuyChon
    });

    const noiDung = await phanHoi.text();

    let duLieu;

    try {
        duLieu = JSON.parse(noiDung);
    } catch (loi) {
        console.error("Phản hồi không phải JSON:", noiDung);

        throw new Error(
            "Máy chủ trả về dữ liệu không hợp lệ. Hãy kiểm tra đường dẫn API hoặc lỗi PHP."
        );
    }

    if (!phanHoi.ok || duLieu.thanh_cong === false) {
        throw new Error(
            duLieu.thong_bao || "Không thể thực hiện yêu cầu."
        );
    }

    return duLieu;
}

/* =====================================================
   LẤY DANH SÁCH SẢN PHẨM
===================================================== */

async function taiDanhSachSanPham() {
    if (!bangSanPham) return;

    bangSanPham.innerHTML = `
        <tr>
            <td colspan="7">Đang tải dữ liệu sản phẩm...</td>
        </tr>
    `;

    try {
        const ketQua = await guiYeuCau(DUONG_DAN_API, {
            method: "GET"
        });

        danhSachSanPham = Array.isArray(ketQua.data)
            ? ketQua.data
            : [];

        capNhatDanhMuc();
        hienThiDanhSachSanPham();

    } catch (loi) {
        console.error(loi);

        bangSanPham.innerHTML = `
            <tr>
                <td colspan="7">
                    ${lamSachHTML(loi.message)}
                </td>
            </tr>
        `;
    }
}

/* =====================================================
   HIỂN THỊ DANH SÁCH
===================================================== */

function hienThiDanhSachSanPham() {
    if (!bangSanPham) return;

    const tuKhoa = (oTimKiem?.value || "")
        .trim()
        .toLowerCase();

    const danhMucChon = locDanhMuc?.value || "";

    const ketQua = danhSachSanPham.filter(function (sp) {
        const ten = String(sp.ten_san_pham || "").toLowerCase();
        const ma = String(sp.ma_san_pham || "").toLowerCase();

        const khopTuKhoa =
            ten.includes(tuKhoa) || ma.includes(tuKhoa);

        const khopDanhMuc =
            !danhMucChon || sp.danh_muc === danhMucChon;

        return khopTuKhoa && khopDanhMuc;
    });

    if (oDemSanPham) {
        oDemSanPham.textContent =
            `Hiển thị ${ketQua.length}/${danhSachSanPham.length} sản phẩm`;
    }

    if (ketQua.length === 0) {
        bangSanPham.innerHTML = `
            <tr>
                <td colspan="7">Không tìm thấy sản phẩm phù hợp.</td>
            </tr>
        `;
        return;
    }

    bangSanPham.innerHTML = ketQua.map(function (sp) {
        const anh = layDuongDanAnh(sp.hinh_anh);

        const trangThai = Number(sp.so_luong_ton) > 0
            ? "Còn hàng"
            : "Hết hàng";

        const mauTrangThai = Number(sp.so_luong_ton) > 0
            ? "color:green"
            : "color:red";

        return `
            <tr>
                <td>${lamSachHTML(sp.ma_san_pham)}</td>

                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${
                            anh
                                ? `<img
                                    src="${lamSachHTML(anh)}"
                                    alt="${lamSachHTML(sp.ten_san_pham)}"
                                    style="width:55px;height:55px;object-fit:contain;background:#fff;border:1px solid #ddd;"
                                    onerror="this.style.display='none'"
                                >`
                                : ""
                        }

                        <span>${lamSachHTML(sp.ten_san_pham)}</span>
                    </div>
                </td>

                <td>${lamSachHTML(sp.danh_muc)}</td>

                <td>${dinhDangTien(sp.gia_ban)}</td>

                <td>${Number(sp.so_luong_ton || 0)}</td>

                <td style="${mauTrangThai}">
                    ${trangThai}
                </td>

                <td>
                    <button
                        type="button"
                        class="admin-secondary"
                        data-action="edit"
                        data-id="${Number(sp.id)}"
                    >
                        Sửa
                    </button>

                    <button
                        type="button"
                        class="admin-secondary"
                        data-action="delete"
                        data-id="${Number(sp.id)}"
                    >
                        Xóa
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/* =====================================================
   CẬP NHẬT DANH MỤC LỌC
===================================================== */

function capNhatDanhMuc() {
    if (!locDanhMuc) return;

    const danhMucCu = locDanhMuc.value;

    const danhMuc = [
        ...new Set(
            danhSachSanPham
                .map(sp => sp.danh_muc)
                .filter(Boolean)
        )
    ];

    locDanhMuc.innerHTML = `
        <option value="">Tất cả danh mục</option>
        ${danhMuc.map(function (ten) {
            return `
                <option value="${lamSachHTML(ten)}">
                    ${lamSachHTML(ten)}
                </option>
            `;
        }).join("")}
    `;

    if (danhMuc.includes(danhMucCu)) {
        locDanhMuc.value = danhMucCu;
    }
}

/* =====================================================
   MỞ VÀ ĐÓNG FORM
===================================================== */

function moFormSanPham() {
    if (!formSanPham) return;

    formSanPham.classList.remove("hidden");
    formSanPham.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function dongFormSanPham() {
    if (!formSanPham) return;

    formSanPham.reset();
    formSanPham.classList.add("hidden");

    idSanPhamDangSua = null;

    if (oTieuDeForm) {
        oTieuDeForm.textContent = "Thêm sản phẩm mới";
    }

    if (oAnhXemTruoc) {
        oAnhXemTruoc.removeAttribute("src");
        oAnhXemTruoc.style.display = "none";
    }

    if (anhXemTruocTam) {
        URL.revokeObjectURL(anhXemTruocTam);
        anhXemTruocTam = null;
    }

    hienThongBao("");
}

/* =====================================================
   XEM TRƯỚC ẢNH
===================================================== */

if (oChonAnh && oAnhXemTruoc) {
    oChonAnh.addEventListener("change", function () {
        const tep = this.files[0];

        if (anhXemTruocTam) {
            URL.revokeObjectURL(anhXemTruocTam);
            anhXemTruocTam = null;
        }

        if (!tep) {
            oAnhXemTruoc.style.display = "none";
            oAnhXemTruoc.removeAttribute("src");
            return;
        }

        const dinhDangHopLe = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!dinhDangHopLe.includes(tep.type)) {
            alert("Chỉ được chọn ảnh JPG, PNG hoặc WEBP.");
            this.value = "";
            oAnhXemTruoc.style.display = "none";
            return;
        }

        if (tep.size > 5 * 1024 * 1024) {
            alert("Ảnh không được vượt quá 5 MB.");
            this.value = "";
            oAnhXemTruoc.style.display = "none";
            return;
        }

        anhXemTruocTam = URL.createObjectURL(tep);

        oAnhXemTruoc.src = anhXemTruocTam;
        oAnhXemTruoc.style.display = "block";
    });
}

/* =====================================================
   THÊM HOẶC CẬP NHẬT SẢN PHẨM
===================================================== */

if (formSanPham) {
    formSanPham.addEventListener("submit", async function (suKien) {
        suKien.preventDefault();

        const nutLuu = formSanPham.querySelector(
            'button[type="submit"], button:not([type])'
        );

        const duLieu = new FormData(formSanPham);

        if (idSanPhamDangSua) {
            duLieu.append("id", idSanPhamDangSua);
        }

        if (nutLuu) {
            nutLuu.disabled = true;
            nutLuu.textContent = "Đang lưu...";
        }

        try {
            const ketQua = await guiYeuCau(DUONG_DAN_API, {
                method: "POST",
                body: duLieu
            });

            alert(ketQua.thong_bao || "Lưu sản phẩm thành công.");

            dongFormSanPham();
            await taiDanhSachSanPham();

        } catch (loi) {
            console.error(loi);
            hienThongBao(loi.message);

        } finally {
            if (nutLuu) {
                nutLuu.disabled = false;
                nutLuu.textContent = "Lưu sản phẩm";
            }
        }
    });
}

/* =====================================================
   SỬA SẢN PHẨM
===================================================== */

function suaSanPham(id) {
    const sp = danhSachSanPham.find(function (item) {
        return Number(item.id) === Number(id);
    });

    if (!sp || !formSanPham) return;

    idSanPhamDangSua = Number(sp.id);

    formSanPham.elements["ma_san_pham"].value =
        sp.ma_san_pham || "";

    formSanPham.elements["ten_san_pham"].value =
        sp.ten_san_pham || "";

    formSanPham.elements["danh_muc"].value =
        sp.danh_muc || "Phụ kiện";

    formSanPham.elements["gia_ban"].value =
        sp.gia_ban || 0;

    formSanPham.elements["so_luong_ton"].value =
        sp.so_luong_ton || 0;

    formSanPham.elements["mo_ta"].value =
        sp.mo_ta || "";

    // Khi sửa, không bắt buộc chọn ảnh mới.
    oChonAnh.value = "";

    if (oAnhXemTruoc) {
        const anh = layDuongDanAnh(sp.hinh_anh);

        if (anh) {
            oAnhXemTruoc.src = anh;
            oAnhXemTruoc.style.display = "block";
        } else {
            oAnhXemTruoc.style.display = "none";
        }
    }

    if (oTieuDeForm) {
        oTieuDeForm.textContent = "Cập nhật sản phẩm";
    }

    hienThongBao(
        "Bạn có thể chọn ảnh mới hoặc giữ nguyên ảnh hiện tại.",
        true
    );

    moFormSanPham();
}

/* =====================================================
   XÓA SẢN PHẨM
===================================================== */

async function xoaSanPham(id) {
    const dongY = confirm(
        "Bạn có chắc chắn muốn xóa sản phẩm này không?"
    );

    if (!dongY) return;

    try {
        const ketQua = await guiYeuCau(
            `${DUONG_DAN_API}?id=${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        alert(ketQua.thong_bao || "Đã xóa sản phẩm.");

        await taiDanhSachSanPham();

    } catch (loi) {
        alert(loi.message);
        console.error(loi);
    }
}

/* =====================================================
   SỰ KIỆN CÁC NÚT
===================================================== */

if (nutMoForm) {
    nutMoForm.addEventListener("click", function () {
        dongFormSanPham();
        moFormSanPham();
    });
}

if (nutHuy) {
    nutHuy.addEventListener("click", dongFormSanPham);
}

if (oTimKiem) {
    oTimKiem.addEventListener("input", hienThiDanhSachSanPham);
}

if (locDanhMuc) {
    locDanhMuc.addEventListener("change", hienThiDanhSachSanPham);
}

if (bangSanPham) {
    bangSanPham.addEventListener("click", function (suKien) {
        const nut = suKien.target.closest("button[data-action]");

        if (!nut) return;

        const id = Number(nut.dataset.id);

        if (nut.dataset.action === "edit") {
            suaSanPham(id);
        }

        if (nut.dataset.action === "delete") {
            xoaSanPham(id);
        }
    });
}

/* =====================================================
   ĐĂNG XUẤT
===================================================== */

if (nutDangXuat) {
    nutDangXuat.addEventListener("click", async function () {
        if (!confirm("Bạn có muốn đăng xuất không?")) {
            return;
        }

        try {
            await guiYeuCau(DUONG_DAN_DANG_XUAT, {
                method: "POST"
            });
        } catch (loi) {
            console.warn("Không xác nhận được trạng thái đăng xuất:", loi);
        }

        window.location.href = "../index.html";
    });
}

/* =====================================================
   KHỞI ĐỘNG
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    taiDanhSachSanPham();
});
/* =====================================================
   TRUNG TÂM QUẢN TRỊ: KHÁCH HÀNG, ĐƠN HÀNG, KHO,
   KHUYẾN MÃI, DANH MỤC VÀ BẢNG ĐIỀU KHIỂN
===================================================== */
(function () {
    const API_QUAN_TRI = "../../backend/api/admin_manage.php";
    const API_DON_HANG = "../../backend/api/manage_orders.php";
    const API_TONG_QUAN = "../../backend/api/admin_overview.php";
    const $id = (id) => document.getElementById(id);
    const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const tien = (v) => Number(v || 0).toLocaleString("vi-VN") + " ₫";
    async function go(url, options = {}) {
        const res = await fetch(url, { credentials: "same-origin", cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.thanh_cong === false) throw new Error(data.thong_bao || "Không thể tải dữ liệu.");
        return data;
    }
    function showError(root, message) { if (root) root.innerHTML = `<div class="admin-empty admin-error">${esc(message)}</div>`; }
    const content = $id("admin-generic-content");
    const page = location.pathname.split("/").pop();
    let rows = [];

    async function loadGeneric() {
        if (!content) return;
        const config = {
            "customers.html": ["customers", "Danh sách khách hàng"],
            "inventory.html": ["inventory", "Tình trạng tồn kho"],
            "promotions.html": ["promotions", "Mã ưu đãi"],
            "categories.html": ["categories", "Danh mục sản phẩm"]
        }[page];
        if (!config) return;
        content.innerHTML = '<div class="admin-loading">Đang tải dữ liệu từ cơ sở dữ liệu...</div>';
        try {
            const result = await go(`${API_QUAN_TRI}?type=${config[0]}`);
            rows = result.data || [];
            renderGeneric(config[0]);
        } catch (e) { showError(content, e.message); }
    }
    function renderGeneric(type) {
        const q = ($id("admin-generic-search")?.value || "").toLocaleLowerCase("vi");
        const filtered = rows.filter(r => JSON.stringify(r).toLocaleLowerCase("vi").includes(q));
        if (type === "customers") {
            content.innerHTML = `<div class="admin-table-wrap"><table class="admin-data-table"><thead><tr><th>Khách hàng</th><th>Email</th><th>Điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${filtered.map(r=>`<tr><td><b>${esc(r.ho_ten)}</b><small>@${esc(r.ten_dang_nhap)}</small></td><td>${esc(r.email)}</td><td>${esc(r.so_dien_thoai||"—")}</td><td>${esc(r.vai_tro)}</td><td><span class="admin-status ${r.trang_thai==='hoat_dong'?'is-good':'is-bad'}">${r.trang_thai==='hoat_dong'?'Hoạt động':'Đã khóa'}</span></td><td>${r.vai_tro==='khach_hang'?`<button class="admin-action" data-customer="${r.id}" data-status="${r.trang_thai==='hoat_dong'?'khoa':'hoat_dong'}">${r.trang_thai==='hoat_dong'?'Khóa tài khoản':'Mở khóa'}</button> <button class="admin-action" data-reset-password="${r.id}">Đặt lại mật khẩu</button>`:'—'}</td></tr>`).join("")||'<tr><td colspan="6" class="empty-cell">Không tìm thấy khách hàng.</td></tr>'}</tbody></table></div><p class="admin-footnote">Tổng cộng ${filtered.length} khách hàng/tài khoản.</p>`;
        } else if (type === "inventory") {
            content.innerHTML = `<div class="admin-table-wrap"><table class="admin-data-table"><thead><tr><th>Mã sản phẩm</th><th>Sản phẩm</th><th>Tồn kho</th><th>Tình trạng</th><th>Cập nhật số lượng</th></tr></thead><tbody>${filtered.map(r=>`<tr><td>${esc(r.ma_san_pham)}</td><td><b>${esc(r.ten_san_pham)}</b></td><td><strong>${Number(r.so_luong_ton)}</strong></td><td><span class="admin-status ${Number(r.so_luong_ton)<=5?'is-bad':'is-good'}">${Number(r.so_luong_ton)<=5?'Sắp hết hàng':'Còn hàng'}</span></td><td><form class="inline-admin-form" data-stock-form="${r.id}"><input type="number" min="0" name="so_luong_ton" value="${Number(r.so_luong_ton)}"><button class="admin-action">Lưu</button></form></td></tr>`).join("")||'<tr><td colspan="5" class="empty-cell">Không có sản phẩm.</td></tr>'}</tbody></table></div>`;
        } else if (type === "promotions") {
            content.innerHTML = `<form class="admin-create-form" id="promotion-create"><label>Mã giảm giá<input name="ma_giam_gia" placeholder="VD: MAYSTORE10" required minlength="3"></label><label>Mức giảm (%)<input name="phan_tram_giam" type="number" min="1" max="90" value="10" required></label><label>Ngày hết hạn<input name="ngay_het_han" type="date"></label><button class="admin-primary">＋ Tạo mã khuyến mãi</button></form><div class="admin-table-wrap"><table class="admin-data-table"><thead><tr><th>Mã ưu đãi</th><th>Mức giảm</th><th>Ngày hết hạn</th><th>Thao tác</th></tr></thead><tbody>${filtered.map(r=>`<tr><td><b class="promo-code">${esc(r.ma_giam_gia)}</b></td><td>${Number(r.phan_tram_giam)}%</td><td>${esc(r.ngay_het_han||'Không giới hạn')}</td><td><button class="admin-action danger" data-promo-delete="${r.id}">Xóa mã</button></td></tr>`).join("")||'<tr><td colspan="4" class="empty-cell">Chưa có mã khuyến mãi. Hãy tạo mã đầu tiên.</td></tr>'}</tbody></table></div>`;
        } else if (type === "categories") {
            content.innerHTML = `<form class="admin-create-form" id="category-create"><label>Tên danh mục<input name="ten_danh_muc" placeholder="VD: Máy ảnh" required></label><label>Mô tả<input name="mo_ta" placeholder="Mô tả ngắn về danh mục"></label><button class="admin-primary">＋ Thêm danh mục</button></form><div class="admin-table-wrap"><table class="admin-data-table"><thead><tr><th>Tên danh mục</th><th>Mô tả</th><th>Số sản phẩm</th><th>Thao tác</th></tr></thead><tbody>${filtered.map(r=>`<tr><td><b>${esc(r.ten_danh_muc)}</b></td><td>${esc(r.mo_ta||'—')}</td><td>${Number(r.so_san_pham)}</td><td><button class="admin-action danger" data-category-delete="${r.id}" ${Number(r.so_san_pham)>0?'disabled title="Danh mục đang có sản phẩm"':''}>Xóa</button></td></tr>`).join("")||'<tr><td colspan="4" class="empty-cell">Chưa có danh mục.</td></tr>'}</tbody></table></div>`;
        }
    }
    async function loadOrders() {
        if (!content || page !== "orders.html") return;
        content.innerHTML = '<div class="admin-loading">Đang tải đơn hàng...</div>';
        try {
            const result = await go(API_DON_HANG); rows = result.data || [];
            const q = ($id("admin-generic-search")?.value || "").toLocaleLowerCase("vi");
            const list = rows.filter(r => JSON.stringify(r).toLocaleLowerCase("vi").includes(q));
            content.innerHTML = `<div class="admin-table-wrap"><table class="admin-data-table"><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>${list.map(r=>`<tr><td><b>${esc(r.ma_don_hang)}</b></td><td>${esc(r.ho_ten)}<small>${esc(r.email)}</small></td><td>${esc(r.ngay_tao)}</td><td><b>${tien(r.tong_tien)}</b></td><td><span class="admin-status">${esc(r.trang_thai)}</span></td><td><select class="order-status-select" data-order-id="${r.id}"><option ${r.trang_thai==='Đang xử lý'?'selected':''}>Đang xử lý</option><option ${r.trang_thai==='Đã xác nhận'?'selected':''}>Đã xác nhận</option><option ${r.trang_thai==='Đang giao'?'selected':''}>Đang giao</option><option ${r.trang_thai==='Hoàn thành'?'selected':''}>Hoàn thành</option><option ${r.trang_thai==='Đã hủy'?'selected':''}>Đã hủy</option></select></td></tr>`).join("")||'<tr><td colspan="6" class="empty-cell">Chưa có đơn hàng. Đơn mới sẽ xuất hiện tại đây sau khi khách đặt mua.</td></tr>'}</tbody></table></div><p class="admin-footnote">Hiển thị ${list.length}/${rows.length} đơn hàng.</p>`;
        } catch(e) { showError(content,e.message); }
    }
    async function loadDashboard() {
        if (!$id("metric-products")) return;
        try {
            const [overview, products] = await Promise.all([go(API_TONG_QUAN), go("../../backend/api/get_products.php")]);
            if (!overview.thong_ke) throw new Error("API thống kê không trả về dữ liệu. Kiểm tra MySQL và quyền quản trị.");
            const s=overview.thong_ke;
            $id("metric-products").textContent=s.san_pham??0;$id("metric-customers").textContent=s.khach_hang??0;$id("metric-orders").textContent=s.don_hang??0;$id("metric-revenue").textContent=tien(s.gia_tri_don ?? s.doanh_thu);
            const body=$id("dashboard-products");if(body){const list=(products.data||[]).slice(0,7);body.innerHTML=list.map(p=>`<tr><td>${esc(p.ma_san_pham)}</td><td>${esc(p.ten_san_pham)}</td><td>${tien(p.gia_khuyen_mai||p.gia_ban)}</td><td>${Number(p.so_luong_ton)}</td><td><span class="admin-status ${Number(p.so_luong_ton)<=5?'is-bad':'is-good'}">${Number(p.so_luong_ton)<=5?'Sắp hết':'Đang bán'}</span></td></tr>`).join("")||'<tr><td colspan="5">Chưa có sản phẩm.</td></tr>';}
            const desc=document.querySelector('.welcome-banner > div > p:last-child');if(desc)desc.textContent=`${s.don_moi||0} đơn cần xử lý · ${s.sap_het_hang||0} sản phẩm sắp hết hàng.`;
        } catch(e) { const desc=document.querySelector('.welcome-banner > div > p:last-child');if(desc)desc.textContent="LỖI TẢI THỐNG KÊ: " + e.message; const body=$id("dashboard-products");if(body)body.innerHTML=`<tr><td colspan="5">${esc(e.message)}</td></tr>`; for(const id of ["metric-products","metric-customers","metric-orders","metric-revenue"]){const el=$id(id);if(el)el.textContent="—";} }
    }
    if ($id("generic-search-btn")) $id("generic-search-btn").addEventListener("click",()=>page==="orders.html"?loadOrders():loadGeneric());
    if ($id("admin-generic-search")) $id("admin-generic-search").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();page==="orders.html"?loadOrders():loadGeneric();}});
    if (content) content.addEventListener("submit",async e=>{
        e.preventDefault();const form=e.target;
        try{
            if(form.id==="promotion-create"){const data=Object.fromEntries(new FormData(form));await go(API_QUAN_TRI,{method:"POST",body:JSON.stringify({action:"promotion",...data})});}
            else if(form.id==="category-create"){const data=Object.fromEntries(new FormData(form));await go(API_QUAN_TRI,{method:"POST",body:JSON.stringify({action:"category",...data})});}
            else if(form.dataset.stockForm){const data=Object.fromEntries(new FormData(form));await go(API_QUAN_TRI,{method:"POST",body:JSON.stringify({action:"stock",id:form.dataset.stockForm,...data})});}
            alert("Đã lưu thay đổi.");loadGeneric();
        }catch(err){alert(err.message);}
    });
    if(content)content.addEventListener("change",async e=>{const el=e.target;if(!el.matches("[data-order-id]"))return;try{await go(API_DON_HANG,{method:"PATCH",body:JSON.stringify({id:el.dataset.orderId,trang_thai:el.value})});alert("Đã cập nhật trạng thái đơn hàng.");loadOrders();}catch(err){alert(err.message);loadOrders();}});
    if(content)content.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;try{
        if(b.dataset.resetPassword){
            const pass=prompt("Nhập mật khẩu mới cho khách hàng (tối thiểu 8 ký tự):");
            if(pass===null)return;
            if(pass.length<8||pass.length>72){alert("Mật khẩu phải từ 8 đến 72 ký tự.");return;}
            if(!confirm("Xác nhận đặt lại mật khẩu cho khách hàng này?"))return;
            await go(API_QUAN_TRI,{method:"POST",body:JSON.stringify({action:"reset_customer_password",id:Number(b.dataset.resetPassword),mat_khau_moi:pass})});
            alert("Đã đặt lại mật khẩu. Hãy thông báo mật khẩu mới cho khách hàng qua kênh riêng.");
            loadGeneric();return;
        }
        if(b.dataset.customer){await go(API_QUAN_TRI,{method:"POST",body:JSON.stringify({action:"customer_status",id:b.dataset.customer,trang_thai:b.dataset.status})});loadGeneric();}
        if(b.dataset.promoDelete&&confirm("Bạn có chắc muốn xóa mã khuyến mãi này?")){await go(API_QUAN_TRI,{method:"POST",body:JSON.stringify({action:"promotion_delete",id:b.dataset.promoDelete})});loadGeneric();}
        if(b.dataset.categoryDelete&&confirm("Xóa danh mục này?")){await go(API_QUAN_TRI,{method:"POST",body:JSON.stringify({action:"category_delete",id:b.dataset.categoryDelete})});loadGeneric();}
    }catch(err){alert(err.message);}
    });
    document.addEventListener("DOMContentLoaded",()=>{
        loadGeneric(); loadOrders(); loadDashboard();
        if ($id("metric-products")) {
            window.addEventListener("focus", loadDashboard);
            document.addEventListener("visibilitychange", () => { if (!document.hidden) loadDashboard(); });
            window.setInterval(() => { if (!document.hidden) loadDashboard(); }, 15000);
        }
    });
})();
