<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
$id=(int)($_GET['id']??0);
$q=$pdo->prepare('SELECT s.*,COALESCE(ROUND(AVG(d.so_sao),1),0) diem_danh_gia,COUNT(d.id) so_danh_gia FROM san_pham s LEFT JOIN danh_gia d ON d.id_san_pham=s.id WHERE s.id=? GROUP BY s.id');
$q->execute([$id]);
$p=$q->fetch();
if(!$p) {
    $code=$_GET['ma']??'';
    $q=$pdo->prepare('SELECT s.*,COALESCE(ROUND(AVG(d.so_sao),1),0) diem_danh_gia,COUNT(d.id) so_danh_gia FROM san_pham s LEFT JOIN danh_gia d ON d.id_san_pham=s.id WHERE s.ma_san_pham=? GROUP BY s.id');
    $q->execute([$code]);
    $p=$q->fetch();
}
if(!$p) {
    http_response_code(404);
    echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Không tìm thấy sản phẩm.'],JSON_UNESCAPED_UNICODE);
    exit;
}
$r=$pdo->prepare('SELECT d.so_sao,d.noi_dung,d.ngay_tao,n.ho_ten FROM danh_gia d JOIN nguoi_dung n ON n.id=d.id_nguoi_dung WHERE d.id_san_pham=? ORDER BY d.ngay_tao DESC');
$r->execute([$p['id']]);
echo json_encode(['thanh_cong'=>true,'san_pham'=>$p,'danh_gia'=>$r->fetchAll()],JSON_UNESCAPED_UNICODE);
