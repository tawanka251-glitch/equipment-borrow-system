/**
 * @jest-environment jest-environment-jsdom
 *
 * Test Suite: submitManualBorrow
 * ครอบคลุม 8 กรณี:
 *  1. validation – ฟิลด์ว่าง → alert เตือน, ไม่เรียก fetch
 *  2. validation – quantity < 1 → alert เตือน
 *  3. submit สำเร็จ (res.ok = true) → alert สำเร็จ, reset form, เรียก callbacks
 *  4. submit ไม่สำเร็จ (res.ok = false) มี error จาก server
 *  5. submit ไม่สำเร็จ (res.ok = false) ไม่มี error → ข้อความ default
 *  6. fetch throw error (network down) → alert ไม่สามารถเชื่อมต่อ
 *  7. ใช้ default deps (global.fetch, global.alert) – ครอบ default branches
 *  8. ตรวจว่า event.preventDefault() ถูกเรียกเสมอ
 */

const { submitManualBorrow } = require('../js/submitManualBorrow');

/* ─── helper: สร้าง DOM จำลองสำหรับ form ─── */
function buildDOM({
  studentId    = 'STD001',
  borrowerName = 'สมชาย',
  equipmentId  = 'EQ01',
  quantity     = '2',
  returnDate   = '2099-12-31',
} = {}) {
  document.body.innerHTML = `
    <form id="manualBorrowForm">
      <input id="studentId"      value="${studentId}" />
      <input id="borrowerName"   value="${borrowerName}" />
      <select id="equipmentSelect"><option value="${equipmentId}" selected>${equipmentId}</option></select>
      <input id="borrowQuantity" value="${quantity}" type="number" />
      <input id="returnDate"     value="${returnDate}" />
    </form>
  `;
}

/* ─── helper: mock deps ─── */
function makeDeps(fetchResponse) {
  return {
    fetchFn:              jest.fn().mockResolvedValue(fetchResponse),
    alertFn:              jest.fn(),
    getAuthHeader:        jest.fn().mockReturnValue({ Authorization: 'Bearer token' }),
    loadEquipmentOptions: jest.fn(),
    loadActiveBorrows:    jest.fn(),
  };
}

/* ─── fake event ─── */
const fakeEvent = { preventDefault: jest.fn() };

/* ══════════════════════════════════════════════
   TEST CASES
══════════════════════════════════════════════ */

