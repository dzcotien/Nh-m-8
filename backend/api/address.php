<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
require_once __DIR__.'/auth_guard.php';
requireActiveAccount($pdo,false);
function result($d,$c=200) {
    http_response_code($c);
    echo json_encode($d,JSON_UNESCAPED_UNICODE);
    exit;
}
if(empty($_SESSION['nguoi_dung_id']))result(['thanh_cong'=>false,'thong_bao'=>'Vui lòng đăng nhập để quản lý địa chỉ.'],401);
$uid=(int)$_SESSION['nguoi_dung_id'];
if($_SERVER['REQUEST_METHOD']==='GET') {
    $q=$pdo->prepare('SELECT * FROM dia_chi_giao_hang WHERE id_nguoi_dung=? ORDER BY mac_dinh DESC,id DESC');
    $q->execute([$uid]);
    result(['thanh_cong'=>true,'data'=>$q->fetchAll()]);
}
$in=json_decode(file_get_contents('php://input'),true)??$_POST;
$id=(int)($in['id']??0);
$name=trim($in['nguoi_nhan']??'');
$phone=trim($in['so_dien_thoai']??'');
$address=trim($in['dia_chi_chi_tiet']??'');
$ward=trim($in['phuong_xa']??'');
$district=trim($in['quan_huyen']??'');
$city=trim($in['tinh_thanh']??'');
if(!$name||!$phone||!$address||!$district||!$city)result(['thanh_cong'=>false,'thong_bao'=>'Vui lòng nhập đầy đủ địa chỉ giao hàng.'],422);
try {
    $pdo->beginTransaction();
    if(!empty($in['mac_dinh'])) {
        $q=$pdo->prepare('UPDATE dia_chi_giao_hang SET mac_dinh=0 WHERE id_nguoi_dung=?');
        $q->execute([$uid]);
    }
    if($id) {
        $q=$pdo->prepare('UPDATE dia_chi_giao_hang SET nguoi_nhan=?,so_dien_thoai=?,dia_chi_chi_tiet=?,phuong_xa=?,quan_huyen=?,tinh_thanh=?,mac_dinh=? WHERE id=? AND id_nguoi_dung=?');
        $q->execute([$name,$phone,$address,$ward,$district,$city,(int)!empty($in['mac_dinh']),$id,$uid]);
    }else {
        $q=$pdo->prepare('INSERT INTO dia_chi_giao_hang(id_nguoi_dung,nguoi_nhan,so_dien_thoai,dia_chi_chi_tiet,phuong_xa,quan_huyen,tinh_thanh,mac_dinh) VALUES(?,?,?,?,?,?,?,?)');
        $q->execute([$uid,$name,$phone,$address,$ward,$district,$city,(int)!empty($in['mac_dinh'])]);
    }
    $pdo->commit();
    result(['thanh_cong'=>true,'thong_bao'=>'Đã lưu địa chỉ giao hàng.']);
}catch(Throwable $e) {
    if($pdo->inTransaction())$pdo->rollBack();
    result(['thanh_cong'=>false,'thong_bao'=>'Không lưu được địa chỉ.'],422);
}
