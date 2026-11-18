<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__.'/../config/db.php';
$q=trim((string)($_GET['q']??''));
$sql='SELECT s.id,s.ma_san_pham,s.ten_san_pham,s.danh_muc,s.gia_ban,s.gia_khuyen_mai,s.so_luong_ton,s.hinh_anh,s.mo_ta,COALESCE(ROUND(AVG(d.so_sao),1),0) diem_danh_gia,COUNT(d.id) so_danh_gia FROM san_pham s LEFT JOIN danh_gia d ON d.id_san_pham=s.id';
$params=[];
if($q!=='') {
    $sql.=' WHERE s.ten_san_pham LIKE ? OR s.ma_san_pham LIKE ? OR s.danh_muc LIKE ?';
    $like="%{$q}%";$params=[$like,$like,$like];}$sql.=' GROUP BY s.id ORDER BY s.id DESC';$st=$pdo->prepare($sql);$st->execute($params);$data=$st->fetchAll();echo json_encode(['success'=>true,'thanh_cong'=>true,'data'=>$data],JSON_UNESCAPED_UNICODE);
