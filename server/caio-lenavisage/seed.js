module.exports = [
  {
    type: "hair",
    name: "Vlasy",
    woman: {
      name: "Žena",
      cut: { name: "Střih", price: { short: 340, middle: 340, long: 340 } },
      care: { name: "Péče", price: { short: 240, middle: 340, long: 420 } },
      melodies: { name: "Melíry", price: { short: 340, middle: 450, long: 660 }, unit: { volume: 30, price: 90 } },
      hairSpray: { name: "Přeliv", price: { short: 290, middle: 390, long: 420 }, unit: { volume: 15, price: 90 } },
      color: { name: "Barva", price: { short: 290, middle: 390, long: 420 }, unit: { volume: 15, price: 60 } },
      duoMelodies: { name: "Duo - Melíry", price: { short: 390, middle: 510, long: 580 }, unit: { volume: 30, price: 90 } },
      duoColor: { name: "Duo - Barva", price: { short: 0, middle: 0, long: 0 }, unit: { volume: 15, price: 60 } },
      bondUltim: { name: "Bond Ultim", unit: { volume: 4, price: 360 } },
    },
    child: {
      name: "Dítě",
      cut: { name: "Střih", price: { short: 150, long: 150 } },
      care: { name: "Péče", price: 240 },
    },
    man: {
      name: "Muž",
      cut: { name: "Střih", price: 180 },
      care: { name: "Péče", price: 60 },
    },
  },
  {
    type: "wedding",
    name: "Svatba",
    bride: {
      package: { name: "Balíček", price: 4500 },
      hairstyleMakeup: { name: "Účes + líčení", price: 3500 },
      hairstyle: { name: "Účes", price: 1900 },
      hairstyleExam: { name: "Účes + zkouška", price: 2400 },
      makeup: { name: "Líčení", price: 1900 },
      makeupExam: { name: "Líčení + zkouška", price: 2400 },
    },
    guest: {
      hairstyle: { name: "Účes", price: 900 },
      hairstyleMin: { name: "Úprava vlasů", price: 500 },
      makeup: { name: "Líčení", price: 900 },
    },
    journey: { name: "Cesta", price: 20, unit: "km" },
  },
  {
    type: "eyelash",
    name: "Řasy",
    new: { name: "Nové", price: 1200 },
    renewal: { name: "Doplnění", price: 840 },
  },
  {
    type: "event",
    name: "Společenská akce",
    hairstyle: { name: "Účes", price: 1200 },
    makeup: { name: "Líčení", price: 1100 },
  },
];
