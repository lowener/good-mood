var http = require('http');
var PORT = process.env.PORT || 1234;
var PORT2 = 13377;


async function setupServer() {
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
	 }).listen(PORT);
}


setupServer()
