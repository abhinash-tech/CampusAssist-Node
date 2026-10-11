import dotenv from 'dotenv'
dotenv.config({ path: 'backend/.env' })
import jwt from 'jsonwebtoken'
import app from '../index.js'
import { query, closePool, isDatabaseConfigured } from '../src/db/mysql.js'

async function run() {
  console.log('================ TESTING DATABASE CRUD & AUTHENTICATION ================')

  const ts = Date.now()
  const student1Email = `student1_${ts}@test.anurag.edu.in`
  const student2Email = `student2_${ts}@test.anurag.edu.in`
  const staffEmail = `staff_${ts}@test.anurag.edu.in`
  const password = 'StrongPassword123!'

  console.log('1. Registering Synthetic Student 1...')
  const regRes1 = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: student1Email,
      password,
      fullName: 'Test Student One',
      role: 'student',
    }),
  })
  const regData1 = await regRes1.json()
  console.log('Student 1 registered status:', regRes1.status, '| mode:', regData1.mode)
  if (regRes1.status !== 201) throw new Error('Failed to register student 1: ' + JSON.stringify(regData1))
  const tokenStudent1 = regData1.token
  const student1Id = regData1.user.id

  console.log('\n2. Registering Synthetic Student 2...')
  const regRes2 = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: student2Email,
      password,
      fullName: 'Test Student Two',
      role: 'student',
    }),
  })
  const regData2 = await regRes2.json()
  console.log('Student 2 registered status:', regRes2.status)
  if (regRes2.status !== 201) throw new Error('Failed to register student 2')
  const tokenStudent2 = regData2.token
  const student2Id = regData2.user.id

  console.log('\n3. Registering Synthetic Staff User...')
  const regResStaff = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffEmail,
      password,
      fullName: 'Test Staff Officer',
      role: 'staff',
    }),
  })
  const regDataStaff = await regResStaff.json()
  console.log('Staff registered status:', regResStaff.status)
  if (regResStaff.status !== 201) throw new Error('Failed to register staff: ' + JSON.stringify(regDataStaff))
  const staffToken = regDataStaff.token
  const staffId = regDataStaff.user.id

  console.log('\n4. Testing Role Authorization: Student creating category (Should return 403)...')
  const catForbiddenRes = await app.request('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenStudent1}`,
    },
    body: JSON.stringify({ name: `Test Category ${ts}` }),
  })
  console.log('Student create category status:', catForbiddenRes.status, '(Expected 403: PASS)')
  if (catForbiddenRes.status !== 403) throw new Error(`Expected 403, got ${catForbiddenRes.status}`)

  console.log('\n5. Staff creating category in MySQL (Should return 201)...')
  const catCreateRes = await app.request('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ name: `Test Category ${ts}`, description: 'Synthetic test category' }),
  })
  const catCreateData = await catCreateRes.json()
  console.log('Staff create category status:', catCreateRes.status, '| category ID:', catCreateData.category?.id)
  if (catCreateRes.status !== 201) throw new Error('Staff category creation failed')
  const createdCategoryId = catCreateData.category.id

  console.log('\n6. Student 1 creating service request in MySQL (Should return 201)...')
  const reqCreateRes = await app.request('/api/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenStudent1}`,
    },
    body: JSON.stringify({
      title: `Hostel room maintenance issue ${ts}`,
      description: 'Water leakage in bathroom pipe since morning, please repair promptly.',
      categoryId: createdCategoryId,
      priority: 'High',
    }),
  })
  const reqCreateData = await reqCreateRes.json()
  console.log('Request creation status:', reqCreateRes.status, '| Request Code:', reqCreateData.request?.requestCode)
  if (reqCreateRes.status !== 201) throw new Error('Request creation failed: ' + JSON.stringify(reqCreateData))
  const createdRequestId = reqCreateData.request.id

  console.log('\n7. Student 1 listing their requests (Should include created ticket)...')
  const listRes1 = await app.request('/api/requests', {
    headers: { Authorization: `Bearer ${tokenStudent1}` },
  })
  const listData1 = await listRes1.json()
  const foundInStudent1 = (listData1.requests || []).some((r: any) => r.id === createdRequestId)
  console.log('Student 1 sees ticket:', foundInStudent1, '(PASS)')
  if (!foundInStudent1) throw new Error('Student 1 cannot see their own ticket')

  console.log('\n8. Student 2 attempting to view Student 1 ticket (Should return 403 Forbidden)...')
  const getForbiddenRes = await app.request(`/api/requests/${createdRequestId}`, {
    headers: { Authorization: `Bearer ${tokenStudent2}` },
  })
  console.log('Student 2 access status:', getForbiddenRes.status, '(Expected 403: PASS)')
  if (getForbiddenRes.status !== 403) throw new Error(`Expected 403, got ${getForbiddenRes.status}`)

  console.log('\n9. Staff updating request status to "In progress" via PATCH /api/requests/:id/status...')
  const patchRes = await app.request(`/api/requests/${createdRequestId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify({ status: 'In progress', note: 'Assigned plumber to inspect room.' }),
  })
  const patchData = await patchRes.json()
  console.log('Staff patch status:', patchRes.status, '| updated status:', patchData.status)
  if (patchRes.status !== 200 || patchData.status !== 'In progress') {
    throw new Error('Staff status update failed: ' + JSON.stringify(patchData))
  }

  console.log('\n10. Student 1 viewing updated request with activity log...')
  const getDetailRes = await app.request(`/api/requests/${createdRequestId}`, {
    headers: { Authorization: `Bearer ${tokenStudent1}` },
  })
  const getDetailData = await getDetailRes.json()
  console.log('Current status:', getDetailData.request?.status, '| History events:', getDetailData.request?.history?.length)
  if (getDetailData.request?.status !== 'In progress') throw new Error('Status not persisted')

  console.log('\n11. Cleaning up synthetic test records from MySQL...')
  await query('DELETE FROM request_activity WHERE request_id = ?', [createdRequestId])
  await query('DELETE FROM service_requests WHERE id = ?', [createdRequestId])
  await query('DELETE FROM request_categories WHERE id = ?', [createdCategoryId])
  await query('DELETE FROM users WHERE id IN (?, ?, ?)', [student1Id, student2Id, staffId])
  console.log('Synthetic cleanup completed successfully.')

  console.log('\n12. Verifying MySQL TLS configuration...')
  console.log('MYSQL_SSL env configured:', process.env.MYSQL_SSL === 'true' ? 'YES (TLS enabled)' : 'NO')

  await closePool()
  console.log('\n================ ALL DATABASE CRUD & AUTH CHECKS PASS ================')
}

run().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
