const express = require("express");
const app = express();
const db = require('./database/db');
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const borrowRoutes = require('./routes/borrow');

app.use(express.json());
app.use((req, res, next) => {
    if (req.path.match(/\.html\/$/)) {
        return res.redirect(301, req.path.slice(0, -1));
    }
    next();
});
app.use(express.static("public"));
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/borrow', borrowRoutes);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, async () => {
    try {
        await db.query('SELECT 1');
        console.log("Connected to MySQL");
    } catch (err) {
        console.error("MySQL connection error:", err);
    }
    console.log(`Server running on port ${PORT}`);
});