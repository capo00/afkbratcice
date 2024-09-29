const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const Config = require("../config/config");
const identityDao = require("../dao/identity-dao");

function generateNumId(text) {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    n += text.codePointAt(i);
  }
  let numText = n + "";
  let i = 0;
  while (numText.length > 3 && i < 100) {
    const halfI = Math.round(numText.length / 2);
    const num1 = +numText.substring(0, halfI);
    const num2 = +numText.substring(halfI, numText.length);
    numText = (num1 + num2) + "";
    i++;
  }
  return numText;
}

const generateId = (email, time) => [generateNumId(email), generateNumId(time), "1"].join("-");

const Identity = {
  async create(identity) {
    if (identity.password) {
      const salt = await bcrypt.genSalt(10);
      identity.password = await bcrypt.hash(identity.password, salt);
    }

    const cts = new Date().toISOString();
    const newUser = { identity: generateId(identity.email, cts), ...identity };
    return await identityDao.create(newUser);
  },

  async get(id) {
    return await identityDao.get(id);
  },

  async getByEmail(email) {
    return await identityDao.findOne({ email });
  },

  async getByGoogleId(googleId) {
    return await identityDao.findOne({ googleId });
  },

  async matchPassword(inputPassword, storedPassword) {
    return await bcrypt.compare(inputPassword, storedPassword);
  },

  createToken(identity) {
    return jwt.sign(Identity.getBasicData(identity), Config.token.jwtSecret, { expiresIn: Config.token.jwtLifetime })
  },

  getBasicData({ identity, firstName, surname, name, email, photo, profileList }) {
    return { identity, firstName, surname, name, email, photo, profileList };
  }
};

module.exports = Identity;
