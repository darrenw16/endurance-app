// Basic sanity test to ensure Jest is working
describe('Test Environment', () => {
  test('Jest is working', () => {
    expect(true).toBe(true);
  });

  test('Math works', () => {
    expect(2 + 2).toBe(4);
  });

  test('Arrays work', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr[0]).toBe(1);
  });
});
