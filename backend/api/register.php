<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__ . '/../config/db.php';
function tra(array $d,int $s=200):void {
    http_response_code($s);
    echo json_encode($d,JSON_UNESCAPED_UNICODE);
    exit;
}
$raw=file_get_contents('php://input');
$in=json_decode($raw,true);
if(!is_array($in))$in=$_POST;
header('Cache-Control: no-store');
$name=trim((string)($in['ho_ten']??''));
$email=strtolower(trim((string)($in['email']??'')));
$phone=trim((string)($in['so_dien_thoai']??''));
$username=trim((string)($in['ten_dang_nhap']??''));
$password=(string)($in['mat_khau']??'');
$confirm=(string)($in['xac_nhan']??'');
if($name===''||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($username)<4||strlen($password)<8)tra(['thanh_cong'=>false,'thong_bao'=>'Vui lòng nhập đầy đủ thông tin. Tên đăng nhập tối thiểu 4 ký tự, mật khẩu tối thiểu 8 ký tự.'],422);
if($confirm===''||!hash_equals($password,$confirm))tra(['thanh_cong'=>false,'thong_bao'=>'Mật khẩu xác nhận không khớp.'],422);
try {
    $col=$pdo->query("SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='nguoi_dung' AND COLUMN_NAME='mat_khau'")->fetchColumn();
    if((int)$col<60)tra(['thanh_cong'=>false,'thong_bao'=>'Cột mat_khau trong database quá ngắn. Hãy chạy SQL nâng cấp kèm theo.'],500);
    $q=$pdo->prepare("INSERT INTO nguoi_dung(ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES(?,?,?,?,?,'khach_hang','hoat_dong')");
    $q->execute([$name,$email,$phone,$username,password_hash($password,PASSWORD_DEFAULT)]);
    $id=(int)$pdo->lastInsertId();
    session_regenerate_id(true);
    $_SESSION['nguoi_dung_id']=$id;
    $_SESSION['vai_tro']='khach_hang';
    $_SESSION['ho_ten']=$name;
    tra(['thanh_cong'=>true,'thong_bao'=>'Đăng ký thành công. Bạn đã được đăng nhập.','nguoi_dung'=>['id'=>$id,'ho_ten'=>$name,'vai_tro'=>'khach_hang']]);
} catch(PDOException $e) {
    if($e->getCode()==='23000')tra(['thanh_cong'=>false,'thong_bao'=>'Email hoặc tên đăng nhập đã được sử dụng.'],409);
    tra(['thanh_cong'=>false,'thong_bao'=>'Không thể tạo tài khoản. Kiểm tra cấu trúc bảng nguoi_dung và chạy SQL nâng cấp.'],500);
}
