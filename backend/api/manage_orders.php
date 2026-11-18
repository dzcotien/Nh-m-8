<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/auth_guard.php';
requireActiveAccount($pdo,true);
function tra(array $data, int $code=200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
if (($_SESSION['vai_tro'] ?? '') !== 'quan_tri') tra(['thanh_cong'=>false,'thong_bao'=>'Bạn không có quyền quản trị.'],403);
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $q=$pdo->query("SELECT d.id,d.ma_don_hang,d.tong_tien,d.trang_thai,d.ngay_tao,n.ho_ten,n.email,n.so_dien_thoai FROM don_hang d JOIN nguoi_dung n ON n.id=d.id_nguoi_dung ORDER BY d.id DESC");
        tra(['thanh_cong'=>true,'data'=>$q->fetchAll()]);
    }
    if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || $_SERVER['REQUEST_METHOD'] === 'POST') {
        $in=json_decode(file_get_contents('php://input'),true) ?? $_POST;
        $id=(int)($in['id']??0);
        $status=(string)($in['trang_thai']??'');
        $allowed=['Đang xử lý','Đã xác nhận','Đang giao','Hoàn thành','Đã hủy'];
        if ($id<1 || !in_array($status,$allowed,true)) tra(['thanh_cong'=>false,'thong_bao'=>'Thông tin cập nhật không hợp lệ.'],422);
        $pdo->beginTransaction();
        $lock=$pdo->prepare('SELECT id,trang_thai FROM don_hang WHERE id=? FOR UPDATE');
        $lock->execute([$id]);
        $order=$lock->fetch();
        if(!$order) {
            $pdo->rollBack();
            tra(['thanh_cong'=>false,'thong_bao'=>'Không tìm thấy đơn hàng.'],404);
        }
        if($order['trang_thai']==='Đã hủy' && $status!=='Đã hủy') {
            $pdo->rollBack();
            tra(['thanh_cong'=>false,'thong_bao'=>'Đơn đã hủy không thể chuyển sang trạng thái khác.'],422);
        }
        if($order['trang_thai']!=='Đã hủy' && $status==='Đã hủy') {
            $items=$pdo->prepare('SELECT id_san_pham,so_luong FROM chi_tiet_don_hang WHERE id_don_hang=?');
            $items->execute([$id]);
            $restore=$pdo->prepare('UPDATE san_pham SET so_luong_ton=so_luong_ton+? WHERE id=?');
            foreach($items->fetchAll() as $item) {
                $restore->execute([(int)$item['so_luong'],(int)$item['id_san_pham']]);
            }
        }
        $q=$pdo->prepare('UPDATE don_hang SET trang_thai=? WHERE id=?');
        $q->execute([$status,$id]);
        $pdo->commit();
        tra(['thanh_cong'=>true,'thong_bao'=>'Đã cập nhật trạng thái đơn hàng.']);
    }
    tra(['thanh_cong'=>false,'thong_bao'=>'Phương thức không được hỗ trợ.'],405);
} catch(Throwable $e) {
    if($pdo->inTransaction())$pdo->rollBack();
    tra(['thanh_cong'=>false,'thong_bao'=>'Không thể xử lý đơn hàng.'],500);
}
