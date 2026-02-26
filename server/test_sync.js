
async function testSync() {
    try {
        const payload = {
            auditLog: [
                {
                    id: 'test-audit-1',
                    action: 'TEST_ACTION',
                    details: 'This is a test audit log',
                    operatorId: 'op-1',
                    operatorName: 'System Test',
                    branchId: 'br-1',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]
        };
        const pushRes = await fetch('http://localhost:3001/api/sync/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('Push status:', pushRes.status);
        const pushBody = await pushRes.json();
        console.log('Push body:', pushBody);
    } catch (err) {
        console.error('Network Error:', err);
    }
}

testSync();
