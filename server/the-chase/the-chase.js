const Tools = require("../the-chase/tools");

function generateQuestion2List() {
  // return Array(100).fill().map(() => {
  //   const x = Math.round(Math.random() * 1000);
  //   const y = Math.round(Math.random() * 1000);
  //   return {
  //     id: Tools.generateId(),
  //     question: `Kolik je ${x} + ${y}?`,
  //     answerList: [
  //       { answer: (x - Math.round(Math.random() * 1000)) + "" },
  //       { answer: (x + y) + "" },
  //       { answer: (x + Math.round(Math.random() * 1000)) + "", hunterDisabled: true },
  //     ],
  //     correctAnswer: 1,
  //   };
  // });

  const questionList = require("./questions2.json");
  const shuffledList = questionList.sort(() => Math.random() - 0.5);

  return shuffledList.slice(0, 100);
}

class TheChase {

  constructor() {
    this._id = Tools.generateId();
    this._playerList = [];
    this._hunterId = null;
    this._round2Map = {};
  }

  get id() {
    return this._id;
  }

  get playerList() {
    return this._playerList;
  }

  getPlayer(id) {
    const player = this._playerList.find((player) => player.id === id);
    return player;
  }

  setPlayer(id, data) {
    const playerIndex = this._playerList.findIndex((player) => player.id === id);
    this._playerList.splice(playerIndex, 1, { ...this._playerList[playerIndex], ...data });
    return this._playerList[playerIndex];
  }

  addPlayer(name) {
    const player = { id: Tools.generateId(), name };
    this._playerList.push(player);
    return player;
  }

  selectHunter(id) {
    this._hunterId = id;
    let hunter;
    this.playerList.forEach((player) => {
      player.hunter = player.id === id;
      if (player.hunter) hunter = player;
    });
    return hunter;
  }

  setPlayerAmount(id, amount) {
    const player = this.playerList.find((p) => p.id === id);
    player.amount = amount;
    return player;
  }

  createRound2(data) {
    const id = Tools.generateId();
    const player = this.getPlayer(data.playerId);
    this._round2Map[id] = { id, _questionIndex: -1, ...data, amount: player.amount };
    return this._round2Map[id];
  }

  loadRound2({ playerId, hunterId }) {
    const round2 = Object.values(this._round2Map).find(
      (round2) => round2.playerId === playerId || (round2.hunterId === hunterId && !round2.offer)
    );
    return round2;
  }

  getRound2(id) {
    const { _questionList, _questionIndex, ...round2 } = this._round2Map[id];
    return round2;
  }

  setRound2(id, data) {
    const round2 = {...this._round2Map[id], ...data};
    if (data.question) {
      round2.question = {...round2.question, ...data.question};
    }

    this._round2Map[id] = round2;
    return this.getRound2(id);
  }

  createRound2Question(id) {
    const round2 = this._round2Map[id];

    if (!round2._questionList) {
      round2._questionList = generateQuestion2List();
      round2._questionIndex = -1;
    }

    round2._questionIndex++;
    round2.question = round2._questionList[round2._questionIndex];

    this._round2Map[id] = round2;
    return this.getRound2(id);
  }

  setRound2Answer(id, data) {
    const round2 = this._round2Map[id];
    const key = data.hunterAnswer ? "hunterStep" : "playerStep";
    round2[key] += ((data.hunterAnswer || data.playerAnswer) === round2.question.correctAnswer ? -1 : 0);
    round2.question = { ...round2.question, ...data };

    this._round2Map[id] = round2;
    return this.getRound2(id);
  }

  toObject() {
    return {
      id: this.id,
      playerList: this._playerList.map(({ id }) => id),
      hunterId: this._hunterId,
    }
  }
}

module.exports = TheChase;
