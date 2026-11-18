-- MAY STORE: CHỈ SỬ DỤNG KHI CÀI MỚI. KHÔNG IMPORT VÀO DATABASE ĐANG CÓ DỮ LIỆU.
CREATE DATABASE IF NOT EXISTS maystore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE maystore;

CREATE TABLE IF NOT EXISTS nguoi_dung (
 id INT AUTO_INCREMENT PRIMARY KEY, ho_ten VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL UNIQUE,
 ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE, mat_khau VARCHAR(255) NOT NULL, so_dien_thoai VARCHAR(20),
 ngay_sinh DATE NULL, gioi_tinh VARCHAR(10) NULL, vai_tro ENUM('quan_tri','khach_hang') DEFAULT 'khach_hang',
 trang_thai ENUM('hoat_dong','khoa') DEFAULT 'hoat_dong', ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS san_pham (
 id INT AUTO_INCREMENT PRIMARY KEY, ma_san_pham VARCHAR(50) NOT NULL UNIQUE, ten_san_pham VARCHAR(200) NOT NULL,
 danh_muc VARCHAR(100) NOT NULL, gia_ban DECIMAL(12,2) NOT NULL, gia_khuyen_mai DECIMAL(12,2) NULL,
 so_luong_ton INT NOT NULL DEFAULT 0, hinh_anh TEXT, mo_ta TEXT, ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dia_chi_giao_hang (
 id INT AUTO_INCREMENT PRIMARY KEY, id_nguoi_dung INT NOT NULL, nguoi_nhan VARCHAR(100) NOT NULL,
 so_dien_thoai VARCHAR(20) NOT NULL, dia_chi_chi_tiet VARCHAR(255) NOT NULL, phuong_xa VARCHAR(100),
 quan_huyen VARCHAR(100) NOT NULL, tinh_thanh VARCHAR(100) NOT NULL, mac_dinh TINYINT(1) DEFAULT 0,
 FOREIGN KEY(id_nguoi_dung) REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS don_hang (
 id INT AUTO_INCREMENT PRIMARY KEY, ma_don_hang VARCHAR(50) NOT NULL UNIQUE, id_nguoi_dung INT NOT NULL,
 id_dia_chi INT NULL, tong_tien DECIMAL(12,2) NOT NULL, trang_thai VARCHAR(50) DEFAULT 'Đang xử lý',
 ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(id_nguoi_dung) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
 FOREIGN KEY(id_dia_chi) REFERENCES dia_chi_giao_hang(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS chi_tiet_don_hang (
 id INT AUTO_INCREMENT PRIMARY KEY, id_don_hang INT NOT NULL, id_san_pham INT NOT NULL, so_luong INT NOT NULL,
 don_gia DECIMAL(12,2) NOT NULL, FOREIGN KEY(id_don_hang) REFERENCES don_hang(id) ON DELETE CASCADE,
 FOREIGN KEY(id_san_pham) REFERENCES san_pham(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS danh_muc_san_pham (id INT AUTO_INCREMENT PRIMARY KEY, ten_danh_muc VARCHAR(100) NOT NULL UNIQUE, mo_ta VARCHAR(255) NULL, ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS khuyen_mai (id INT AUTO_INCREMENT PRIMARY KEY, ma_giam_gia VARCHAR(50) NOT NULL UNIQUE, phan_tram_giam INT NOT NULL, ngay_het_han DATE NULL) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS danh_gia (
 id INT AUTO_INCREMENT PRIMARY KEY, id_san_pham INT NOT NULL, id_nguoi_dung INT NOT NULL,
 so_sao TINYINT NOT NULL, noi_dung TEXT, ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY danh_gia_moi_nguoi (id_san_pham,id_nguoi_dung),
 CONSTRAINT fk_danh_gia_san_pham FOREIGN KEY(id_san_pham) REFERENCES san_pham(id) ON DELETE CASCADE,
 CONSTRAINT fk_danh_gia_nguoi_dung FOREIGN KEY(id_nguoi_dung) REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bổ sung cột cho các CSDL đã tạo từ phiên bản trước, không xóa dữ liệu.

-- Tài khoản mẫu: mật khẩu mặc định của hai tài khoản là password.
INSERT IGNORE INTO nguoi_dung(ho_ten,email,ten_dang_nhap,mat_khau,so_dien_thoai,vai_tro,trang_thai) VALUES
('Quản Trị Viên','admin@maystore.local','admin','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0900000000','quan_tri','hoat_dong'),
('Khách Hàng Mẫu','khachhang01@maystore.local','khachhang01','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0912345678','khach_hang','hoat_dong'),
('Khách hàng 02','khachhang02@maystore.local','khachhang02','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0912345602','khach_hang','hoat_dong'),
('Khách hàng 03','khachhang03@maystore.local','khachhang03','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0912345603','khach_hang','hoat_dong'),
('Khách hàng 04','khachhang04@maystore.local','khachhang04','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0912345604','khach_hang','hoat_dong'),
('Khách hàng 05','khachhang05@maystore.local','khachhang05','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0912345605','khach_hang','hoat_dong'),
('Khách hàng 06','khachhang06@maystore.local','khachhang06','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0912345606','khach_hang','hoat_dong'),
('Khách hàng 07','khachhang07@maystore.local','khachhang07','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0912345607','khach_hang','hoat_dong'),
('Khách hàng 08','khachhang08@maystore.local','khachhang08','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0912345608','khach_hang','hoat_dong'),
('Khách hàng 09','khachhang09@maystore.local','khachhang09','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','0912345609','khach_hang','hoat_dong');

INSERT IGNORE INTO danh_muc_san_pham(ten_danh_muc,mo_ta) VALUES ('Máy tính xách tay','Laptop phục vụ học tập và làm việc'),('Điện thoại','Điện thoại thông minh chính hãng'),('Máy tính bảng','Máy tính bảng phục vụ học tập và giải trí'),('Âm thanh','Tai nghe và loa'),('Thiết bị đeo','Đồng hồ thông minh'),('Phụ kiện máy tính','Thiết bị ngoại vi và phụ kiện máy tính'),('Phụ kiện','Cáp sạc và phụ kiện công nghệ');

INSERT IGNORE INTO san_pham (ma_san_pham, ten_san_pham, danh_muc, gia_ban, so_luong_ton, hinh_anh, mo_ta) VALUES
('SP001', 'iPhone 15 Pro Max 256GB', 'Điện thoại', 29990000, 15, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', 'Titan tự nhiên, chip A17 Pro mạnh mẽ, camera zoom quang học 5x.'),
('SP002', 'Samsung Galaxy S24 Ultra', 'Điện thoại', 27990000, 12, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80', 'Tích hợp AI quyền năng, bút S-Pen tiện lợi, màn hình phẳng sắc nét.'),
('SP003', 'MacBook Air M3 15 inch', 'Máy tính xách tay', 32990000, 8, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 'Hiệu năng đỉnh cao với chip M3, thiết kế siêu mỏng nhẹ, thời lượng pin 18 giờ.'),
('SP004', 'Tai nghe AirPods Pro 2', 'Âm thanh', 5990000, 25, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80', 'Khử tiếng ồn chủ động thông minh, âm thanh không gian sống động.'),
('SP005', 'Đồng hồ Apple Watch Series 9', 'Thiết bị đeo', 10490000, 10, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80', 'Màn hình sáng hơn, thao tác chạm hai lần kỳ diệu, theo dõi sức khỏe toàn diện.'),
('SP006', 'Bàn phím cơ Keychron K8 Pro', 'Phụ kiện máy tính', 2190000, 20, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 'Kết nối không dây linh hoạt, gõ êm ái, LED RGB rực rỡ.'),
('SP007', 'Chuột Logitech MX Master 3S', 'Phụ kiện máy tính', 2490000, 18, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', 'Cuộn 1,000 dòng mỗi giây, cảm biến 8000 DPI trên mọi mặt kính.'),
('SP008', 'Cáp sạc nhanh Anker 100W', 'Phụ kiện', 490000, 50, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80', 'Sạc siêu tốc cho laptop và điện thoại, bền bỉ gấp 10 lần.'),
('SP009', 'Xiaomi 14 Pro', 'Điện thoại', 19990000, 14, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80', 'Ống kính Leica Summilux, hiệu năng Snapdragon 8 Gen 3 đỉnh cao.'),
('SP010', 'Sony WH-1000XM5', 'Âm thanh', 7990000, 10, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', 'Chống ồn hàng đầu ngành, âm thanh phân giải cao cực kỳ chi tiết.'),
('SP011', 'iPad Pro M4 11 inch', 'Máy tính bảng', 26990000, 9, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80', 'Màn hình Ultra Retina XDR siêu mỏng nhẹ, chip M4 cực mạnh.'),
('SP012', 'Samsung Galaxy Tab S9 Ultra', 'Máy tính bảng', 23990000, 7, 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80', 'Màn hình Dynamic AMOLED 2X rộng lớn 14.6 inch, kháng nước IP68.'),
('SP013', 'Loa Bluetooth Marshall Emberton II', 'Âm thanh', 3990000, 22, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', 'Thiết kế cổ điển đặc trưng, âm thanh 360 độ mạnh mẽ, chống nước.'),
('SP014', 'Đồng hồ Garmin Forerunner 965', 'Thiết bị đeo', 15990000, 6, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80', 'Đồng hồ chuyên dụng cho chạy bộ và thể thao, màn hình AMOLED sắc nét.'),
('SP015', 'Ổ cứng di động SSD Samsung T7 1TB', 'Phụ kiện máy tính', 2590000, 30, 'https://images.unsplash.com/photo-1531492736221-726ff963325e?auto=format&fit=crop&w=800&q=80', 'Tốc độ đọc ghi lên tới 1050 MB/s, nhỏ gọn trong lòng bàn tay.'),
('SP016', 'Sạc dự phòng Ugreen 20000mAh 130W', 'Phụ kiện', 1290000, 25, 'https://images.unsplash.com/photo-1609592424104-1b248a1c77f0?auto=format&fit=crop&w=800&q=80', 'Sạc nhanh đa thiết bị cùng lúc, hiển thị dung lượng kỹ thuật số.'),
('SP017', 'Google Pixel 8 Pro', 'Điện thoại', 18990000, 11, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', 'Trải nghiệm Android thuần túy, tính năng AI chụp ảnh và chỉnh sửa xuất sắc.'),
('SP018', 'Hub chuyển đổi HyperDrive 8-in-1', 'Phụ kiện máy tính', 1490000, 35, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80', 'Mở rộng cổng kết nối đa dạng HDMI, USB-C, thẻ nhớ SD tiện lợi.'),
('SP019', 'Đế tản nhiệt Laptop Cooler Master', 'Phụ kiện máy tính', 690000, 28, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 'Làm mát hiệu quả cho máy chơi game và làm việc cường độ cao.'),
('SP020', 'Cáp Type-C to Lightning 1m', 'Phụ kiện', 350000, 60, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80', 'Chính hãng, bền bỉ, hỗ trợ sạc nhanh và truyền dữ liệu ổn định.');
-- Anh san pham noi bo: khong phu thuoc dich vu anh ben ngoai.