describe('submitManualBorrow()', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /* ── 1. Validation: ฟิลด์ studentId ว่าง ── */
  test('แสดง alert เตือนเมื่อ studentId ว่าง และไม่เรียก fetch', async () => {
    buildDOM({ studentId: '' });
    const deps = makeDeps({});

    await submitManualBorrow(fakeEvent, deps);

    expect(fakeEvent.preventDefault).toHaveBeenCalled();
    expect(deps.alertFn).toHaveBeenCalledWith('กรุณากรอกข้อมูลให้ครบถ้วน');
    expect(deps.fetchFn).not.toHaveBeenCalled();
  });

  /* ── 2. Validation: quantity < 1 ── */
  test('แสดง alert เตือนเมื่อ quantity น้อยกว่า 1', async () => {
    buildDOM({ quantity: '0' });
    const deps = makeDeps({});

    await submitManualBorrow(fakeEvent, deps);

    expect(deps.alertFn).toHaveBeenCalledWith('กรุณากรอกข้อมูลให้ครบถ้วน');
    expect(deps.fetchFn).not.toHaveBeenCalled();
  });

  /* ── 3. Submit สำเร็จ (res.ok = true) ── */
  test('เรียก fetch POST และ alert สำเร็จ พร้อม reset form และ callbacks เมื่อ res.ok', async () => {
    buildDOM();
    const deps = makeDeps({ ok: true, json: async () => ({}) });

    await submitManualBorrow(fakeEvent, deps);

    // ตรวจว่า fetch ถูกเรียกถูกต้อง
    expect(deps.fetchFn).toHaveBeenCalledWith('/api/borrow', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));

    // ตรวจ body ที่ส่งไป
    const body = JSON.parse(deps.fetchFn.mock.calls[0][1].body);
    expect(body).toEqual({
      studentId:    'STD001',
      borrowerName: 'สมชาย',
      equipmentId:  'EQ01',
      quantity:     2,
      returnDate:   '2099-12-31',
    });

    // ตรวจ alert สำเร็จ
    expect(deps.alertFn).toHaveBeenCalledWith('บันทึกการยืมออฟไลน์สำเร็จเรียบร้อย');

    // ตรวจ callbacks
    expect(deps.loadEquipmentOptions).toHaveBeenCalledTimes(1);
    expect(deps.loadActiveBorrows).toHaveBeenCalledTimes(1);
  });

  /* ── 4. Submit ไม่สำเร็จ: server ส่ง error message ── */
  test('แสดง error จาก server เมื่อ res.ok = false และมี data.error', async () => {
    buildDOM();
    const deps = makeDeps({ ok: false, json: async () => ({ error: 'อุปกรณ์ไม่เพียงพอ' }) });

    await submitManualBorrow(fakeEvent, deps);

    expect(deps.alertFn).toHaveBeenCalledWith('อุปกรณ์ไม่เพียงพอ');
    expect(deps.loadEquipmentOptions).not.toHaveBeenCalled();
  });

  /* ── 5. Submit ไม่สำเร็จ: ไม่มี error ใน response ── */
  test('แสดงข้อความ default เมื่อ res.ok = false และ data.error ว่าง', async () => {
    buildDOM();
    const deps = makeDeps({ ok: false, json: async () => ({}) });

    await submitManualBorrow(fakeEvent, deps);

    expect(deps.alertFn).toHaveBeenCalledWith('เกิดข้อผิดพลาดในการบันทึกการยืม');
  });

  /* ── 6. Network error: fetch throw exception ── */
  test('แสดง alert เชื่อมต่อไม่ได้เมื่อ fetch โยน exception', async () => {
    buildDOM();
    const deps = {
      fetchFn:              jest.fn().mockRejectedValue(new Error('Network Error')),
      alertFn:              jest.fn(),
      getAuthHeader:        jest.fn().mockReturnValue({}),
      loadEquipmentOptions: jest.fn(),
      loadActiveBorrows:    jest.fn(),
    };

    await submitManualBorrow(fakeEvent, deps);

    expect(deps.alertFn).toHaveBeenCalledWith('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านได้');
    expect(deps.loadEquipmentOptions).not.toHaveBeenCalled();
  });

  /* ── 7. ทดสอบ default deps (globalThis.fetch & globalThis.alert) ──
     ครอบ branches ของ default values ใน destructuring               */
  test('ใช้ globalThis.fetch และ globalThis.alert เป็น default เมื่อไม่ส่ง deps', async () => {
    buildDOM({ studentId: '' }); // validation fail → ไม่ต้องใช้ fetch จริง

    // mock globals ก่อน เพื่อให้ default destructuring ได้ค่าที่ถูกต้อง
    const mockFetch = jest.fn();
    const mockAlert = jest.fn();
    globalThis.fetch = mockFetch;
    globalThis.alert = mockAlert;

    // ไม่ส่ง deps → ใช้ default ทั้งหมด
    await submitManualBorrow(fakeEvent);

    // validation ล้มเหลว → alertFn (= globalThis.alert) ถูกเรียก
    expect(mockAlert).toHaveBeenCalledWith('กรุณากรอกข้อมูลให้ครบถ้วน');
    expect(mockFetch).not.toHaveBeenCalled();

    // cleanup
    delete globalThis.fetch;
    delete globalThis.alert;
  });

  /* ── 8. ตรวจว่า auth header ถูก merge เข้า headers ── */
  test('merge getAuthHeader() เข้า headers ที่ส่งไปกับ fetch', async () => {
    buildDOM();
    const customHeader = { Authorization: 'Bearer xyz' };
    const deps = {
      fetchFn:              jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
      alertFn:              jest.fn(),
      getAuthHeader:        () => customHeader,
      loadEquipmentOptions: jest.fn(),
      loadActiveBorrows:    jest.fn(),
    };

    await submitManualBorrow(fakeEvent, deps);

    const sentHeaders = deps.fetchFn.mock.calls[0][1].headers;
    expect(sentHeaders).toMatchObject({
      'Content-Type': 'application/json',
      Authorization:  'Bearer xyz',
    });
  });

});
