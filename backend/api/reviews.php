<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
require_once __DIR__.'/auth_guard.php';
require_once __DIR__.'/auth_guard.php';
function done($d,$c=200) {
    http_response_code($c);
    echo json_encode($d,JSON_UNESCAPED_UNICODE);
    exit;
}
if($_SERVER['REQUEST_METHOD']==='GET') {
    $id=(int)($_GET['id_san_pham']??0);
    $q=$pdo->prepare('SELECT d.so_sao,d.noi_dung,d.ngay_tao,n.ho_ten FROM danh_gia d JOIN nguoi_dung n ON n.id=d.id_nguoi_dung WHERE d.id_san_pham=? ORDER BY d.ngay_tao DESC');
    $q->execute([$id]);
    done(['thanh_cong'=>true,'data'=>$q->fetchAll()]);
}
if($_SERVER['REQUEST_METHOD']==='POST') {
    requireActiveAccount($pdo,false);
    if(empty($_SESSION['nguoi_dung_id']))done(['thanh_cong'=>false,'thong_bao'=>'Vui lòng đăng nhập để đánh giá.'],401);
    $in=json_decode(file_get_contents('php://input'),true)??[];
    $pid=(int)($in['id_san_pham']??0);
    $stars=(int)($in['so_sao']??0);
    $content=trim($in['noi_dung']??'');
    if($stars<1||$stars>5)done(['thanh_cong'=>false,'thong_bao'=>'Số sao phải từ 1 đến 5.'],422);
    $check=$pdo->prepare('SELECT id FROM san_pham WHERE id=?');
    $check->execute([$pid]);
    if($pid<1||!$check->fetchColumn())done(['thanh_cong'=>false,'thong_bao'=>'Sản phẩm không hợp lệ.'],422);
    $q=$pdo->prepare('INSERT INTO danh_gia(id_san_pham,id_nguoi_dung,so_sao,noi_dung) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE so_sao=VALUES(so_sao),noi_dung=VALUES(noi_dung),ngay_tao=CURRENT_TIMESTAMP');
    try {
        $q->execute([$pid,$_SESSION['nguoi_dung_id'],$stars,$content]);
    }catch(Throwable $e) {
        done(['thanh_cong'=>false,'thong_bao'=>'Không lưu được đánh giá.'],422);
    }
    done(['thanh_cong'=>true,'thong_bao'=>'Cảm ơn bạn đã đánh giá sản phẩm.']);
}
done(['thanh_cong'=>false,'thong_bao'=>'Phương thức không hợp lệ.'],405);
