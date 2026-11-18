<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| API TƯƠNG THÍCH THÊM SẢN PHẨM CŨ
|--------------------------------------------------------------------------
| Chuyển yêu cầu thêm sản phẩm sang products.php
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(405);
    header('Allow: POST');

    echo json_encode([
        'thanh_cong' => false,
        'thong_bao' => 'API này chỉ chấp nhận phương thức POST.'
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/*
 * Hỗ trợ cả dữ liệu JSON cũ và FormData có ảnh.
 * Nếu là FormData thì PHP đã tự điền $_POST và $_FILES.
 */
$noiDung = file_get_contents('php://input');

if (
    empty($_POST) &&
    !empty($noiDung) &&
    stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false
) {
    $duLieu = json_decode($noiDung, true);

    if (is_array($duLieu)) {
        $_POST = $duLieu;
    }
}

/*
 * Sử dụng chung toàn bộ chức năng kiểm tra,
 * lưu ảnh và thêm sản phẩm của products.php.
 */
require __DIR__ . '/products.php';