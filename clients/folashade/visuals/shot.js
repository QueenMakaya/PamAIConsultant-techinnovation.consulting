const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const b=await chromium.launch();for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.html')&&(!process.argv[2]||new RegExp(process.argv[2]).test(f)))){const n=f.replace('.html','');
const dim=n.startsWith('story')?[1080,1920]:n=='blog-header'?[1200,630]:[1080,1350];
const p=await b.newPage({viewport:{width:dim[0],height:dim[1]},deviceScaleFactor:1});await p.goto('file://'+path.resolve(f));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);
await p.screenshot({path:'folashade-'+n+'.png'});await p.close();}await b.close();})();
