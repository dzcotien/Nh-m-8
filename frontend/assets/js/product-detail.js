/**
 * Trang chi tiết sản phẩm - May Store.
 * Hiển thị thông tin sản phẩm, giỏ hàng và đánh giá khách hàng.
 */

// Chuyển ký tự đặc biệt thành nội dung an toàn khi chèn vào HTML.
const safeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (kyTu) => {
    const bangKyTu = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return bangKyTu[kyTu];
  });

// Định dạng tiền Việt Nam.
const money = (giaTri) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(giaTri || 0));

// Tạo dãy sao đánh giá từ 1 đến 5.
function hienThiSoSao(diem) {
  const soSao = Math.max(0, Math.min(5, Math.round(Number(diem) || 0)));
  return "★".repeat(soSao) + "☆".repeat(5 - soSao);
}

// Tạo giao diện thông tin sản phẩm và biểu mẫu đánh giá.
function taoGiaoDienSanPham(sanPham) {
  const p = sanPham;
  const soLuongTon = Number(p.so_luong_ton) || 0;
  const giaBan = p.gia_khuyen_mai || p.gia_ban;
  const giaGoc = p.gia_khuyen_mai ? `<del>${money(p.gia_ban)}</del>` : "";
  const trangThaiKho =
    soLuongTon > 0 ? `Còn ${soLuongTon} sản phẩm` : "Tạm hết hàng";

  return `
        <div class="detail-layout detail-v7">
            <div class="detail-v7-gallery">
                <img
                    src="${safeHTML(p.hinh_anh || "")}"
                    alt="${safeHTML(p.ten_san_pham)}"
                    class="detail-v7-image"
                    onerror="this.alt='Ảnh sản phẩm chưa được cập nhật'"
                >
            </div>

            <div class="detail-copy detail-v7-copy">
                <p class="eyebrow">
                    ${safeHTML(p.danh_muc)} / ${safeHTML(p.ma_san_pham)}
                </p>

                <h1 class="page-title">${safeHTML(p.ten_san_pham)}</h1>

                <div class="detail-v7-stars">
                    ${hienThiSoSao(p.diem_danh_gia)}
                    <span style="font-size: 14px; color: #666">
                        ${Number(p.diem_danh_gia || 0).toFixed(1)}/5
                        · ${Number(p.so_danh_gia) || 0} đánh giá
                    </span>
                </div>

                <p>
                    ${safeHTML(
                      p.mo_ta ||
                        "Thông tin chi tiết sản phẩm đang được cập nhật.",
                    )}
                </p>

                <h2 class="detail-v7-price">${money(giaBan)}</h2>
                ${giaGoc}
                <p>${trangThaiKho}</p>

                <label class="detail-v7-quantity">
                    Số lượng
                    <input
                        id="detail-qty"
                        type="number"
                        min="1"
                        max="${soLuongTon}"
                        value="1"
                        style="width: 80px; padding: 8px"
                    >
                </label>

                <p class="detail-v7-actions">
                    <button
                        class="btn dark"
                        id="detail-add"
                        ${soLuongTon <= 0 ? "disabled" : ""}
                    >
                        THÊM VÀO GIỎ HÀNG
                    </button>
                    <a class="btn outline" href="cart.html">XEM GIỎ HÀNG</a>
                </p>
            </div>
        </div>

        <section class="detail-v7-reviews">
            <div class="detail-v7-reviews-head">
                <p class="eyebrow">PHẢN HỒI THỰC TẾ</p>
                <h2>Đánh giá của khách hàng</h2>
                <p>
                    Chia sẻ trải nghiệm mua sắm và giúp khách hàng khác
                    lựa chọn sản phẩm phù hợp.
                </p>
            </div>

            <div id="review-list">Đang tải đánh giá...</div>

            <form id="review-form" class="detail-v7-review-form">
                <h3>Viết đánh giá của bạn</h3>

                <label>
                    Số sao
                    <select name="so_sao">
                        <option value="5">★★★★★ - Rất hài lòng</option>
                        <option value="4">★★★★ - Hài lòng</option>
                        <option value="3">★★★ - Bình thường</option>
                        <option value="2">★★ - Chưa hài lòng</option>
                        <option value="1">★ - Không hài lòng</option>
                    </select>
                </label>

                <label style="display: block; margin: 12px 0">
                    Nhận xét
                    <textarea
                        name="noi_dung"
                        rows="4"
                        style="width: 100%"
                        placeholder="Chia sẻ trải nghiệm của bạn"
                    ></textarea>
                </label>

                <button class="btn dark">GỬI ĐÁNH GIÁ</button>
                <p id="review-message"></p>
            </form>
        </section>
    `;
}

