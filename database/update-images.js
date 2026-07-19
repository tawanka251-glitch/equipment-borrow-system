const pool = require('./db');

async function updateImages() {
  const connection = await pool.getConnection();
  try {
    console.log("Updating equipment images to match descriptions...");

    const updates = [
      {
        name: 'ลูกบาสเกตบอล',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'กล้องวิดีโอ',
        image: 'https://images.unsplash.com/photo-1519683109079-d5f539e1542f?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'ไมค์ลอย',
        image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'เครื่องฉายสไลด์',
        image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=800&q=80'
      },
      {
        name: 'ชุดพิธีการ',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const item of updates) {
      const [result] = await connection.query(
        "UPDATE equipment SET image = ? WHERE name = ?",
        [item.image, item.name]
      );
      console.log(`Updated '${item.name}': affected ${result.affectedRows} rows`);
    }

    console.log("Image update completed successfully.");
  } catch (err) {
    console.error("Update error:", err);
    throw err;
  } finally {
    connection.release();
  }
}

updateImages()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
