<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__.'/../config/db.php';
function tra(array $d,int $s=200):void {
    http_response_code($s);
    echo json_encode($d,JSON_UNESCAPED_UNICODE);
    exit;
}
$in=json_decode(file_get_contents('php://input'),true)??$_POST;
$login=trim((string)($in['ten_dang_nhap']??$in['email']??''));
$password=(string)($in['mat_khau']??'');
if($login===''||$password==='')tra(['thanh_cong'=>false,'thong_bao'=>'Vui lòng nhập tên đăng nhập/email và mật khẩu.'],422);
$q=$pdo->prepare('SELECT id,ho_ten,ten_dang_nhap,email,mat_khau,vai_tro,trang_thai FROM nguoi_dung WHERE ten_dang_nhap=? OR email=? LIMIT 1');
$q->execute([$login,$login]);
$u=$q->fetch();
$valid=false;
if($u) {
    $hash=(string)$u['mat_khau'];
    $valid=password_verify($password,$hash);
}
if(!$valid)tra(['thanh_cong'=>false,'thong_bao'=>'Tên đăng nhập hoặc mật khẩu không chính xác.'],401);
if(($u['trang_thai']??'hoat_dong')!=='hoat_dong')tra(['thanh_cong'=>false,'thong_bao'=>'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'],403);
session_regenerate_id(true);
$_SESSION['nguoi_dung_id']=(int)$u['id'];
$_SESSION['vai_tro']=$u['vai_tro'];
$_SESSION['ho_ten']=$u['ho_ten'];
tra(['thanh_cong'=>true,'success'=>true,'thong_bao'=>'Đăng nhập thành công.','nguoi_dung'=>['id'=>(int)$u['id'],'ho_ten'=>$u['ho_ten'],'ten_dang_nhap'=>$u['ten_dang_nhap'],'email'=>$u['email'],'vai_tro'=>$u['vai_tro']]]);
