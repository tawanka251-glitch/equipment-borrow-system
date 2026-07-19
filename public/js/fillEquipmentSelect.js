/**
 * fillEquipmentSelect module
 * แยกออกมาเพื่อให้ทดสอบด้วย Jest ได้
 *
 * @param {Array}  listEquipments - รายการอุปกรณ์ [{ id, name, quantity }]
 * @param {Object} deps           - dependency injection สำหรับ testing
 * @param {Function} deps.getSelectEl - ฟังก์ชันที่คืน <select> element
 *                                      (default: document.getElementById('equipmentSelect'))
 */
function fillEquipmentSelect(listEquipments, deps = {}) {
  const {
    getSelectEl = () => document.getElementById('equipmentSelect'),
  } = deps;

  const select = getSelectEl();
  if (!select) return;

  select.innerHTML = '<option value="">เลือกอุปกรณ์...</option>';

  listEquipments.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.name} (คงเหลือ: ${item.quantity})`;
    option.disabled = item.quantity <= 0;
    select.appendChild(option);
  });
}

if (typeof module !== 'undefined') {
  module.exports = { fillEquipmentSelect };
}
