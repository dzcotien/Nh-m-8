<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
require_once __DIR__.'/auth_guard.php';
$u=requireActiveAccount($pdo);
$id=(int)$u['id'];
if($_SERVER['REQUEST_METHOD']==='GET') {
    $q=$pdo->prepare('SELECT ho_ten,email,so_dien_thoai,ngay_sinh,gioi_tinh FROM nguoi_dung WHERE id=?');
    $q->execute([$id]);
    echo json_encode(['thanh_cong'=>true,'data'=>$q->fetch()],JSON_UNESCAPED_UNICODE);
    exit;
}
if($_SERVER['REQUEST_METHOD']!=='POST') {
    http_response_code(405);
    exit;
}
$in=json_decode(file_get_contents('php://input'),true)??[];
$name=trim((string)($in['ho_ten']??''));
$email=trim((string)($in['email']??''));
$phone=trim((string)($in['so_dien_thoai']??''));
$birth=trim((string)($in['ngay_sinh']??''));
$gender=trim((string)($in['gioi_tinh']??''));
if(!$name||!filter_var($email,FILTER_VALIDATE_EMAIL)||($birth&&!preg_match('/^\d{4}-\d{2}-\d{2}$/',$birth))||!in_array($gender,['','Nam','Nữ','Khác'],true)) {
    http_response_code(422);
    echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Thông tin cá nhân không hợp lệ.'],JSON_UNESCAPED_UNICODE);
    exit;
}
try {
    $q=$pdo->prepare('UPDATE nguoi_dung SET ho_ten=?,email=?,so_dien_thoai=?,ngay_sinh=?,gioi_tinh=? WHERE id=?');
    $q->execute([$name,$email,$phone,$birth?:null,$gender?:null,$id]);
    $_SESSION['ho_ten']=$name;
    echo json_encode(['thanh_cong'=>true,'thong_bao'=>'Đã cập nhật thông tin.'],JSON_UNESCAPED_UNICODE);
}catch(PDOException $e) {
    http_response_code(409);
    echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Email đã được sử dụng hoặc dữ liệu không hợp lệ.'],JSON_UNESCAPED_UNICODE);
}
