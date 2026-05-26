const { parentPort } = require('worker_threads');
const bcrypt = require('bcryptjs');

parentPort.on('message', async ({ password, hash }) => {
    try {
        const result = await bcrypt.compare(password, hash);
        parentPort.postMessage({ success: true, result });
    } catch (err) {
        parentPort.postMessage({ success: false, error: err.message });
    }
});
