import * as jose from 'jose';
async function test() {
  const secret = new TextEncoder().encode('super-secret-regional-express-key-change-in-prod');
  const token = await new jose.SignJWT({ userId: '11111111-1111-1111-1111-111111111111', role: 'PDG', roleId: null })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
  console.log('Token:', token);
  const res = await fetch('http://localhost:3000/dashboard', { headers: { Cookie: 'auth-token=' + token } });
  const text = await res.text();
  console.log('Status:', res.status);
  if (res.status === 500) {
    console.log('ERROR HTML:', text.substring(0, 1000));
  } else {
    console.log('OK, string length:', text.length);
  }
}
test();
