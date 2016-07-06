this.onmessage = function(e) {

    switch(e.data.cmd) {

        case 'init':
            init(e.data.inputFormat, e.data.inputCodec, e.data.inputSampleRate, e.data.inputChannels, e.data.outputFormat, e.data.outputCodec, e.data.outputSampleRate, e.data.outputChannels, e.data.outputBitRate, e.data.maxSeconds);
            break;
        
        case 'load':
            load(e.data.inputAudio);
            break;

        case 'flush':
            flush();
            break;

        case 'dispose':
            dispose();
            break;

        default:
            console.error('encoder.js unknown command ' + e.data.cmd);
    };
};

this.onerror = function(e) {
    console.error('encoder.js worker error: ' + e);
}

var init = function(inputFormat, inputCodec, inputSampleRate, inputChannels, outputFormat, outputCodec, outputSampleRate, outputChannels, outputBitRate, maxSeconds) {
    console.log('encoder.js init inputFormat:' + inputFormat + ', inputCodec:' + inputCodec + ', inputSampleRate:' + inputSampleRate + ', inputChannels:' + inputChannels
                            + ', outputFormat:' + outputFormat + ', outputCodec:' + outputCodec +', outputSampleRate:' + outputSampleRate + ', outputChannels:' + outputChannels
                            + ', outputBitRate:' + outputBitRate + ", maxSeconds:" + maxSeconds);

    Module.ccall(
        'init',
        null,
        ['string', 'string', 'number', 'number', 'string', 'string', 'number', 'number', 'number', 'number'],
        [inputFormat, inputCodec, inputSampleRate, inputChannels, outputFormat, outputCodec, outputSampleRate, outputChannels, outputBitRate, maxSeconds]
    );

    self.postMessage({'cmd':'initComplete'});
};

var load = function(inputAudio) {
    //console.log('encoder.js load inputAudio.byteLength:' + inputAudio.byteLength);

    var inputAudioArray = new Uint8Array(inputAudio);
    Module.ccall(
        'load',
        null,
        ['array', 'number'],
        [inputAudioArray, inputAudioArray.length]
    );

    self.postMessage({'cmd':'loadComplete'});
};

var flush = function() {
    console.log('encoder.js flush');

    var outputFormat = Module.ccall('get_output_format', 'string');
    var outputSampleRate = Module.ccall('get_output_sample_rate', 'number');
    var outputLength = Module.ccall('get_output_length', 'number');
    var outputAudioPointer = Module.ccall('flush', 'number');

    // https://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
    // https://github.com/kripken/emscripten/blob/master/src/preamble.js
    // http://stackoverflow.com/questions/16586273/how-do-i-access-the-emscripten-typed-array-from-javascript
    // http://stackoverflow.com/questions/18190859/trying-to-get-asm-js-to-return-a-typed-array
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array

    //var outputAudioArray = new Uint8Array(Module.HEAPU8.buffer, outputAudioPointer, outputLength);
    //var outputAudioArray = Module.HEAPU8.subarray(outputAudioPointer, outputAudioPointer + outputLength);
    var outputAudioArray = new Uint8Array(outputLength);
    for(i=0; i<outputLength; i++) {
        var outputByte = Module.getValue(outputAudioPointer + i);
        outputAudioArray.set([outputByte], i);
    }
    
    self.postMessage({
        'cmd':'flushComplete',
        'outputFormat':outputFormat,
        'outputSampleRate':outputSampleRate,
        'outputAudio':outputAudioArray.buffer},
        [outputAudioArray.buffer]
    );
};

var dispose = function() {
    console.log('encoder.js dispose');

    try {
        Module.ccall('dispose', null, ['number'], [0]);
        close();
    } catch(ex) {
        if(!(ex instanceof ExitStatus)) {
            throw ex;
        }
    }
};

//hack, necessary so memory optimizer can be found in browser
if(ENVIRONMENT_IS_WEB) {
    Module['memoryInitializerPrefixURL'] = '/js/';
};