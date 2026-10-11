export const categories = [
  { id: 'academic', label: 'Academic support', icon: 'BookOpen', tone: 'blue', description: 'Coursework, grades, attendance and academic records.' },
  { id: 'campus', label: 'Campus services', icon: 'Building2', tone: 'orange', description: 'Facilities, transport, hostel and campus life.' },
  { id: 'technical', label: 'IT & digital access', icon: 'MonitorCog', tone: 'violet', description: 'Accounts, Wi-Fi, LMS and technical assistance.' },
  { id: 'administration', label: 'Administration', icon: 'ClipboardList', tone: 'green', description: 'Certificates, documents and administrative requests.' },
]

export const seedRequests = [
  { id: 'CA-1048', title: 'Attendance record correction', category: 'academic', status: 'In progress', priority: 'Medium', createdAt: '2026-10-08', updatedAt: '2026-10-10', owner: 'Abhinash Jangapally', assignee: 'Academic Office', description: 'Requesting a review of two periods that have not appeared in the attendance portal.', history: [{ date: 'Oct 08, 2026 · 10:42 AM', title: 'Request submitted', body: 'Your request was received by the Academic Office.' }, { date: 'Oct 09, 2026 · 02:15 PM', title: 'Under review', body: 'The team is checking the period records.' }] },
  { id: 'CA-1047', title: 'Access to course material', category: 'technical', status: 'Open', priority: 'Low', createdAt: '2026-10-07', updatedAt: '2026-10-07', owner: 'Abhinash Jangapally', assignee: 'IT Helpdesk', description: 'The learning portal is not displaying the latest course notes.', history: [{ date: 'Oct 07, 2026 · 09:18 AM', title: 'Request submitted', body: 'Your request was routed to the IT Helpdesk.' }] },
  { id: 'CA-1045', title: 'Bonafide certificate', category: 'administration', status: 'Resolved', priority: 'Medium', createdAt: '2026-10-03', updatedAt: '2026-10-06', owner: 'Abhinash Jangapally', assignee: 'Student Services', description: 'A bonafide certificate is required for a scholarship application.', history: [{ date: 'Oct 03, 2026 · 11:30 AM', title: 'Request submitted', body: 'Your request was received.' }, { date: 'Oct 06, 2026 · 04:05 PM', title: 'Request resolved', body: 'The certificate is ready for collection.' }] },
  { id: 'CA-1042', title: 'Campus Wi-Fi connectivity', category: 'technical', status: 'In progress', priority: 'High', createdAt: '2026-10-01', updatedAt: '2026-10-04', owner: 'Ritika Sharma', assignee: 'IT Helpdesk', description: 'Intermittent connectivity in the library study area.', history: [{ date: 'Oct 01, 2026 · 12:06 PM', title: 'Request submitted', body: 'Ticket opened.' }, { date: 'Oct 04, 2026 · 02:45 PM', title: 'Technician assigned', body: 'The network team is investigating.' }] },
  { id: 'CA-1039', title: 'Hostel maintenance follow-up', category: 'campus', status: 'Open', priority: 'Medium', createdAt: '2026-09-29', updatedAt: '2026-09-29', owner: 'Arjun Rao', assignee: 'Campus Facilities', description: 'Follow-up on the study room lighting request.', history: [{ date: 'Sep 29, 2026 · 03:10 PM', title: 'Request submitted', body: 'Your request is in the queue.' }] },
]

export const knowledgeArticles = [
  { id: 'K-01', category: 'Academics', title: 'How to request an attendance review', summary: 'What to include when reporting a missing or incorrect attendance entry.', updated: 'Oct 02, 2026', read: '3 min read' },
  { id: 'K-02', category: 'Administration', title: 'Requesting student certificates', summary: 'A quick guide to bonafide, conduct and other student certificates.', updated: 'Sep 26, 2026', read: '4 min read' },
  { id: 'K-03', category: 'Digital services', title: 'Connecting to campus Wi-Fi', summary: 'Troubleshooting steps for common campus network access issues.', updated: 'Sep 19, 2026', read: '2 min read' },
  { id: 'K-04', category: 'Campus life', title: 'Facilities and maintenance requests', summary: 'How to report a facilities issue and follow its progress.', updated: 'Sep 12, 2026', read: '3 min read' },
]

export const initialActivity = [
  { id: 1, color: 'blue', title: 'Attendance record correction', detail: 'Request moved to In progress', time: 'Today, 10:24 AM', tag: 'CA-1048' },
  { id: 2, color: 'orange', title: 'Bonafide certificate', detail: 'Request marked as resolved', time: 'Oct 06, 4:05 PM', tag: 'CA-1045' },
  { id: 3, color: 'violet', title: 'Course material access', detail: 'New support request created', time: 'Oct 07, 9:18 AM', tag: 'CA-1047' },
]
