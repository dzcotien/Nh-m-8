<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
require_once __DIR__.'/auth_guard.php';
requireActiveAccount($pdo,false);
function reply($d,$c=200) {
    http_response_code($c);
    echo json_encode($d,JSON_UNESCAPED_UNICODE);
    exit;
}
if(empty($_SESSION['nguoi_dung_id']))reply(['thanh_cong'=>false,'thong_bao'=>'Vui lòng đăng nhập trước khi đặt hàng.'],401);
$in=json_decode(file_get_contents('php://input'),true)??[];
$cart=$in['cart']??[];
if(!is_array($cart))reply(['thanh_cong'=>false,'thong_bao'=>'Giỏ hàng không hợp lệ.'],422);
$addressId=(int)($in['id_dia_chi']??0);
$promo=strtoupper(trim((string)($in['ma_giam_gia']??'')));
if(!$cart)reply(['thanh_cong'=>false,'thong_bao'=>'Giỏ hàng đang trống.'],422);
$uid=(int)$_SESSION['nguoi_dung_id'];
$a=$pdo->prepare('SELECT id FROM dia_chi_giao_hang WHERE id=? AND id_nguoi_dung=?');
$a->execute([$addressId,$uid]);
if(!$a->fetch()) {
    $a=$pdo->prepare('SELECT id FROM dia_chi_giao_hang WHERE id_nguoi_dung=? ORDER BY mac_dinh DESC,id DESC LIMIT 1');
    $a->execute([$uid]);
    $addressId=(int)$a->fetchColumn();
}
if(!$addressId)reply(['thanh_cong'=>false,'thong_bao'=>'Bạn cần cập nhật địa chỉ giao hàng trong trang tài khoản trước khi đặt hàng.'],422);
try {
    $pdo->beginTransaction();
    $total=0;
    $lines=[];
    $get=$pdo->prepare('SELECT id,ten_san_pham,gia_ban,gia_khuyen_mai,so_luong_ton FROM san_pham WHERE id=? FOR UPDATE');
    foreach($cart as $id=>$qty) {
        $id=(int)$id;
        $qty=(int)$qty;
        if($id<1||$qty<1)continue;
        $get->execute([$id]);
        $p=$get->fetch();
        if(!$p||$qty>(int)$p['so_luong_ton'])throw new Exception('Sản phẩm '.$id.' không đủ số lượng trong kho.');
        $price=(float)($p['gia_khuyen_mai']?:$p['gia_ban']);
        $total+=$price*$qty;
        $lines[]=[$p,$qty,$price];
    }
    if(!$lines)throw new Exception('Không có sản phẩm hợp lệ trong giỏ hàng.');
    $discount=0;
    if($promo!=='') {
        $pr=$pdo->prepare('SELECT phan_tram_giam FROM khuyen_mai WHERE ma_giam_gia=? AND (ngay_het_han IS NULL OR ngay_het_han>=CURDATE())');
        $pr->execute([$promo]);
        $percent=$pr->fetchColumn();
        if($percent===false)throw new Exception('Mã khuyến mãi không hợp lệ hoặc đã hết hạn.');
        $discount=round($total*(int)$percent/100,2);
        $total-=$discount;
    }
    $code='DH'.date('YmdHis').random_int(10,99);
    $o=$pdo->prepare('INSERT INTO don_hang(ma_don_hang,id_nguoi_dung,id_dia_chi,tong_tien,trang_thai) VALUES(?,?,?,?,?)');
    $o->execute([$code,$uid,$addressId,$total,'Đang xử lý']);
    $oid=(int)$pdo->lastInsertId();
    $detail=$pdo->prepare('INSERT INTO chi_tiet_don_hang(id_don_hang,id_san_pham,so_luong,don_gia) VALUES(?,?,?,?)');
    $stock=$pdo->prepare('UPDATE san_pham SET so_luong_ton=so_luong_ton-? WHERE id=?');
    foreach($lines as [$p,$qty,$price]) {
        $detail->execute([$oid,$p['id'],$qty,$price]);
        $stock->execute([$qty,$p['id']]);
    }
    $pdo->commit();
    reply(['thanh_cong'=>true,'thong_bao'=>'Đặt hàng thành công.','ma_don_hang'=>$code,'tong_tien'=>$total,'giam_gia'=>$discount]);
}catch(Throwable $e) {
    if($pdo->inTransaction())$pdo->rollBack();
    reply(['thanh_cong'=>false,'thong_bao'=>$e->getMessage()],422);
}
