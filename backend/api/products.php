<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| API QUẢN LÝ SẢN PHẨM - MAY STORE
|--------------------------------------------------------------------------
| GET    : Lấy danh sách sản phẩm
| POST   : Thêm sản phẩm hoặc cập nhật sản phẩm
| DELETE : Xóa sản phẩm
|--------------------------------------------------------------------------
*/

session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth_guard.php';
requireActiveAccount($pdo,true);

/*
|--------------------------------------------------------------------------
| HÀM TRẢ VỀ JSON
|--------------------------------------------------------------------------
*/

function traVeJSON(
    bool $thanhCong,
    string $thongBao,
    array $duLieu = [],
    int $maHTTP = 200
): void {
    http_response_code($maHTTP);

    echo json_encode(
        [
            'thanh_cong' => $thanhCong,
            'thong_bao' => $thongBao,
            'data' => $duLieu
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| KIỂM TRA ĐĂNG NHẬP QUẢN TRỊ
|--------------------------------------------------------------------------
*/

if (($_SESSION['vai_tro'] ?? '') !== 'quan_tri') {
    traVeJSON(
        false,
        'Bạn cần đăng nhập bằng tài khoản quản trị.',
        [],
        403
    );
}

/*
|--------------------------------------------------------------------------
| KIỂM TRA KẾT NỐI DATABASE
|--------------------------------------------------------------------------
*/

if (!isset($pdo) || !($pdo instanceof PDO)) {
    traVeJSON(
        false,
        'Không tìm thấy kết nối cơ sở dữ liệu PDO.',
        [],
        500
    );
}

$phuongThuc = $_SERVER['REQUEST_METHOD'];

/*
|--------------------------------------------------------------------------
| HÀM KIỂM TRA VÀ TẢI ẢNH LÊN MÁY CHỦ
|--------------------------------------------------------------------------
*/

function taiAnhSanPhamLen(): ?string
{
    if (
        !isset($_FILES['hinh_anh']) ||
        $_FILES['hinh_anh']['error'] === UPLOAD_ERR_NO_FILE
    ) {
        return null;
    }

    $tepAnh = $_FILES['hinh_anh'];

    if ($tepAnh['error'] !== UPLOAD_ERR_OK) {
        traVeJSON(false, 'Có lỗi trong quá trình tải ảnh lên.', [], 422);
    }

    if (!is_uploaded_file($tepAnh['tmp_name'])) {
        traVeJSON(false, 'Tệp ảnh tải lên không hợp lệ.', [], 422);
    }

    // Giới hạn dung lượng 5 MB
    if ($tepAnh['size'] > 5 * 1024 * 1024) {
        traVeJSON(false, 'Ảnh không được vượt quá 5 MB.', [], 422);
    }

    // Kiểm tra loại ảnh thực tế
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $loaiAnh = $finfo->file($tepAnh['tmp_name']);

    $danhSachDuoiAnh = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ];

    if (!isset($danhSachDuoiAnh[$loaiAnh])) {
        traVeJSON(
            false,
            'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.',
            [],
            422
        );
    }

    // Kiểm tra tệp có thực sự là ảnh
    if (@getimagesize($tepAnh['tmp_name']) === false) {
        traVeJSON(false, 'Tệp tải lên không phải ảnh hợp lệ.', [], 422);
    }

    $duoiAnh = $danhSachDuoiAnh[$loaiAnh];

    $tenTep = 'sp_' . bin2hex(random_bytes(12)) . '.' . $duoiAnh;

    $thuMucAnh = __DIR__ . '/../uploads/products/';

    if (
        !is_dir($thuMucAnh) &&
        !mkdir($thuMucAnh, 0755, true)
    ) {
        traVeJSON(
            false,
            'Không thể tạo thư mục lưu ảnh sản phẩm.',
            [],
            500
        );
    }

    $duongDanDayDu = $thuMucAnh . $tenTep;

    if (!move_uploaded_file($tepAnh['tmp_name'], $duongDanDayDu)) {
        traVeJSON(false, 'Không thể lưu ảnh lên máy chủ.', [], 500);
    }

    /*
     * Đường dẫn công khai của ảnh.
     * Dự án đang nằm tại:
     * C:\xampp\htdocs\maystore
     */
    return dirname(dirname(dirname($_SERVER['SCRIPT_NAME']))) . '/backend/uploads/products/' . $tenTep;
}

/*
|--------------------------------------------------------------------------
| GET - LẤY DANH SÁCH SẢN PHẨM
|--------------------------------------------------------------------------
*/

if ($phuongThuc === 'GET') {
    try {
        $sql = "
            SELECT
                s.*,
                COALESCE(d.diem_danh_gia, 0) AS diem_danh_gia,
                COALESCE(d.so_danh_gia, 0) AS so_danh_gia
            FROM san_pham s
            LEFT JOIN (
                SELECT
                    id_san_pham,
                    ROUND(AVG(so_sao), 1) AS diem_danh_gia,
                    COUNT(*) AS so_danh_gia
                FROM danh_gia
                GROUP BY id_san_pham
            ) d ON d.id_san_pham = s.id
            ORDER BY s.id DESC
        ";

        $truyVan = $pdo->query($sql);

        $danhSach = $truyVan->fetchAll(PDO::FETCH_ASSOC);

        traVeJSON(
            true,
            'Lấy danh sách sản phẩm thành công.',
            $danhSach
        );

    } catch (PDOException $loi) {
        error_log($loi->getMessage());

        traVeJSON(
            false,
            'Không thể lấy danh sách sản phẩm. Hãy kiểm tra bảng sản phẩm và đánh giá.',
            [],
            500
        );
    }
}

/*
|--------------------------------------------------------------------------
| POST - THÊM HOẶC CẬP NHẬT SẢN PHẨM
|--------------------------------------------------------------------------
*/

if ($phuongThuc === 'POST') {
    try {
        $id = (int)($_POST['id'] ?? 0);

        $maSanPham = trim($_POST['ma_san_pham'] ?? '');
        $tenSanPham = trim($_POST['ten_san_pham'] ?? '');
        $danhMuc = trim($_POST['danh_muc'] ?? 'Khác');
        $moTa = trim($_POST['mo_ta'] ?? '');

        $giaBan = filter_var(
            $_POST['gia_ban'] ?? null,
            FILTER_VALIDATE_FLOAT
        );

        $soLuongTon = filter_var(
            $_POST['so_luong_ton'] ?? null,
            FILTER_VALIDATE_INT
        );

        $giaKhuyenMaiNhap = trim(
            $_POST['gia_khuyen_mai'] ?? ''
        );

        $giaKhuyenMai = null;

        if ($giaKhuyenMaiNhap !== '') {
            $giaKhuyenMai = filter_var(
                $giaKhuyenMaiNhap,
                FILTER_VALIDATE_FLOAT
            );
        }

        // Kiểm tra dữ liệu bắt buộc
        if (
            $maSanPham === '' ||
            $tenSanPham === '' ||
            $giaBan === false ||
            $giaBan <= 0 ||
            $soLuongTon === false ||
            $soLuongTon < 0
        ) {
            traVeJSON(
                false,
                'Vui lòng nhập đầy đủ mã, tên, giá bán và số lượng tồn hợp lệ.',
                [],
                422
            );
        }

        // Kiểm tra giá khuyến mãi
        if (
            $giaKhuyenMaiNhap !== '' &&
            (
                $giaKhuyenMai === false ||
                $giaKhuyenMai <= 0 ||
                $giaKhuyenMai >= $giaBan
            )
        ) {
            traVeJSON(
                false,
                'Giá khuyến mãi phải lớn hơn 0 và nhỏ hơn giá bán.',
                [],
                422
            );
        }

        // Kiểm tra mã sản phẩm đã tồn tại
        if ($id > 0) {
            $kiemTraMa = $pdo->prepare("
                SELECT id
                FROM san_pham
                WHERE ma_san_pham = ?
                AND id <> ?
                LIMIT 1
            ");

            $kiemTraMa->execute([$maSanPham, $id]);

        } else {
            $kiemTraMa = $pdo->prepare("
                SELECT id
                FROM san_pham
                WHERE ma_san_pham = ?
                LIMIT 1
            ");

            $kiemTraMa->execute([$maSanPham]);
        }

        if ($kiemTraMa->fetch()) {
            traVeJSON(
                false,
                'Mã sản phẩm đã tồn tại. Vui lòng nhập mã khác.',
                [],
                422
            );
        }

        // Tải ảnh mới nếu người dùng chọn ảnh
        $anhMoi = taiAnhSanPhamLen();

        /*
         * THÊM SẢN PHẨM
         */
        if ($id === 0) {
            $duongDanAnh = $anhMoi ?? '';

            $sql = "
                INSERT INTO san_pham (
                    ma_san_pham,
                    ten_san_pham,
                    danh_muc,
                    gia_ban,
                    gia_khuyen_mai,
                    so_luong_ton,
                    hinh_anh,
                    mo_ta
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ";

            $truyVan = $pdo->prepare($sql);

            $truyVan->execute([
                $maSanPham,
                $tenSanPham,
                $danhMuc,
                $giaBan,
                $giaKhuyenMai,
                $soLuongTon,
                $duongDanAnh,
                $moTa
            ]);

            traVeJSON(
                true,
                'Đã thêm sản phẩm thành công.',
                [
                    'id' => (int)$pdo->lastInsertId(),
                    'hinh_anh' => $duongDanAnh
                ]
            );
        }

        /*
         * CẬP NHẬT SẢN PHẨM
         */

        // Kiểm tra sản phẩm có tồn tại không
        $kiemTraSanPham = $pdo->prepare("
            SELECT id, hinh_anh
            FROM san_pham
            WHERE id = ?
            LIMIT 1
        ");

        $kiemTraSanPham->execute([$id]);

        $sanPhamCu = $kiemTraSanPham->fetch(PDO::FETCH_ASSOC);

        if (!$sanPhamCu) {
            traVeJSON(
                false,
                'Sản phẩm cần cập nhật không tồn tại.',
                [],
                404
            );
        }

        // Không chọn ảnh mới thì giữ ảnh cũ
        $duongDanAnh = $anhMoi ?? ($sanPhamCu['hinh_anh'] ?? '');

        $sql = "
            UPDATE san_pham
            SET
                ma_san_pham = ?,
                ten_san_pham = ?,
                danh_muc = ?,
                gia_ban = ?,
                gia_khuyen_mai = ?,
                so_luong_ton = ?,
                hinh_anh = ?,
                mo_ta = ?
            WHERE id = ?
        ";

        $truyVan = $pdo->prepare($sql);

        $truyVan->execute([
            $maSanPham,
            $tenSanPham,
            $danhMuc,
            $giaBan,
            $giaKhuyenMai,
            $soLuongTon,
            $duongDanAnh,
            $moTa,
            $id
        ]);

        traVeJSON(
            true,
            'Đã cập nhật sản phẩm thành công.',
            [
                'id' => $id,
                'hinh_anh' => $duongDanAnh
            ]
        );

    } catch (PDOException $loi) {
        error_log($loi->getMessage());

        traVeJSON(
            false,
            'Lỗi cơ sở dữ liệu khi lưu sản phẩm.',
            [],
            500
        );
    } catch (Throwable $loi) {
        error_log($loi->getMessage());

        traVeJSON(
            false,
            'Đã xảy ra lỗi khi xử lý sản phẩm.',
            [],
            500
        );
    }
}

/*
|--------------------------------------------------------------------------
| DELETE - XÓA SẢN PHẨM
|--------------------------------------------------------------------------
*/

if ($phuongThuc === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);

    if ($id <= 0) {
        traVeJSON(false, 'Mã sản phẩm không hợp lệ.', [], 422);
    }

    try {
        $kiemTra = $pdo->prepare("
            SELECT id
            FROM san_pham
            WHERE id = ?
            LIMIT 1
        ");

        $kiemTra->execute([$id]);

        if (!$kiemTra->fetch()) {
            traVeJSON(
                false,
                'Sản phẩm không tồn tại.',
                [],
                404
            );
        }

        $xoa = $pdo->prepare("
            DELETE FROM san_pham
            WHERE id = ?
        ");

        $xoa->execute([$id]);

        traVeJSON(true, 'Đã xóa sản phẩm thành công.');

    } catch (PDOException $loi) {
        error_log($loi->getMessage());

        traVeJSON(
            false,
            'Không thể xóa sản phẩm. Có thể sản phẩm đang được sử dụng trong đơn hàng hoặc đánh giá.',
            [],
            409
        );
    }
}

/*
|--------------------------------------------------------------------------
| PHƯƠNG THỨC KHÔNG HỢP LỆ
|--------------------------------------------------------------------------
*/

header('Allow: GET, POST, DELETE');

traVeJSON(
    false,
    'Phương thức gửi yêu cầu không được hỗ trợ.',
    [],
    405
);