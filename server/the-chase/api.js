const TheChase = require("./the-chase");

let theChaseMap = {};

const API = {
  "theChase/game/init": {
    method: "post",
    fn: () => {
      const theChase = new TheChase();
      const id = theChase.id;
      theChaseMap[id] = theChase;

      const dtoOut = { id };
      return dtoOut;
    }
  },
  "theChase/game/get": {
    method: "get",
    fn: ({ id }) => {
      const theChase = theChaseMap[id];

      const dtoOut = theChase.toObject();
      return dtoOut;
    }
  },
  "theChase/game/setHunter": {
    method: "post",
    fn: ({ id, hunterId }) => {
      const theChase = theChaseMap[id];
      theChase.selectHunter(hunterId);

      const dtoOut = theChase.toObject();
      return dtoOut;
    }
  },
  "theChase/game/destroy": {
    method: "post",
    fn: ({ id }) => {
      delete theChaseMap[id];

      const dtoOut = { id, destroyed: true };
      return dtoOut;
    }
  },

  "theChase/player/list": {
    method: "get",
    fn: ({ gameId }) => {
      const theChase = theChaseMap[gameId];

      const dtoOut = { gameId: theChase.id, itemList: theChase.playerList };
      return dtoOut;
    }
  },
  "theChase/player/create": {
    method: "post",
    fn: ({ gameId, name }) => {
      const theChase = theChaseMap[gameId];
      const player = theChase.addPlayer(name);

      const dtoOut = { gameId: theChase.id, ...player };
      return dtoOut;
    }
  },
  "theChase/player/get": {
    method: "get",
    fn: ({ gameId, id }) => {
      const theChase = theChaseMap[gameId];
      const player = theChase.getPlayer(id);

      const dtoOut = { gameId: theChase.id, ...player };
      return dtoOut;
    }
  },
  "theChase/player/set": {
    method: "post",
    fn: ({ gameId, id, ...playerData }) => {
      const theChase = theChaseMap[gameId];
      const player = theChase.setPlayer(id, playerData);

      const dtoOut = { gameId: theChase.id, ...player };
      return dtoOut;
    }
  },

  "theChase/round2/init": {
    method: "post",
    fn: ({ gameId, ...data }) => {
      const theChase = theChaseMap[gameId];
      const round2 = theChase.createRound2(data);

      const dtoOut = { gameId: theChase.id, ...round2 };
      return dtoOut;
    }
  },
  "theChase/round2/load": {
    method: "get",
    fn: ({ gameId, ...data }) => {
      const theChase = theChaseMap[gameId];
      const round2 = theChase.loadRound2(data);

      const dtoOut = { gameId: theChase.id, ...round2 };
      return dtoOut;
    }
  },
  "theChase/round2/get": {
    method: "get",
    fn: ({ gameId, id, hunterId }) => {
      const theChase = theChaseMap[gameId];
      const round2 = theChase.getRound2(id);

      const dtoOut = { gameId: theChase.id, ...round2 };

      if (hunterId) {
        const player = theChase.getPlayer(round2.playerId);
        dtoOut.player = {
          name: player.name,
          amount: player.amount,
        };
      }

      return dtoOut;
    }
  },
  "theChase/round2/setOffer": {
    method: "post",
    fn: ({ gameId, id, offer }) => {
      const theChase = theChaseMap[gameId];
      const round2 = theChase.setRound2(id, { offer });

      const dtoOut = { gameId: theChase.id, ...round2 };
      return dtoOut;
    }
  },
  "theChase/round2/confirmOffer": {
    method: "post",
    fn: ({ gameId, id, amount }) => {
      const theChase = theChaseMap[gameId];
      const { playerId } = theChase.getRound2(id);
      const player = theChase.getPlayer(playerId);
      const round2 = theChase.setRound2(id, {
        amount,
        hunterStep: 7,
        playerStep: amount > player.amount ? 5 : amount < player.amount ? 3 : 4
      });

      const dtoOut = { gameId: theChase.id, ...round2 };
      return dtoOut;
    }
  },
  "theChase/round2/loadQuestion": {
    method: "post",
    fn: ({ gameId, id }) => {
      const theChase = theChaseMap[gameId];
      const round2 = theChase.createRound2Question(id);

      const dtoOut = { gameId: theChase.id, ...round2 };
      return dtoOut;
    }
  },
  "theChase/round2/setAnswer": {
    method: "post",
    fn: ({ gameId, id, hunterId, playerId, questionId, answer }) => {
      const theChase = theChaseMap[gameId];
      const round2 = theChase.setRound2Answer(id, { [hunterId ? "hunterAnswer" : "playerAnswer"]: answer });

      const dtoOut = { gameId: theChase.id, ...round2 };
      return dtoOut;
    }
  },

  "theChase/round1/loadQuestions": {
    method: "get",
    fn: () => {
      const questionList = Array(100).fill().map(() => {
        const x = Math.round(Math.random() * 10);
        const y = Math.round(Math.random() * 10);
        return {
          question: `Kolik je ${x} + ${y}?`,
          answer: x + y
        };
      });

      const dtoOut = { itemList: questionList };
      return dtoOut;
    }
  },

  "theChase/round3/loadQuestions": {
    method: "get",
    fn: () => {
      const questionList = Array(100).fill().map(() => {
        const x = Math.round(Math.random() * 10);
        const y = Math.round(Math.random() * 10);
        return {
          question: `Kolik je ${x} * ${y}?`,
          answer: x * y
        };
      });

      const dtoOut = { itemList: questionList };
      return dtoOut;
    }
  },
}

module.exports = API;
