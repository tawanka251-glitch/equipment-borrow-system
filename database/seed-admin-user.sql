USE wab_borrow_return;

INSERT INTO users (name, email, password, role)
VALUES ('Administrator', 'admin@localhost', '$2a$10$KWEYzvY2JkI2ZqS0NjM4wOOTB18FyMjXx9VOrfQF5Q0cYA1Tu5dN6', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin';

-- รหัสผ่านตัวอย่าง: admin123
-- hash สร้างจาก bcrypt สำหรับรหัสผ่าน "admin123".