// Configuration gate only; never claims to replace hosted acceptance tests or App Review.
const failures=[];
const required=['EXPO_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY','EXPO_PUBLIC_INVITE_URL','APP_STORE_URL'];
for(const name of required)if(!process.env[name])failures.push(`${name} is missing`);
for(const name of ['EXPO_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_INVITE_URL']){
 if(process.env[name])try{if(new URL(process.env[name]).protocol!=='https:')throw 0;}catch{failures.push(`${name} must use HTTPS`);}
}
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(key&&!key.startsWith('sb_publishable_')){
 try{if(JSON.parse(Buffer.from(key.split('.')[1]??'','base64url').toString()).role!=='anon')throw 0;}
 catch{failures.push('Use a publishable or legacy anon key, never a secret/service-role key');}
}
if(process.env.APP_STORE_URL&&!/^https:\/\/apps\.apple\.com\//.test(process.env.APP_STORE_URL))failures.push('APP_STORE_URL must be the real Apple listing');
if(Number(process.versions.node.split('.')[0])!==24)failures.push('Use Node 24 LTS for the release toolchain');
if(failures.length){console.error('Release configuration is incomplete:\n'+failures.map(x=>`- ${x}`).join('\n'));process.exitCode=1;}
else console.log('Configuration gate passed. Hosted acceptance, moderation, backups, and TestFlight checks are still required.');
