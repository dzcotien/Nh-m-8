<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$id=(int)($_SESSION['nguoi_dung_id']??0);
if(!$id) {
    echo json_encode(['thanh_cong'=>true,'nguoi_dung'=>null],JSON_UNESCAPED_UNICODE);
    exit;
}
$q=$pdo->prepare('SELECT id,ho_ten,ten_dang_nhap,email,vai_tro,trang_thai FROM nguoi_dung WHERE id=?');
$q->execute([$id]);
$u=$q->fetch();
if(!$u||$u['trang_thai']!=='hoat_dong') {
    $_SESSION=[];
    session_destroy();
    http_response_code(401);
    echo json_encode(['thanh_cong'=>false,'nguoi_dung'=>null,'thong_bao'=>'Phiên đăng nhập không còn hợp lệ.'],JSON_UNESCAPED_UNICODE);
    exit;
}
$_SESSION['vai_tro']=$u['vai_tro'];
echo json_encode(['thanh_cong'=>true,'nguoi_dung'=>$u],JSON_UNESCAPED_UNICODE);
