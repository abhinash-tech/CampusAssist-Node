import { answerCampusQuestion, classifySupportRequest, improveSupportRequest, summarizeRequestForStaff } from '../src/services/ai.js'
import { closePool } from '../src/db/mysql.js'

async function run() {
  console.log('================ TESTING 5 AI FEATURES ================')

  console.log('\n--- 1. Campus AI Assistant (Grounded Wi-Fi query) ---')
  const f1Grounded = await answerCampusQuestion('How do I connect to campus Wi-Fi?')
  console.log('Mode:', f1Grounded.mode, '| Model:', f1Grounded.model)
  console.log('Sources:', JSON.stringify(f1Grounded.sources))
  console.log('Answer preview:\n', f1Grounded.answer.slice(0, 200))

  console.log('\n--- 1b. Campus AI Assistant (Ungrounded Mars query) ---')
  const f1Ungrounded = await answerCampusQuestion('What is the formula for rocket propulsion on Mars?')
  console.log('Mode:', f1Ungrounded.mode)
  console.log('Sources count:', f1Ungrounded.sources.length)
  console.log('Answer preview:\n', f1Ungrounded.answer.slice(0, 200))

  console.log('\n--- 2. Smart Request Classification ---')
  const f2 = await classifySupportRequest(
    'Need bonafide certificate for passport',
    'Please issue my bonafide certificate urgently as passport appointment is on Friday'
  )
  console.log('Mode:', f2.mode)
  console.log('Category:', f2.category, '| Priority:', f2.priority)
  console.log('Reason:', f2.reason)
  console.log('Missing details:', JSON.stringify(f2.missingDetails))

  console.log('\n--- 3. AI Request Writing Assistant ---')
  const f3 = await improveSupportRequest(
    'wifi not working',
    'it stopped working since yesterday in hostel block b room 204 fix it'
  )
  console.log('Mode:', f3.mode)
  console.log('Improved Title:', f3.title)
  console.log('Improved Description:', f3.description)
  console.log('Key changes:', JSON.stringify(f3.keyChanges))

  console.log('\n--- 4. Staff Copilot ---')
  const f4 = await summarizeRequestForStaff({
    requestCode: 'REQ-2026-TEST',
    title: 'Hostel Room 204 Wi-Fi Outage',
    description: 'Internet connection is completely dead in Room 204 Block B.',
    category: 'technical',
    priority: 'High',
    status: 'In progress',
    history: [
      { title: 'Submitted', body: 'Student lodged Wi-Fi complaint', date: '2026-10-10', actor: 'Student' },
      { title: 'Triaged', body: 'Assigned to IT network team', date: '2026-10-11', actor: 'Helpdesk Staff' }
    ]
  })
  console.log('Mode:', f4.mode)
  console.log('Summary:', f4.summary)
  console.log('Extracted facts:', JSON.stringify(f4.extractedFacts))
  console.log('Suggested reply:', f4.suggestedReply)

  console.log('\n--- 5. Telugu Support (Language directive & Telugu script) ---')
  const f5Telugu = await answerCampusQuestion('హాస్టల్ నిర్వహణ మరియు వైఫై సమస్యను ఎవరికి తెలియజేయాలి?', [], 'Telugu')
  console.log('Mode:', f5Telugu.mode, '| Language:', f5Telugu.language)
  console.log('Telugu Answer preview:\n', f5Telugu.answer.slice(0, 300))

  await closePool()
  console.log('\n================ ALL 5 FEATURE CHECKS COMPLETE ================')
}

run().catch((err) => {
  console.error('Error during verification:', err)
  process.exit(1)
})
