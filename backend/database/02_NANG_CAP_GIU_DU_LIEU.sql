-- MAY STORE: NÂNG CẤP CSDL ĐANG SỬ DỤNG — KHÔNG XÓA DỮ LIỆU
-- BƯỚC 1: Xuất bản sao lưu CSDL maystore bằng phpMyAdmin.
-- BƯỚC 2: Chọn database maystore rồi chạy tệp này trong mục SQL.
-- Chạy lặp lại được; không thay đổi mật khẩu hiện có, không thêm tài khoản mẫu.
CREATE DATABASE IF NOT EXISTS maystore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE maystore;
CREATE TABLE IF NOT EXISTS danh_muc_san_pham (
 id INT AUTO_INCREMENT PRIMARY KEY,
 ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,
 mo_ta VARCHAR(255) NULL,
 ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
INSERT IGNORE INTO danh_muc_san_pham (ten_danh_muc,mo_ta)
SELECT DISTINCT danh_muc, 'Danh mục sản phẩm hiện có' FROM san_pham WHERE danh_muc IS NOT NULL AND danh_muc <> '';
INSERT IGNORE INTO danh_muc_san_pham(ten_danh_muc,mo_ta)
VALUES ('Máy tính xách tay','Laptop phục vụ học tập và làm việc');
UPDATE san_pham SET danh_muc='Máy tính xách tay'
WHERE ten_san_pham LIKE '%MacBook%' AND danh_muc='Máy tính bảng';
-- Không tự thay đổi mật khẩu / trạng thái tài khoản.
SELECT (SELECT COUNT(*) FROM san_pham) AS tong_san_pham,
 (SELECT COUNT(*) FROM nguoi_dung WHERE vai_tro='khach_hang') AS tong_khach_hang,
 (SELECT COUNT(*) FROM don_hang) AS tong_don_hang,
 (SELECT COALESCE(SUM(tong_tien),0) FROM don_hang WHERE trang_thai='Hoàn thành') AS doanh_thu_hoan_thanh;
