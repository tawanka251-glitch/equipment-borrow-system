/**
 * submitManualBorrow module
 * แยกออกมาเพื่อให้ทดสอบด้วย Jest ได้
 *
 * @param {Event} event - form submit event
 * @param {Object} deps - dependency injection สำหรับ testing
 * @param {Function} deps.fetchFn            - ฟังก์ชัน fetch (default: global fetch)
 * @param {Function} deps.alertFn            - ฟังก์ชัน alert (default: global alert)
 * @param {Function} deps.getAuthHeader      - ฟังก์ชันดึง auth header
 * @param {Function} deps.loadEquipmentOptions - callback หลัง submit สำเร็จ
 * @param {Function} deps.loadActiveBorrows    - callback หลัง submit สำเร็จ
 */
async function submitManualBorrow(event, deps = {}) {
  const {
    fetchFn = globalThis.fetch,
    alertFn = globalThis.alert,
    getAuthHeader = () => ({}),
    loadEquipmentOptions = () => {},
    loadActiveBorrows = () => {},
  } = deps;

  event.preventDefault();

  const studentId    = document.getElementById('studentId').value.trim();
  const borrowerName = document.getElementById('borrowerName').value.trim();
  const equipmentId  = document.getElementById('equipmentSelect').value;
  const quantity     = Number(document.getElementById('borrowQuantity').value);
  const returnDate   = document.getElementById('returnDate').value;

  if (!studentId || !borrowerName || !equipmentId || !returnDate || quantity < 1) {
    alertFn('กรุณากรอกข้อมูลให้ครบถ้วน');
    return;
  }

  try {
    const res = await fetchFn('/api/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ studentId, borrowerName, equipmentId, quantity, returnDate }),
    });

    const data = await res.json();

    if (res.ok) {
      alertFn('บันทึกการยืมออฟไลน์สำเร็จเรียบร้อย');
      document.getElementById('manualBorrowForm').reset();
      loadEquipmentOptions();
      loadActiveBorrows();
    } else {
      alertFn(data.error || 'เกิดข้อผิดพลาดในการบันทึกการยืม');
    }
  } catch (err) {
    alertFn('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านได้');
  }
}

if (typeof module !== 'undefined') {
  module.exports = { submitManualBorrow };
}
