Website quản lý tài chính cá nhân.
Mục tiêu: giúp người dùng ghi chép thu chi, theo dõi tiền trong các ví, kiểm soát ngân sách và xem báo cáo tài chính cá nhân.
| Nhóm chức năng       | Yêu cầu |
|----------------------|---------|
| Tài khoản            | Đăng ký, đăng nhập, đăng xuất; mỗi người chỉ truy cập được dữ liệu của mình |
| Ví / tài khoản tiền  | Tạo, sửa, lưu trữ ví như tiền mặt, ngân hàng; khai báo số dư ban đầu |
| Danh mục             | Quản lý nhóm thu và chi như lương, ăn uống, đi lại, học tập |
| Giao dịch            | Thêm, xem, sửa, xóa khoản thu hoặc chi; chọn ví, danh mục, số tiền, ngày và ghi chú |
| Tìm kiếm và lọc      | Lọc theo thời gian, ví, loại giao dịch và danh mục; tìm theo tên |
| Ngân sách            | Đặt hạn mức chi theo danh mục và tháng; hiển thị đã chi và còn lại |
| Tổng quan và báo cáo | Tổng thu, tổng chi, chênh lệch thu chi, số dư ví; biểu đồ theo thời gian và danh mục |


| Quy tắc             | Cách xử lý đề xuất |
|---------------------|--------------------|
| Đơn vị tiền         | Phiên bản đầu chỉ dùng VNĐ, số tiền nguyên đồng |
| Số tiền giao dịch   | Luôn lớn hơn 0; loại giao dịch quyết định thu hay chi |
| Quan hệ dữ liệu     | Mỗi giao dịch thuộc một người dùng, một ví và một danh mục |
| Loại danh mục       | Khoản chi phải chọn danh mục chi; khoản thu phải chọn danh mục thu |
| Số dư ví            | Số dư ban đầu + tổng thu − tổng chi của ví |
| Chênh lệch thu chi  | Tổng thu − tổng chi trong khoảng thời gian; khác với số dư ví |
| Ngân sách           | Một hạn mức cho mỗi danh mục chi trong một tháng; vượt hạn mức vẫn cho ghi giao dịch và hiển thị cảnh báo |
| Xóa ví / danh mục   | Không xóa đối tượng đã có giao dịch; có thể lưu trữ để ngừng sử dụng |
| Sửa / xóa giao dịch | Báo cáo, số dư và ngân sách phải phản ánh thay đổi |
| Quyền truy cập      | Backend kiểm tra quyền sở hữu dữ liệu ở từng thao tác |

Kỹ thuật:
- React + CSS xây dựng giao diện; Java Servlet cung cấp API JSON.
- JDBC kết nối MySQL; Tomcat chạy backend.
- Kiểm tra dữ liệu ở cả frontend và backend.
- Mật khẩu tài khoản người dùng được băm, không lưu dạng văn bản gốc.
- Thông tin đăng nhập MySQL nằm ngoài mã nguồn.

#Sơ đồ Database: https://dbdiagram.io/d/6aba1d5a0f25a52d0125f1d8
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

II. Kết nối Java với DB bằng JDBC
1.Thêm driver vào pom.xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.4.0</version>
</dependency>
-> Reload All Maven Projects

2. Tạo file test
- tạo pack com.quanlycanhan.config -> tạo class DatabaseConnectionTest

3. Đặt mật khẩu trong cấu hình chạy IntelliJ
- tìm Edit Configuration
- Chọn DatabaseConnectionTest.
- Tìm Environment variables
- Thêm: Name: DB_PASSWORD. Value: pass đã tạo cho qlcn_app
- run lại và kiểm tra kết quả

4. Tạo bảng
- qlcn_app chưa có quyền tạo bảng, nên mở CMD:
- "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -p
- Tạo bảng bằng lệnh SQL

III. Tạo các bảng 
1. Viết SQL vào file 002_create_related_tables.sql
2. Đăng nhập root ("C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -p)
3. Nhập: SOURCE D:/Document_D/QuanLyCaNhan_Java/database/002_create_related_tables.sql;
