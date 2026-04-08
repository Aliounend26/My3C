import axios from 'axios';

const url = 'http://localhost:5000/api/auth/login';
const creds = [
  { email: 'admin@mypresence.local', password: 'Admin123!' },
  { email: 'superadmin@mypresence.local', password: 'SuperAdmin123!' }
];

for (const c of creds) {
  try {
    const res = await axios.post(url, c);
    console.log(c.email, 'OK', res.data.user.role);
  } catch (e) {
    console.error(c.email, 'ERR', e.response?.status, e.response?.data?.message || e.message);
  }
}