// Đưa sản phẩm vào giỏ hàng lưu trong trình duyệt.
function themVaoGioHang(sanPham) {
  const soLuongTon = Number(sanPham.so_luong_ton) || 0;
  const oSoLuong = document.querySelector("#detail-qty");
  const soLuongNhap = Number(oSoLuong.value) || 1;
  const soLuongThem = Math.max(1, Math.min(soLuongTon, soLuongNhap));

  let gioHang = {};

  try {
    gioHang = JSON.parse(localStorage.getItem("may_store_cart") || "{}") || {};
  } catch {
    gioHang = {};
  }

  const maSanPham = String(sanPham.id);
  const soLuongHienTai = Number(gioHang[maSanPham]) || 0;

  gioHang[maSanPham] = Math.min(soLuongTon, soLuongHienTai + soLuongThem);

  localStorage.setItem("may_store_cart", JSON.stringify(gioHang));
  alert("Đã thêm sản phẩm vào giỏ hàng.");
}

// Hiển thị danh sách đánh giá của khách hàng.
function hienThiDanhGia(danhSachDanhGia) {
  const khungDanhGia = document.querySelector("#review-list");

  if (!danhSachDanhGia.length) {
    khungDanhGia.innerHTML = `
            <div class="detail-v7-empty">
                Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ
                trải nghiệm về sản phẩm này.
            </div>
        `;
    return;
  }

  khungDanhGia.innerHTML = danhSachDanhGia
    .map(
      (danhGia) => `
            <article class="detail-v7-review">
                <b>${safeHTML(danhGia.ho_ten)}</b>
                <div style="color: #d39b00">
                    ${hienThiSoSao(danhGia.so_sao)}
                </div>
                <p>
                    ${safeHTML(
                      danhGia.noi_dung || "Khách hàng chưa để lại nhận xét.",
                    )}
                </p>
                <small>${safeHTML(danhGia.ngay_tao)}</small>
            </article>
        `,
    )
    .join("");
}

// Gửi đánh giá sản phẩm đến máy chủ.
async function guiDanhGia(suKien, sanPham) {
  suKien.preventDefault();

  const thongBao = document.querySelector("#review-message");
  let nguoiDung = null;

  try {
    nguoiDung = JSON.parse(localStorage.getItem("may_store_user") || "null");
  } catch {
    nguoiDung = null;
  }

  if (!nguoiDung) {
    thongBao.textContent = "Vui lòng đăng nhập trước khi đánh giá.";
    return;
  }

  const duLieuBieuMau = Object.fromEntries(new FormData(suKien.currentTarget));

  try {
    const phanHoi = await fetch("../backend/api/reviews.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_san_pham: sanPham.id,
        ...duLieuBieuMau,
      }),
    });

    const ketQua = await phanHoi.json();
    thongBao.textContent = ketQua.thong_bao || "Không thể gửi đánh giá.";

    if (phanHoi.ok) {
      location.reload();
    }
  } catch {
    thongBao.textContent = "Không thể kết nối máy chủ. Vui lòng thử lại.";
  }
}

// Tải dữ liệu khi trang đã sẵn sàng.
document.addEventListener("DOMContentLoaded", async () => {
  const khungChiTiet = document.querySelector("#detail-root");

  if (!khungChiTiet) {
    return;
  }

  const maSanPham = new URLSearchParams(location.search).get("id") || "";

  try {
    const duongDanAPI =
      "../backend/api/product_detail.php?id=" + encodeURIComponent(maSanPham);

    const phanHoi = await fetch(duongDanAPI);
    const duLieu = await phanHoi.json();

    if (!phanHoi.ok || !duLieu.thanh_cong) {
      throw new Error(duLieu.thong_bao || "Không tìm thấy sản phẩm.");
    }

    const sanPham = duLieu.san_pham;
    khungChiTiet.innerHTML = taoGiaoDienSanPham(sanPham);

    document.querySelector("#detail-add").addEventListener("click", () => {
      themVaoGioHang(sanPham);
    });

    hienThiDanhGia(duLieu.danh_gia || []);

    document
      .querySelector("#review-form")
      .addEventListener("submit", (suKien) => guiDanhGia(suKien, sanPham));
  } catch (loi) {
    khungChiTiet.innerHTML = `
            <p>
                ${safeHTML(loi.message)}.
                Hãy mở website qua Apache trên XAMPP,
                không mở trực tiếp tệp HTML.
            </p>
        `;
  }
});
