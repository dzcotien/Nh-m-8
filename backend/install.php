<?php
declare(strict_types=1);
// Chạy: C:\xampp\php\php.exe backend\install.php
// Với CSDL cũ: C:\xampp\php\php.exe backend\install.php --upgrade
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('CLI only'); }
if (!extension_loaded('pdo_mysql')) { fwrite(STDERR,"PHP chưa bật extension pdo_mysql.\n"); exit(1); }
$host=getenv('MAYSTORE_DB_HOST') ?: '127.0.0.1';
$user=getenv('MAYSTORE_DB_USER') ?: 'root';
$pass=getenv('MAYSTORE_DB_PASS') ?: '';
$db=getenv('MAYSTORE_DB_NAME') ?: 'maystore';
if(!preg_match('/^[A-Za-z0-9_]+$/',$db)) exit("Tên database không hợp lệ\n");
$upgrade=in_array('--upgrade',$argv,true);
try {
 $pdo=new PDO("mysql:host=$host;charset=utf8mb4",$user,$pass,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
 $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
 $pdo->exec("USE `$db`");
 $exists=(int)$pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='nguoi_dung'")->fetchColumn();
 if($exists && !$upgrade) throw new RuntimeException('Database đã có bảng. Để giữ dữ liệu, chạy lại với --upgrade. Không nhập lại SQL mẫu.');
 if($upgrade) {
  if(!$exists) throw new RuntimeException('Database chưa có bảng. Hãy chạy lệnh cài mới (không có --upgrade).');
  $required=['nguoi_dung','san_pham','don_hang','chi_tiet_don_hang','dia_chi_giao_hang','danh_muc_san_pham','khuyen_mai','danh_gia'];
  $check=$pdo->prepare('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?');
  foreach($required as $table){$check->execute([$table]);if(!(int)$check->fetchColumn())throw new RuntimeException("Thiếu bảng $table. Cần đối chiếu schema trước khi nâng cấp.");}
  $pdo->exec('ALTER TABLE nguoi_dung MODIFY COLUMN mat_khau VARCHAR(255) NOT NULL');
  echo "ĐÃ NÂNG CẤP: không xóa dữ liệu, không thay mật khẩu cũ.\n";
 } else {
  $sql=file_get_contents(__DIR__.'/database/web_ban_hang.sql');
  if($sql===false)throw new RuntimeException('Không đọc được file SQL');
  // Bỏ CREATE DATABASE/USE trong SQL để không vô tình nhập sai database cấu hình.
  $sql=preg_replace('/^\s*--[^\r\n]*$/m','',$sql);
  $sql=preg_replace('/^\s*CREATE DATABASE[^;]*;\s*/mi','',$sql);
  $sql=preg_replace('/^\s*USE\s+[`a-zA-Z0-9_]+\s*;\s*/mi','',$sql);
  foreach(preg_split('/;\s*(?:\r?\n|$)/',$sql) as $stmt){$stmt=trim($stmt);if($stmt!=='')$pdo->exec($stmt);}
  echo "ĐÃ CÀI MỚI: bảng và dữ liệu mẫu được nạp vào database $db.\n";
 }
 foreach(['nguoi_dung','san_pham','don_hang','chi_tiet_don_hang'] as $t){echo "$t: ".$pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn()."\n";}
 echo "Kiểm tra tiếp: php backend/check.php\n";
} catch(Throwable $e){fwrite(STDERR,"LỖI CÀI ĐẶT: ".$e->getMessage()."\n");exit(1);}
