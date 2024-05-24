import { Utils } from "uu5g05";

class Speech {
  constructor() {
    this._synth = window.speechSynthesis;
    this._synth.onvoiceschanged = () => this._loadVoices();
  }

  speak(text, { lang, voiceUri, rate, onEnd } = {}) {
    const utterThis = new SpeechSynthesisUtterance(text);

    if (voiceUri) {
      utterThis.voice = this._voices.find((voice) => voice.voiceURI === voiceUri);
    }
    if (!utterThis.voice && lang) {
      utterThis.voice = Utils.Language.getItem(this._lsiVoices, lang);
    }
    if (rate) {
      utterThis.rate = rate;
    }

    if (onEnd) utterThis.addEventListener("end", onEnd);

    this._synth.speak(utterThis);
  }

  stop() {
    this._synth.cancel();
  }

  pause() {
    this._synth.pause();
  }

  resume() {
    this._synth.resume();
  }

  _loadVoices() {
    this._voices = this._synth.getVoices();

    this._lsiVoices = {};
    this._voices.forEach((voice) => {
      this._lsiVoices[voice.lang.toLowerCase()] ||= voice;
    });
  }
}

export { Speech };
export default new Speech();
