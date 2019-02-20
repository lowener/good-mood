import * as tf from '@tensorflow/tfjs';
import {OOV_CHAR, padSequences} from './sequence_utils';
import * as fs from 'fs';

var http = require('http');

require('@tensorflow/tfjs-node')
	
const LOCAL_URLS = {
  model: './dist/resources/model.json',
  metadata: './dist/resources/metadata.json'
};

function _fetch(url) { 
	return new Promise((resolve, reject) => { 
		http.get(url, res => { 
			res.setEncoding("utf8"); 
			let body = ""; 
			res.on("data", data => { body += data; });
			res.on("end", () => { body = JSON.parse(body); resolve(body); });
			res.on('error', err => reject)
		});
	})
}



export async function loadHostedPretrainedModel(url) {
  try {
    const model = await tf.loadModel(url);
    return model;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Load metadata file stored at a remote URL.
 *
 * @return An object containing metadata as key-value pairs.
 */
export async function loadHostedMetadata(url) {
  try {
    const metadata = await fs.readFileSync(url);  // _fetch(url);
    return metadata;
  } catch (err) {
    console.error(err);
  }
}


class SentimentPredictor {
  /**
   * Initializes the Sentiment demo.
   */
  async init(urls) {
    this.urls = urls;
    this.model = await loadHostedPretrainedModel(urls.model);
    await this.loadMetadata();
    return this;
  }

  async loadMetadata() {
    const sentimentMetadata =
        await loadHostedMetadata(this.urls.metadata);
    this.indexFrom = sentimentMetadata['index_from'];
    this.maxLen = sentimentMetadata['max_len'];
    console.log('indexFrom = ' + this.indexFrom);
    console.log('maxLen = ' + this.maxLen);

    this.wordIndex = sentimentMetadata['word_index'];
    this.vocabularySize = sentimentMetadata['vocabulary_size'];
    console.log('vocabularySize = ', this.vocabularySize);
  }

  predict(text) {
    // Convert to lower case and remove all punctuations.
    const inputText =
        text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
    // Convert the words to a sequence of word indices.
    const sequence = inputText.map(word => {
      let wordIndex = this.wordIndex[word] + this.indexFrom;
      if (wordIndex > this.vocabularySize) {
        wordIndex = OOV_CHAR;
      }
      return wordIndex;
    });
    // Perform truncation and padding.
    const paddedSequence = padSequences([sequence], this.maxLen);
    const input = tf.tensor2d(paddedSequence, [1, this.maxLen]);

    const beginMs = performance.now();
    const predictOut = this.model.predict(input);
    const score = predictOut.dataSync()[0];
    predictOut.dispose();
    const endMs = performance.now();

    return {score: score, elapsed: (endMs - beginMs)};
  }
};

async function setupServer() {
	console.log('Loading server');
	try {
		const predictor = await new SentimentPredictor().init(LOCAL_URLS);
		console.log('Predictor loaded');
	} catch (e) {
		console.log(e);	
		console.log('Predictor NOT loaded correctly');
	}


	http.createServer(function(request,response){
		response.writeHead(200);
	 
		request.on('data',function(message){
			var res = predictor.predict(message);
			response.write(res);
		 });
	 
		 request.on('end',function(){
			response.end();
		 });
	 }).listen(1234);
}


setupServer()
