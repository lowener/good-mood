import * as tf from '@tensorflow/tfjs';
import {OOV_CHAR, padSequences} from './sequence_utils';
import * as fs from 'fs';

var http = require('http');
var qs = require('querystring');
var moment = require('moment');

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
    const model = await tf.loadModel('file:///home/lowener/good-mood/sentiment-server/dist/resources/model.json');
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
    const metadata = await fs.readFileSync(url, "utf-8");  // _fetch(url);

    return JSON.parse(metadata);
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
        text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ').filter(word => word.length > 1);
    // Convert the words to a sequence of word indices.
    const sequence = inputText.map(word => {
      let wordIndex = this.wordIndex[word] + this.indexFrom;
      if (wordIndex > this.vocabularySize) {
        wordIndex = OOV_CHAR;
      }
      if (isNaN(wordIndex)) { 
	      return 0;
      }
      return wordIndex;
    });
    // Perform truncation and padding.
    const paddedSequence = padSequences([sequence], this.maxLen);
    const input = tf.tensor2d(paddedSequence, [1, this.maxLen]);

    const beginMs = moment().valueOf();
    const predictOut = this.model.predict(input);
    const score = predictOut.dataSync()[0];
    predictOut.dispose();
    const endMs = moment().valueOf();

    return {score: score, elapsed: (endMs - beginMs)};
  }
};

async function setupServer() {
	console.log('Loading server');
	var predictor = '';
	try {
		predictor = await new SentimentPredictor().init(LOCAL_URLS);
		console.log('Predictor loaded');
	} catch (e) {
		console.log(e);	
		console.log('Predictor NOT loaded correctly');
	}


	http.createServer(function(request,response){
		if (request.method == 'POST') {
			console.log('New connection');
			var post = '';
	 
			request.on('data',function(message){
				post += message;
				if (post.length > 1e6) {
					request.connection.destroy();
				}
			 });
	 
			 request.on('end',function(){
				const body = post.split('\n');

				console.log(body);
				var res = body.map(phrase => predictor.predict(phrase));

				response.writeHead(200);
				res.forEach(cell => response.write(cell['score'].toString() + '\n'));
				response.end();
				console.log(res);
			 });
		} else {
			response.writeHead(405);
		}
	 }).listen(1234);
}


setupServer()
