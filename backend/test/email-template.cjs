const {test} = require('node:test');
const assert = require('node:assert/strict');
const {inflateSync} = require('node:zlib');
const nodemailer = require('nodemailer');
const {renderCodeImage, renderEmailImage, CODE_IMAGE_WIDTH, CODE_IMAGE_HEIGHT} = require('../dist/auth/email/code-image');
const {createCodeEmail} = require('../dist/auth/email/code-email');

function decode(png) {
  assert.equal(png.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
  const data=[];
  for(let pos=8; pos<png.length;) {
    const length=png.readUInt32BE(pos);
    const type=png.toString('ascii',pos+4,pos+8);
    if(type==='IHDR') {
      assert.equal(png.readUInt32BE(pos+8), CODE_IMAGE_WIDTH);
      assert.equal(png.readUInt32BE(pos+12), CODE_IMAGE_HEIGHT);
    }
    if(type==='IDAT') data.push(png.subarray(pos+8,pos+8+length));
    pos+=12+length;
  }
  return inflateSync(Buffer.concat(data));
}

test('all ten digits render into distinct valid opaque code images',()=>{
  const images=new Set();
  for(const digit of '0123456789') {
    const png=renderCodeImage(digit.repeat(6));
    const pixels=decode(png);
    assert.equal(pixels.length,(CODE_IMAGE_WIDTH+1)*CODE_IMAGE_HEIGHT);
    assert.equal(pixels[1],255);
    assert.ok(pixels.includes(0));
    images.add(png.toString('base64'));
  }
  assert.equal(images.size,10);
  assert.throws(()=>renderCodeImage('<img/>'));
  assert.throws(()=>renderCodeImage('12345'));
});

test('template keeps the real expiry, text fallback and inline matching image',()=>{
  const email=createCodeEmail('120589',new Date('2026-10-30T08:10:00Z'));
  assert.match(email.text,/120589/);
  assert.match(email.html,/alt="120589 · 10 МИНУТ/);
  assert.match(email.html,/ДО 11:10 МСК/);
  assert.match(email.html,/10 МИНУТ/);
  assert.doesNotMatch(email.html,/<script|https?:\/\//);
  assert.equal(email.attachments[0].contentDisposition,'inline');
  assert.ok(email.html.includes('cid:'+email.attachments[0].cid));
  assert.deepEqual(email.attachments[0].content,renderEmailImage('120589', '11:10'));
  assert.throws(()=>createCodeEmail('120589',new Date('invalid')));
});

test('Nodemailer includes the code image in a self-contained multipart message',async()=>{
  const transport=nodemailer.createTransport({streamTransport:true,buffer:true,disableFileAccess:true,disableUrlAccess:true});
  const result=await transport.sendMail({from:'test@example.com',to:'recipient@example.com',subject:'SWAGYSTAN',...createCodeEmail('120589',new Date('2026-10-30T08:10:00Z'))});
  const raw=result.message.toString();
  assert.match(raw,/multipart\/alternative/);
  assert.match(raw,/multipart\/related/);
  assert.match(raw,/Content-ID: <verification-code@swagystan.ru>/);
  assert.match(raw,/Content-Type: image\/png/);
  transport.close();
});


test('full email canvas includes code and deadline on opaque white pixels',()=>{
  const image=renderEmailImage('123456','14:03');
  const width=image.readUInt32BE(16),height=image.readUInt32BE(20);
  assert.equal(width,1040);assert.equal(height,720);
  const chunks=[];
  for(let pos=8;pos<image.length;){
    const size=image.readUInt32BE(pos);
    if(image.toString('ascii',pos+4,pos+8)==='IDAT') chunks.push(image.subarray(pos+8,pos+8+size));
    pos+=12+size;
  }
  const pixels=inflateSync(Buffer.concat(chunks)),stride=width+1;
  for(let y=0;y<height;y++){
    assert.equal(pixels[y*stride],0);
    assert.equal(pixels[y*stride+1],255);
    assert.equal(pixels[y*stride+width],255);
  }
  for(const [start,end] of [[160,356],[430,478],[494,542]]) {
    assert.ok(pixels.subarray(start*stride,end*stride).some((v,i)=>i%stride!==0&&v===0));
  }
  assert.notDeepEqual(image,renderEmailImage('123456','14:04'));
});
