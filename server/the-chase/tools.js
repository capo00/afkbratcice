const REGEXP_XY = /[xy]/g;

const Tools = {
  generateId(length = 32) {
    length = Math.max(length, 8);
    let uuidCore = "x4xxxyxx";
    const additionalCharLength = length - uuidCore.length;
    for (let i = 0; i < additionalCharLength; ++i) {
      if (i % 2 === 0) {
        uuidCore = uuidCore + "x";
      } else {
        uuidCore = "x" + uuidCore;
      }
    }

    return uuidCore.replace(REGEXP_XY, (char) => {
      let r = (Math.random() * 16) % 16 | 0;
      return (char === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  },
};

module.exports = Tools;
