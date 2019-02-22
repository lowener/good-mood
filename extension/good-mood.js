const urlTab = [
  {"url": "lemonde.fr", "element": "article__content"},
  {"url": "nytimes.com", "element": "StoryBodyCompanionColumn"}
];

function apply_results(results, panel) {
  var finalResult = results.split('\n')
                           .filter(e => e.length > 0)
                           .map(e => parseFloat(e))
                           .reduce((acc, el) => acc + el) / (results.split('\n').length - 1);

  console.log('final: ' + finalResult.toString());

  const intensity_R = ((1 - finalResult) * 255).toString(16).split('.')[0];
  const intensity_G = ((finalResult) * 255).toString(16).split('.')[0];
  color = intensity_R.toString() + intensity_G.toString() + '00';
  console.log(color);
  panel.style.borderLeft = "5px solid #" + color;
}


function processText(panel) {
  const text = panel.innerText;
  var cleantext = ''
  text.split('').forEach(char => cleantext += (char.charCodeAt(0) <= 255 ? char : ' '));
  //console.log(cleantext);
  var hdrs = new Headers();
  hdrs.append('Content-Type', 'text/plain');
  const request = new Request('http://35.189.107.180:1234',
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
    .then(results => apply_results(results, panel))
    .catch(e => console.log(e));
}


function goodMood() {
  const content_method = urlTab.filter(elem => window.location.host.includes(elem['url']));
  if (content_method.length === 0) {
    return;
  }
  try {
    const panels = document.getElementsByClassName(content_method[0]['element']);
    var text = '';
    for (let panel of panels) {
      processText(panel);
    }
  } catch (e) {
    console.log(e);
  }
  console.log('Ending Good-Mood')
}

goodMood();
