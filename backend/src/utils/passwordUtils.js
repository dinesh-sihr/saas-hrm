const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const { Worker } = require('worker_threads');

const bcryptCompareInWorker = (password, hash) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, 'bcryptWorker.js'));
        const timeout = setTimeout(() => {
            worker.terminate();
            reject(new Error('bcrypt worker timeout'));
        }, 15000);
        worker.on('message', (msg) => {
            clearTimeout(timeout);
            worker.terminate();
            if (msg.success) {
                resolve(msg.result);
            } else {
                reject(new Error(msg.error));
            }
        });
        worker.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
        worker.postMessage({ password, hash });
    });
};

const hashPassword = async (password) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        const cost = 4096;
        crypto.scrypt(password, salt, 64, { cost, blockSize: 8, parallelization: 1 }, (err, derivedKey) => {
            if (err) {
                reject(err);
            } else {
                resolve(`scrypt$${cost}$${salt}$${derivedKey.toString('hex')}`);
            }
        });
    });
};

const comparePassword = async (password, hashedPassword) => {
    if (hashedPassword.startsWith('$2')) {
        return await bcryptCompareInWorker(password, hashedPassword);
    }
    const parts = hashedPassword.split('$');
    if (parts[0] === 'scrypt') {
        let cost = 16384;
        let salt = '';
        let key = '';
        if (parts.length === 4) {
            cost = parseInt(parts[1]) || 16384;
            salt = parts[2];
            key = parts[3];
        } else {
            salt = parts[1];
            key = parts[2];
        }
        return new Promise((resolve, reject) => {
            crypto.scrypt(password, salt, 64, { cost, blockSize: 8, parallelization: 1 }, (err, derivedKey) => {
                if (err) {
                    reject(err);
                } else {
                    const keyBuffer = Buffer.from(key, 'hex');
                    const derivedBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
                    if (keyBuffer.length !== derivedBuffer.length) {
                        resolve(false);
                    } else {
                        resolve(crypto.timingSafeEqual(keyBuffer, derivedBuffer));
                    }
                }
            });
        });
    }
    return false;
};

module.exports = { hashPassword, comparePassword };
