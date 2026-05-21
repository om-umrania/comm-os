class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Buffer ~256ms of audio at 16kHz before posting (matches original 4096-sample ScriptProcessor)
    this._buffer = new Float32Array(4096);
    this._writeIndex = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._writeIndex++] = channel[i];
      if (this._writeIndex === this._buffer.length) {
        this.port.postMessage(this._buffer.slice());
        this._writeIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
