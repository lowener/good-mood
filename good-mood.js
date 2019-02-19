var a = document.getElementsByClassName('article__content')[0].innerText;

const request = new Request('35.185.210.44:4242',  {method: 'POST',
                            body: '{"text": "' + a + '"}'});

fetch(request).then(response =>
    if (response.status === 200)
    {
      console.log(response.json());
    } else {
      console.log('Something went wrong');
    }

)
