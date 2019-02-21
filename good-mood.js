const urlTab = [
  {"url": "lemonde.fr", "element": "article__content"},
  {"url": "nytimes.com", "element": "StoryBodyCompanionColumn"}
];

function goodMood() {
  var content_method = urlTab.filter(elem => window.location.host.includes(elem['url']));
  if (content_method.length === 0) {
    return;
  }
  try {
    const text = document.getElementsByClassName(content_method[0]['element'])[0].innerText
    var cleantext = ''
    text.split('').forEach(char => cleantext += (char.charCodeAt(0) <= 255 ? char : ' '));
    //console.log(cleantext);
    var hdrs = new Headers();
    hdrs.append('Content-Type', 'text/plain');
    const request = new Request('http://35.189.104.161:1234',
                                {method: 'POST',
                                 headers: hdrs,
                                 body: cleantext});

    fetch(request)
      .then(response => {
          console.log('Received response');
          if (response.status === 200)
          {
            return response.text();
          } else {
            console.log('Something went wrong');
          }})
      .then(results => results.split('\n').forEach(score => console.log(score)))
      .catch(e => console.log(e));



  } catch (e) {
    console.log(e);
  }
  console.log('Ending Good-Mood')
}

goodMood();
