export function generateRandomEmail() {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `user_${timestamp}_${randomStr}@test.com`;
}
