const video=document.querySelector('#video');
const frame=document.querySelector('#cameraFrame');
const idle=document.querySelector('#cameraIdle');
const shutter=document.querySelector('#shutter');
const shutterText=document.querySelector('#shutterText');
const prompt=document.querySelector('#prompt');
const progress=[...document.querySelectorAll('.shot-progress span')];
const canvas=document.querySelector('#strip');
const ctx=canvas.getContext('2d');
const countdown=document.querySelector('#countdown');
const download=document.querySelector('#download');
const resetButton=document.querySelector('#resetButton');
const error=document.querySelector('#error');
const template=new Image(); template.src='assets/strip-template.png';
const shots=[];
const slots=[{x:43,y:67,w:514,h:312},{x:43,y:408,w:514,h:312},{x:43,y:748,w:514,h:314}];
let stream=null,started=false,busy=false,finished=false;
function drawCover(context,source,slot){
 const sw=source.width||source.videoWidth,sh=source.height||source.videoHeight;
 const targetRatio=slot.w/slot.h,sourceRatio=sw/sh;
 let sx=0,sy=0,cw=sw,ch=sh;
 if(sourceRatio>targetRatio){cw=sh*targetRatio;sx=(sw-cw)/2}else{ch=sw/targetRatio;sy=(sh-ch)/2}
 context.drawImage(source,sx,sy,cw,ch,slot.x,slot.y,slot.w,slot.h);
}
function render(){
 if(!template.complete||!template.naturalWidth)return;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.drawImage(template,0,0,600,1500);
 // The original black windows become transparent in the supplied art; keep them dark until a frame is captured.
 slots.forEach((slot,i)=>{
   if(shots[i])drawCover(ctx,shots[i],slot);
   else {ctx.fillStyle='#111311';ctx.fillRect(slot.x,slot.y,slot.w,slot.h)}
 });
 // Re-layer the artwork so its little stickers sit naturally over the photo edges.
 ctx.drawImage(template,0,0,600,1500);
}
template.onload=render;
function updateProgress(){
 progress.forEach((dot,i)=>{dot.classList.toggle('done',i<shots.length);dot.classList.toggle('current',i===shots.length&&!finished)});
}
function takeSnapshot(){
 const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;
 const cctx=c.getContext('2d');cctx.translate(c.width,0);cctx.scale(-1,1);cctx.drawImage(video,0,0,c.width,c.height);
 return c;
}
async function startCamera(){
 error.textContent='';
 try{
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
  video.srcObject=stream; await video.play(); started=true; frame.classList.add('is-live'); idle.hidden=true;
  shutterText.textContent='Take photo 1 of 3'; prompt.textContent='Get comfy — your first frame is up next.';
 }catch(e){
  error.textContent=e.name==='NotAllowedError'?'Camera access was blocked. Allow camera access to take your strip.':'Could not find a camera. Check your connection and try again.';
 }
}
function tick(n){return new Promise(resolve=>{
 countdown.textContent=String(n); countdown.classList.remove('show'); void countdown.offsetWidth; countdown.classList.add('show');
 setTimeout(()=>{countdown.classList.remove('show');resolve()},760);
})}
async function capture(){
 if(busy)return;busy=true;shutter.disabled=true;error.textContent='';
 for(let n=3;n>0;n--)await tick(n);
 shots.push(takeSnapshot());render();updateProgress();busy=false;shutter.disabled=false;
 if(shots.length===3){
  finished=true;shutter.hidden=true;resetButton.hidden=false;download.hidden=false;
  download.href=canvas.toDataURL('image/png');prompt.textContent='That’s a little piece of today.';
 }else{
  shutterText.textContent='Take photo '+(shots.length+1)+' of 3';prompt.textContent=['','One down — ready for another?','Two down — one more!'][shots.length];
 }
}
function reset(){shots.length=0;finished=false;render();updateProgress();download.hidden=true;shutter.hidden=false;resetButton.hidden=true;shutterText.textContent='Take photo 1 of 3';prompt.textContent='Snap and celebrate with the grooms!'}
shutter.addEventListener('click',()=>{if(!started)startCamera();else capture()});
resetButton.addEventListener('click',reset);
window.addEventListener('beforeunload',()=>stream?.getTracks().forEach(track=>track.stop()));
render();updateProgress();