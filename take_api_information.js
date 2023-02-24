const puppeteer = require('puppeteer');
const fs = require('fs');
const { runInNewContext } = require('vm');


(async () => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
    const page = (await browser.pages())[0];


    // データを取得するwebsiteのURL 
    const urlPath ="https://the target website path/*"
    
   
    // csvに出力したいAPI 前方一致 取得したいパスを入れる
   const url_array = [
   "https://https://the target website path/hogehoge", 
   "https://https://the target website path/hugahuga",
   "https://https://the target website path/pepapepa",

];
    // ファイル名　数と位置はurl_arrayと一致させる
   const file_name_array = [
    "hoge_file",
    "fuga_file",  
    "pepa_file",
];

    try {
        const client = await page.target().createCDPSession();
        var newLine = '\r\n';
        

        await client.send('Fetch.enable', { 'patterns': [{ 'urlPattern': urlPath, 'requestStage': 'Response' }] });
        client.on('Fetch.requestPaused', async (requestEvent) => {
            const { requestId, responseStatusCode, responseHeaders } = requestEvent;

            try {
                if (!responseStatusCode) throw `responseStatusCode: ${responseStatusCode}`;
                const response = await client.send('Fetch.getResponseBody', { requestId });

                if (response.base64Encoded) {
                      
                    url_array.forEach((value, index, url_array ) => {
                        if(!requestEvent.request.url.indexOf(value)){
                            
                          
                            console.log(new Buffer.from(response.body, 'base64').toString('utf-8'));
                            let text = new Buffer.from(response.body, 'base64').toString('utf-8')
                            var json_data = JSON.parse(text);
                            let text_name = file_name_array[index] 
                            
                            text = JSON.stringify(json_data)+ newLine
                            fs.appendFileSync(text_name +'.json', text );  
                        }
                    });
                } else {

                    url_array.forEach((value, index, url_array ) => {
                        if(!requestEvent.request.url.indexOf(value)){
                            // 上のURLパスに該当する場合のみcsv出力する
                            console.log(response.body);
                            let text = response.body
                            var json_data = JSON.parse(text);
                            
                            
                            let text_name = file_name_array[index] 
                            text = JSON.stringify(json_data)+ newLine
                            fs.appendFileSync(text_name +'.json', text);  
                        }
                    });
                }

                await client.send('Fetch.fulfillRequest', { requestId, responseCode: responseStatusCode, responseHeaders, 'body': response.body });
            } catch {
                await client.send('Fetch.continueRequest', { requestId });
            }
        });

        // wait for close
        await new Promise((resolve, reject) => page.on('close', resolve));
    } finally {
        (await browser.pages()).forEach(p => p.close());
        browser.close();
    }
    
})();

