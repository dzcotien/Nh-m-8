<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__.'/../config/db.php';
require_once __DIR__.'/auth_guard.php';
requireActiveAccount($pdo,true);
function done(array $d,int $c=200):void {
    http_response_code($c);
    echo json_encode($d,JSON_UNESCAPED_UNICODE);
    exit;
}
if(($_SESSION['vai_tro']??'')!=='quan_tri')done(['thanh_cong'=>false,'thong_bao'=>'Bạn cần đăng nhập bằng tài khoản quản trị.'],403);
$method=$_SERVER['REQUEST_METHOD'];
$in=json_decode(file_get_contents('php://input'),true)??$_POST;
try {
    if($method==='GET') {
        $type=$_GET['type']??'customers';
        if($type==='customers') {
            $data=$pdo->query("SELECT id,ho_ten,email,ten_dang_nhap,so_dien_thoai,vai_tro,trang_thai,ngay_tao FROM nguoi_dung ORDER BY id DESC")->fetchAll();
        } elseif($type==='inventory') {
            $data=$pdo->query('SELECT id,ma_san_pham,ten_san_pham,so_luong_ton FROM san_pham ORDER BY so_luong_ton ASC')->fetchAll();
        } elseif($type==='promotions') {
            $data=$pdo->query('SELECT * FROM khuyen_mai ORDER BY id DESC')->fetchAll();
        } elseif($type==='categories') {
            $data=$pdo->query('SELECT c.id,c.ten_danh_muc,c.mo_ta,COUNT(s.id) so_san_pham FROM danh_muc_san_pham c LEFT JOIN san_pham s ON s.danh_muc=c.ten_danh_muc GROUP BY c.id ORDER BY c.ten_danh_muc')->fetchAll();
        } else done(['thanh_cong'=>false,'thong_bao'=>'Danh mục dữ liệu không hợp lệ.'],422);
        done(['thanh_cong'=>true,'data'=>$data]);
    }
    if($method==='POST') {
        $action=$in['action']??'';
        if($action==='stock') {
            $id=(int)($in['id']??0);
            $qty=max(0,(int)($in['so_luong_ton']??-1));
            if(!$id||$qty<0)done(['thanh_cong'=>false,'thong_bao'=>'Số lượng không hợp lệ.'],422);
            $q=$pdo->prepare('UPDATE san_pham SET so_luong_ton=? WHERE id=?');
            $q->execute([$qty,$id]);
            done(['thanh_cong'=>true,'thong_bao'=>'Đã cập nhật tồn kho.']);
        }
        if($action==='reset_customer_password') {
            $id=filter_var($in['id']??null,FILTER_VALIDATE_INT);
            $password=(string)($in['mat_khau_moi']??'');
            if(!$id || strlen($password)<8 || strlen($password)>72) done(['thanh_cong'=>false,'thong_bao'=>'Mật khẩu mới phải từ 8 đến 72 ký tự.'],422);
            $q=$pdo->prepare("SELECT id FROM nguoi_dung WHERE id=? AND vai_tro='khach_hang'");
            $q->execute([$id]);
            if(!$q->fetchColumn())done(['thanh_cong'=>false,'thong_bao'=>'Không tìm thấy tài khoản khách hàng.'],404);
            $hash=password_hash($password,PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE nguoi_dung SET mat_khau=? WHERE id=? AND vai_tro='khach_hang'")->execute([$hash,$id]);
            done(['thanh_cong'=>true,'thong_bao'=>'Đã đặt lại mật khẩu khách hàng.']);
        }
        if($action==='customer_status') {
            $id=(int)($in['id']??0);
            $status=$in['trang_thai']??'';
            if(!$id||!in_array($status,['hoat_dong','khoa'],true))done(['thanh_cong'=>false,'thong_bao'=>'Thông tin tài khoản không hợp lệ.'],422);
            $q=$pdo->prepare("UPDATE nguoi_dung SET trang_thai=? WHERE id=? AND vai_tro='khach_hang'");
            $q->execute([$status,$id]);
            done(['thanh_cong'=>true,'thong_bao'=>'Đã cập nhật trạng thái tài khoản.']);
        }
        if($action==='category') {
            $name=trim((string)($in['ten_danh_muc']??''));
            $desc=trim((string)($in['mo_ta']??''));
            if($name==='')done(['thanh_cong'=>false,'thong_bao'=>'Tên danh mục không được để trống.'],422);
            $q=$pdo->prepare('INSERT INTO danh_muc_san_pham(ten_danh_muc,mo_ta) VALUES(?,?)');
            $q->execute([$name,$desc]);
            done(['thanh_cong'=>true,'thong_bao'=>'Đã thêm danh mục.']);
        }
        if($action==='category_delete') {
            $id=(int)($in['id']??0);
            $q=$pdo->prepare('SELECT ten_danh_muc FROM danh_muc_san_pham WHERE id=?');
            $q->execute([$id]);
            $c=$q->fetch();
            if(!$c)done(['thanh_cong'=>false,'thong_bao'=>'Không tìm thấy danh mục.'],404);
            $check=$pdo->prepare('SELECT COUNT(*) FROM san_pham WHERE danh_muc=?');
            $check->execute([$c['ten_danh_muc']]);
            if((int)$check->fetchColumn()>0)done(['thanh_cong'=>false,'thong_bao'=>'Danh mục đang có sản phẩm, không thể xóa.'],422);
            $pdo->prepare('DELETE FROM danh_muc_san_pham WHERE id=?')->execute([$id]);
            done(['thanh_cong'=>true,'thong_bao'=>'Đã xóa danh mục.']);
        }
        if($action==='promotion_delete') {
            $id=(int)($in['id']??0);
            $q=$pdo->prepare('DELETE FROM khuyen_mai WHERE id=?');
            $q->execute([$id]);
            done(['thanh_cong'=>true,'thong_bao'=>'Đã xóa mã khuyến mãi.']);
        }
        if($action==='promotion') {
            $code=strtoupper(trim((string)($in['ma_giam_gia']??'')));
            $percent=(int)($in['phan_tram_giam']??0);
            $expiry=trim((string)($in['ngay_het_han']??''));
            if(!preg_match('/^[A-Z0-9_-]{3,30}$/',$code)||$percent<1||$percent>90)done(['thanh_cong'=>false,'thong_bao'=>'Mã giảm giá hoặc phần trăm không hợp lệ.'],422);
            $q=$pdo->prepare('INSERT INTO khuyen_mai(ma_giam_gia,phan_tram_giam,ngay_het_han) VALUES(?,?,?)');
            $q->execute([$code,$percent,$expiry?:null]);
            done(['thanh_cong'=>true,'thong_bao'=>'Đã tạo mã khuyến mãi.']);
        }
        done(['thanh_cong'=>false,'thong_bao'=>'Thao tác không hợp lệ.'],422);
    }
    done(['thanh_cong'=>false,'thong_bao'=>'Phương thức không được hỗ trợ.'],405);
}catch(PDOException $e) {
    done(['thanh_cong'=>false,'thong_bao'=>$e->getCode()==='23000'?'Dữ liệu đã tồn tại hoặc đang được sử dụng.':'Không thể cập nhật dữ liệu.'],422);
}catch(Throwable $e) {
    done(['thanh_cong'=>false,'thong_bao'=>'Có lỗi khi xử lý dữ liệu.'],500);
}
