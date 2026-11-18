<?php
function requireActiveAccount(PDO $pdo, bool $admin=false): array {
    $id=(int)($_SESSION['nguoi_dung_id']??0);
    if(!$id) {
        http_response_code(401);
        echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Vui lòng đăng nhập.'],JSON_UNESCAPED_UNICODE);
        exit;
    }
    $q=$pdo->prepare('SELECT id,vai_tro,trang_thai FROM nguoi_dung WHERE id=?');
    $q->execute([$id]);
    $u=$q->fetch();
    if(!$u||$u['trang_thai']!=='hoat_dong'||($admin&&$u['vai_tro']!=='quan_tri')) {
        http_response_code(403);
        echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Tài khoản không có quyền truy cập hoặc đã bị khóa.'],JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $u;
}
