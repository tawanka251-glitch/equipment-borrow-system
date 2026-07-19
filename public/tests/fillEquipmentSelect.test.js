/**
 * @jest-environment jest-environment-jsdom
 *
 * Test Suite: fillEquipmentSelect
 * ครอบคลุม 6 กรณี:
 *  1. สร้าง option เริ่มต้น "เลือกอุปกรณ์..." ก่อนเสมอ
 *  2. สร้าง option ครบทุก item ใน listEquipments
 *  3. option ที่ quantity > 0 → ไม่ disabled
 *  4. option ที่ quantity = 0 → disabled
 *  5. option ที่ quantity < 0 → disabled
 *  6. listEquipments ว่าง → มีแค่ option เริ่มต้น
 *  7. ไม่มี select element ใน DOM → ไม่ throw error (early return)
 *  8. แสดงชื่อและ quantity ใน textContent ถูกต้อง
 */

const { fillEquipmentSelect } = require('../js/fillEquipmentSelect');

/* ─── helper: สร้าง DOM ที่มี <select> ─── */
function buildDOM() {
  document.body.innerHTML = `<select id="equipmentSelect"></select>`;
}

/* ─── ข้อมูลตัวอย่าง ─── */
const mockEquipments = [
  { id: 'EQ01', name: 'กล้อง DSLR',    quantity: 3 },
  { id: 'EQ02', name: 'ไมโครโฟน',       quantity: 0 },
  { id: 'EQ03', name: 'ขาตั้งกล้อง',    quantity: -1 },
];

/* ══════════════════════════════════════════════
   TEST CASES
══════════════════════════════════════════════ */

describe('fillEquipmentSelect()', () => {

  beforeEach(() => {
    buildDOM();
  });

  /* ── 1. option เริ่มต้น "เลือกอุปกรณ์..." ── */
  test('สร้าง option เริ่มต้น "เลือกอุปกรณ์..." เป็น option แรกเสมอ', () => {
    fillEquipmentSelect([]);

    const select  = document.getElementById('equipmentSelect');
    const first   = select.options[0];

    expect(first.value).toBe('');
    expect(first.textContent).toBe('เลือกอุปกรณ์...');
  });

  /* ── 2. จำนวน option ถูกต้อง ── */
  test('สร้าง option ให้ครบทุก item บวกกับ option เริ่มต้น', () => {
    fillEquipmentSelect(mockEquipments);

    const select = document.getElementById('equipmentSelect');
    // 1 default + 3 items
    expect(select.options.length).toBe(4);
  });

  /* ── 3. option ที่ quantity > 0 → ไม่ disabled ── */
  test('option ของอุปกรณ์ที่ quantity > 0 ต้องไม่ถูก disabled', () => {
    fillEquipmentSelect(mockEquipments);

    const select    = document.getElementById('equipmentSelect');
    const optionEQ01 = Array.from(select.options).find(o => o.value === 'EQ01');

    expect(optionEQ01).toBeDefined();
    expect(optionEQ01.disabled).toBe(false);
  });

  /* ── 4. option ที่ quantity = 0 → disabled ── */
  test('option ของอุปกรณ์ที่ quantity = 0 ต้องถูก disabled', () => {
    fillEquipmentSelect(mockEquipments);

    const select     = document.getElementById('equipmentSelect');
    const optionEQ02 = Array.from(select.options).find(o => o.value === 'EQ02');

    expect(optionEQ02).toBeDefined();
    expect(optionEQ02.disabled).toBe(true);
  });

  /* ── 5. option ที่ quantity < 0 → disabled ── */
  test('option ของอุปกรณ์ที่ quantity < 0 ต้องถูก disabled', () => {
    fillEquipmentSelect(mockEquipments);

    const select     = document.getElementById('equipmentSelect');
    const optionEQ03 = Array.from(select.options).find(o => o.value === 'EQ03');

    expect(optionEQ03).toBeDefined();
    expect(optionEQ03.disabled).toBe(true);
  });

  /* ── 6. listEquipments ว่าง → มีแค่ option เริ่มต้น ── */
  test('เมื่อส่ง listEquipments ว่าง ให้มีแค่ option เริ่มต้น 1 ตัว', () => {
    fillEquipmentSelect([]);

    const select = document.getElementById('equipmentSelect');
    expect(select.options.length).toBe(1);
    expect(select.options[0].value).toBe('');
  });

  /* ── 7. ไม่มี <select> ใน DOM → ไม่ throw ── */
  test('ไม่โยน error เมื่อไม่มี select element ใน DOM', () => {
    document.body.innerHTML = ''; // ลบ select ออก

    expect(() => {
      fillEquipmentSelect(mockEquipments);
    }).not.toThrow();
  });

  /* ── 8. textContent แสดงชื่อและ quantity ถูกต้อง ── */
  test('textContent ของ option แสดงชื่อและ quantity ในรูปแบบที่กำหนด', () => {
    fillEquipmentSelect([{ id: 'EQ01', name: 'กล้อง DSLR', quantity: 5 }]);

    const select  = document.getElementById('equipmentSelect');
    const option  = Array.from(select.options).find(o => o.value === 'EQ01');

    expect(option.textContent).toBe('กล้อง DSLR (คงเหลือ: 5)');
  });

  /* ── 9. reset innerHTML ทุกครั้งที่เรียก (ไม่สะสม options เก่า) ── */
  test('เรียกซ้ำ 2 ครั้ง options ต้องไม่ซ้ำกัน', () => {
    fillEquipmentSelect(mockEquipments);
    fillEquipmentSelect([{ id: 'EQ99', name: 'โปรเจกเตอร์', quantity: 1 }]);

    const select = document.getElementById('equipmentSelect');
    // ต้องมีแค่ 1 default + 1 item ไม่ใช่ 1 default + 3 + 1
    expect(select.options.length).toBe(2);
    expect(Array.from(select.options).find(o => o.value === 'EQ99')).toBeDefined();
    expect(Array.from(select.options).find(o => o.value === 'EQ01')).toBeUndefined();
  });

  /* ── 10. ทดสอบ getSelectEl default (ใช้ document.getElementById) ── */
  test('ใช้ document.getElementById("equipmentSelect") เป็น default เมื่อไม่ส่ง deps', () => {
    fillEquipmentSelect([{ id: 'EQ01', name: 'กล้อง', quantity: 2 }]);

    const select = document.getElementById('equipmentSelect');
    expect(select.options.length).toBe(2); // default + 1 item
  });

});
