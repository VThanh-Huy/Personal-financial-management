I. Tạo MySQL Server trên cmd:
1. CREATE DATABASE IF NOT EXISTS quan_ly_ca_nhan
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE quan_ly_ca_nhan;

SELECT
    DATABASE() AS database_name,
    VERSION() AS mysql_version,
    @@port AS mysql_port;

2. tạo tài khoản
  CREATE USER 'qlcn_app'@'localhost'
  IDENTIFIED BY 'MAT_KHAU';
3. Cấp quyền cho tài khoản:
  GRANT SELECT, INSERT, UPDATE, DELETE
  ON quan_ly_ca_nhan.*
  TO 'qlcn_app'@'localhost';

4. Thoát phiên và kiểm tra:
- exit;
- "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -h localhost -P 3306 -u qlcn_app -p quan_ly_ca_nhan
- kết quả cần có: 
mysql> SELECT CURRENT_USER(), DATABASE();
+--------------------+-----------------+
| CURRENT_USER()     | DATABASE()      |
+--------------------+-----------------+
| qlcn_app@localhost | quan_ly_ca_nhan |
+--------------------+-----------------+
