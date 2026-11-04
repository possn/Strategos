const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const playwright=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright' : 'playwright');
(async()=>{
 const server=spawn('python3',['-m','http.server','8080','--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  for(let attempt=0;attempt<50;attempt++){try{if((await fetch('http://127.0.0.1:8080')).ok)break;}catch{} await new Promise(r=>setTimeout(r,100));}
  browser=await playwright.webkit.launch({headless:true});
  const page=await browser.newPage({...playwright.devices['iPhone 13']});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8080');
  await page.getByText('Tap to begin',{exact:true}).click();
  for(let i=0;i<2;i++)await page.getByRole('button',{name:'CONTINUE',exact:true}).click();
  await page.locator('#onboarding-name').fill('Teste');
  await page.getByRole('button',{name:'BEGIN',exact:true}).click();
  await page.locator('.healthspan-foundation > summary').click();
  await page.getByText('Corpo capaz',{exact:true}).click();
  assert.equal(await page.locator('.healthspan-domain a').count(),6);
  assert.equal(await page.locator('.moment-action').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('.moment-action').click();
  const answers=[['sleep','3'],['energy','2'],['time','15'],['challenge','body'],['soreness','none'],['emotionalLoad','usual']];
  for(const [key,value] of answers)await page.locator(`button[data-key="${key}"][data-value="${value}"]`).click();
  await page.locator('.route-today').waitFor();
  await page.locator('.moment-action').click();
  await page.locator('.judgement-sentence').waitFor();
  await page.locator('.healthspan-practice summary').click();
  assert.equal(await page.locator('.healthspan-practice a').count(),1);
  await page.getByRole('button',{name:'Return to Today',exact:true}).click();
  await page.reload();
  await page.getByText('Tap to begin',{exact:true}).click();
  await page.locator('.route-today').waitFor();
  assert.equal(await page.locator('.moment-action').count(),1);
  assert.deepEqual(errors,[]);
  console.log('PASS: WebKit iPhone onboarding, education, six signals, judgement, rationale and reload.');
 } finally {if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
