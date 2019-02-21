const urlTab = [
  {"url": "lemonde.fr", "element": "article__content"},
  {"url": "nytimes.com", "element": "StoryBodyCompanionColumn"}
];
console.log('Starting Good-Mood')
var content_method = urlTab.filter(elem => window.location.host.includes(elem['url']));
if (content_method.length != 0) {
  try {
    const text = document.getElementsByClassName(content_method[0]['element'])[0].innerText
    var cleantext = ''
    text.split('').forEach(char => cleantext += (char.charCodeAt(0) <= 255 ? char : ' '));
    console.log(cleantext);
    var hdrs = new Headers();
    hdrs.append('input', '"' + cleantext + '"');
    const request = new Request('http://35.189.116.151:1234',
                                {method: 'POST',
                                 headers: hdrs});

    console.log(request.url);
    console.log(request.method);
    console.log(request.headers);
    fetch(request).then(response => {
          if (response.status === 200)
          {
            console.log(response.json());
          } else {
            console.log('Something went wrong');
          }
      });
  } catch (e) {
    console.log(e);
  }
} else {
  console.log('No match')
}
console.log('Ending Good-Mood')
