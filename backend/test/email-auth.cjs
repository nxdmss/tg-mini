const { test } = require('node:test');
const assert = require('node:assert/strict');
const { WebAuthService } = require('../dist/auth/web-auth.service');
function setup() {
 const users = new Map(), challenges = new Map(), sent = [];
 const matches = (r,w) => (!w.email || r.email===w.email) && (!w.purpose || r.purpose===w.purpose) && (!w.codeHash || r.codeHash===w.codeHash) && (!w.sentAt || r.sentAt<w.sentAt.lt) && (!w.expiresAt || r.expiresAt>w.expiresAt.gt) && (!w.attempts || r.attempts<w.attempts.lt);
 const db={emailChallenge:{
  upsert:async ({where,create})=>{const k=JSON.stringify(where.email_purpose);if(!challenges.has(k))challenges.set(k,create)},
  updateMany:async ({where,data})=>{let count=0;for(const r of challenges.values())if(matches(r,where)){count++;for(const [k,v] of Object.entries(data))r[k]=v?.increment?r[k]+v.increment:v;}return {count}},
  findUnique:async ({where})=>challenges.get(JSON.stringify(where.email_purpose)),
  deleteMany:async ({where})=>{let count=0;for(const [k,r] of challenges)if(matches(r,where)){count++;challenges.delete(k)}return {count}},
 },user:{
  findUnique:async ({where})=>where.email?users.get(where.email):[...users.values()].find(u=>u.id===where.id),
  create:async ({data})=>{const u={...data,id:'u1',sessionVersion:0,role:'USER'};users.set(u.email,u);return u},
  update:async ({where,data})=>{const u=users.get(where.email);Object.assign(u,{...data,sessionVersion:u.sessionVersion+1});return u},
 }};
 db.$transaction=async fn=>{const snapshot=structuredClone([...challenges]);try{return await fn(db)}catch(e){challenges.clear();for(const [k,v]of snapshot)challenges.set(k,v);throw e}};
 const jwt={signAsync:async p=>JSON.stringify(p),verifyAsync:async s=>JSON.parse(s)};
 const service=new WebAuthService(db,jwt,{sendCode:async(email,code,purpose)=>sent.push({email,code,purpose})});
 return {service,users,challenges,sent};
}
const dto={email:' TEST@example.com ',password:'test-password-123',name:'Test'};
test('account and token only issued after email proof; code is single use',async()=>{
 const s=setup();assert.deepEqual(await s.service.register(dto),{sent:true});assert.equal(s.users.size,0);
 assert.equal([...s.challenges.values()][0].codeHash.includes(s.sent[0].code),false);
 await assert.rejects(s.service.verifyRegistration('test@example.com','000000'));
 const auth=await s.service.verifyRegistration('test@example.com',s.sent[0].code);
 assert.ok(auth.accessToken);assert.ok(s.users.get('test@example.com').emailVerifiedAt);
 await assert.rejects(s.service.verifyRegistration('test@example.com',s.sent[0].code));
});
test('expiry, attempt cap and resend cooldown',async()=>{
 const s=setup();await s.service.register(dto);await assert.rejects(s.service.register(dto),/минуту/);
 for(let i=0;i<5;i++)await assert.rejects(s.service.verifyRegistration('test@example.com','000000'));
 await assert.rejects(s.service.verifyRegistration('test@example.com',s.sent[0].code));
 assert.equal(s.users.size,0);
 const t=setup();await t.service.register(dto);[...t.challenges.values()][0].expiresAt=new Date(0);
 await assert.rejects(t.service.verifyRegistration('test@example.com',t.sent[0].code));
});
test('reset changes password, rejects old session and cannot use registration code',async()=>{
 const s=setup();await s.service.register(dto);
 const auth=await s.service.verifyRegistration('test@example.com',s.sent[0].code);
 await s.service.forgotPassword('test@example.com');
 await assert.rejects(s.service.resetPassword('test@example.com',s.sent[0].code,'new-password-123'));
 await s.service.resetPassword('test@example.com',s.sent[1].code,'new-password-123');
 await assert.rejects(s.service.getUserFromToken(auth.accessToken));
 await assert.rejects(s.service.login({email:'test@example.com',password:dto.password}));
 assert.ok((await s.service.login({email:'test@example.com',password:'new-password-123'})).accessToken);
 assert.deepEqual(await s.service.forgotPassword('missing@example.com'),{sent:true});
});
