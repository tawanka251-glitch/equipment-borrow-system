const pool = require('./db');

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log("Checking columns for 'equipment' table...");
    
    // Check category
    const [catCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'equipment' AND COLUMN_NAME = 'category'"
    );
    if (catCols.length === 0) {
      console.log("Adding 'category' column to 'equipment'...");
      await connection.query("ALTER TABLE equipment ADD COLUMN category VARCHAR(255) NOT NULL DEFAULT 'ทั่วไป'");
    }

    // Check description
    const [descCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'equipment' AND COLUMN_NAME = 'description'"
    );
    if (descCols.length === 0) {
      console.log("Adding 'description' column to 'equipment'...");
      await connection.query("ALTER TABLE equipment ADD COLUMN description TEXT NULL");
    }

    // Check image
    const [imgCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'equipment' AND COLUMN_NAME = 'image'"
    );
    if (imgCols.length === 0) {
      console.log("Adding 'image' column to 'equipment'...");
      await connection.query("ALTER TABLE equipment ADD COLUMN image LONGTEXT NULL");
    }

    console.log("Checking columns for 'borrow_history' table...");

    // Check quantity
    const [qtyCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'borrow_history' AND COLUMN_NAME = 'quantity'"
    );
    if (qtyCols.length === 0) {
      console.log("Adding 'quantity' column to 'borrow_history'...");
      await connection.query("ALTER TABLE borrow_history ADD COLUMN quantity INT NOT NULL DEFAULT 1");
    }

    // Check borrower_name
    const [nameCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'borrow_history' AND COLUMN_NAME = 'borrower_name'"
    );
    if (nameCols.length === 0) {
      console.log("Adding 'borrower_name' column to 'borrow_history'...");
      await connection.query("ALTER TABLE borrow_history ADD COLUMN borrower_name VARCHAR(255) NULL");
    }

    // Check student_id
    const [stdCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'borrow_history' AND COLUMN_NAME = 'student_id'"
    );
    if (stdCols.length === 0) {
      console.log("Adding 'student_id' column to 'borrow_history'...");
      await connection.query("ALTER TABLE borrow_history ADD COLUMN student_id VARCHAR(50) NULL");
    }

    // Check return_due_date
    const [dueCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'borrow_history' AND COLUMN_NAME = 'return_due_date'"
    );
    if (dueCols.length === 0) {
      console.log("Adding 'return_due_date' column to 'borrow_history'...");
      await connection.query("ALTER TABLE borrow_history ADD COLUMN return_due_date DATETIME NULL");
    }

    // Check status
    const [statusCols] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'borrow_history' AND COLUMN_NAME = 'status'"
    );
    if (statusCols.length === 0) {
      console.log("Adding 'status' column to 'borrow_history'...");
      await connection.query("ALTER TABLE borrow_history ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'borrowed'");
    }

    console.log("Seeding admin user...");
    // Check and seed admin
    const [admins] = await connection.query("SELECT id FROM users WHERE email = 'admin@localhost'");
    if (admins.length === 0) {
      console.log("Seeding default admin 'admin@localhost' with password 'admin123'...");
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('admin123', 10);
      await connection.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Administrator', 'admin@localhost', ?, 'admin')",
        [hash]
      );
    }

    console.log("Seeding default equipment...");
    const [eqCount] = await connection.query("SELECT COUNT(*) as count FROM equipment");
    if (eqCount[0].count === 0) {
      console.log("Seeding initial equipment items...");
      const defaultEquipments = [
        {
          name: 'ลูกบาสเกตบอล',
          category: 'กีฬา',
          quantity: 12,
          image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
          description: 'ลูกบาสขนาดมาตรฐาน สำหรับซ้อมและแข่งบนสนาม.'
        },
        {
          name: 'กล้องวิดีโอ',
          category: 'อิเล็กทรอนิกส์',
          quantity: 4,
          image: 'https://images.unsplash.com/photo-1519683109079-d5f539e1542f?auto=format&fit=crop&w=800&q=80',
          description: 'กล้องวิดีโอคุณภาพสูง เหมาะสำหรับบันทึกกิจกรรมและงานประชาสัมพันธ์.'
        },
        {
          name: 'ไมค์ลอย',
          category: 'เครื่องเสียง',
          quantity: 6,
          image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
          description: 'ไมโครโฟนไร้สาย สำหรับงานประชุมและการแสดง.'
        },
        {
          name: 'เครื่องฉายสไลด์',
          category: 'โสตทัศนูปกรณ์',
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=800&q=80',
          description: 'เครื่องฉายภาพสำหรับการนำเสนอในห้องประชุมและห้องเรียน.'
        },
        {
          name: 'ชุดพิธีการ',
          category: 'พิธีการ',
          quantity: 3,
          image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
          description: 'อุปกรณ์ชุดพิธีการสำหรับงานทางการของมหาวิทยาลัย.'
        }
      ];

      for (const eq of defaultEquipments) {
        await connection.query(
          "INSERT INTO equipment (name, category, quantity, image, description) VALUES (?, ?, ?, ?, ?)",
          [eq.name, eq.category, eq.quantity, eq.image, eq.description]
        );
      }
    }

    console.log("Migration and seeding completed successfully.");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  } finally {
    connection.release();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
