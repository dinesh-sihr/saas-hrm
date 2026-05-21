const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || (process.env.NODE_ENV === 'production' ? 10 : 4);
    return await bcrypt.hash(password, rounds);
};

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
