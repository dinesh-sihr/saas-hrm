const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const hashPassword = async (password) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, { cost: 4096, blockSize: 8, parallelization: 1 }, (err, derivedKey) => {
            if (err) {
                reject(err);
            } else {
                resolve(`scrypt$${salt}$${derivedKey.toString('hex')}`);
            }
        });
    });
};

const comparePassword = async (password, hashedPassword) => {
    if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')) {
        return await bcrypt.compare(password, hashedPassword);
    }
    const parts = hashedPassword.split('$');
    if (parts[0] === 'scrypt') {
        const salt = parts[1];
        const key = parts[2];
        return new Promise((resolve, reject) => {
            crypto.scrypt(password, salt, 64, { cost: 4096, blockSize: 8, parallelization: 1 }, (err, derivedKey) => {
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
