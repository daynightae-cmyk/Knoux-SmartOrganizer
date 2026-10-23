'use strict';
/** Native-folder-granted Studio IPC. No arbitrary renderer filesystem access. */
const crypto=require('node:crypto'),path=require('node:path'),fs=require('node:fs/promises');
const {z}=require('zod');
const {scanFolder,query,validateSource,inside,KEYS}=require('./folder-inventory.cjs');
const CH={pick:'knoux:studio:pick',sources:'knoux:studio:sources',remove:'knoux:studio:remove',scan:'knoux:studio:scan',cancel:'knoux:studio:cancel',query:'knoux:studio:query',reveal:'knoux:studio:reveal',event:'knoux:studio:event'};
const uid=z.string().uuid();
const scanSchema=z.object({sourceId:uid,operationId:uid}).strict();
const querySchema=z.object({inventoryId:uid,category:z.enum(['all',...KEYS]).default('all'),search:z.string().max(256).default(''),sort:z.enum(['name','size','modified','type']).default('name'),desc:z.boolean().default(false),offset:z.number().int().min(0).default(0),limit:z.number().int().min(1).max(120).default(48)}).strict();
const revealSchema=z.object({inventoryId:uid,fileId:z.number().int().min(0)}).strict();
function registerStudioIpc({ipcMain,dialog,shell,windowProvider,settingsProvider=null}){
 const sources=new Map(),inventories=new Map(),active=new Map();
 const owner=(e)=>e.sender.id,own=(r,e)=>r&&r.owner===owner(e);
 const send=(e,operationId,phase,more={})=>{if(!e.sender.isDestroyed())e.sender.send(CH.event,{operationId,phase,at:new Date().toISOString(),...more})};
 const handle=(ch,fn)=>ipcMain.handle(ch,fn);
 const safe=(fn)=>async(e,raw)=>{try{return await fn(e,raw)}catch(error){throw Error(String(error?.message||'Studio operation failed').slice(0,240))}};
 handle(CH.pick,safe(async(e)=>{
  const answer=await dialog.showOpenDialog(windowProvider(),{properties:['openDirectory'],title:'KNOuX · Add organization source'});
  if(answer.canceled||!answer.filePaths[0])return null;
  const folder=await validateSource(answer.filePaths[0]);
  const existing=[...sources.values()].find(r=>own(r,e)&&r.folder.toLowerCase()===folder.toLowerCase());
  if(existing)return {id:existing.id,name:path.basename(existing.folder),folder:existing.folder};
  const id=crypto.randomUUID();sources.set(id,{id,folder,owner:owner(e)});
  return {id,name:path.basename(folder),folder};
 }));
 handle(CH.sources,safe(async(e)=>[...sources.values()].filter(r=>own(r,e)).map(r=>({id:r.id,name:path.basename(r.folder),folder:r.folder}))));
 handle(CH.remove,safe(async(e,id)=>{
  const key=uid.parse(id),src=sources.get(key);if(!own(src,e))return false;
  for(const [op,r] of active)if(r.sourceId===key){r.abort.abort();active.delete(op)}
  for(const [inv,r] of inventories)if(r.sourceId===key)inventories.delete(inv);
  sources.delete(key);return true;
 }));
 handle(CH.scan,safe(async(e,raw)=>{
  const {sourceId,operationId}=scanSchema.parse(raw),source=sources.get(sourceId);
  if(!own(source,e))throw Error('Source has not been selected in this window');
  if(active.has(operationId))throw Error('Operation ID already in use');
  if([...active.values()].some(r=>r.owner===owner(e)))throw Error('Another folder is being indexed');
  if((await validateSource(source.folder)).toLowerCase()!==source.folder.toLowerCase())throw Error('Source changed');
  const abort=new AbortController();active.set(operationId,{abort,owner:owner(e),sourceId});
  send(e,operationId,'started',{sourceId});
  try{
   const settings=settingsProvider?await settingsProvider():null;
   const exclusions=settings?.scanning?.exclusions||[];
   const data=await scanFolder(source.folder,{signal:abort.signal,exclusions,onProgress:count=>send(e,operationId,'progress',{sourceId,...count})});
   if(!own(sources.get(sourceId),e)){send(e,operationId,'cancelled',{sourceId});return {cancelled:true,partial:true};}
   if(data.summary.cancelled){send(e,operationId,'cancelled',{sourceId});return {cancelled:true,partial:true};}
   for(const [key,r]of inventories)if(r.sourceId===sourceId&&own(r,e))inventories.delete(key);
   const inventoryId=crypto.randomUUID();inventories.set(inventoryId,{...data,id:inventoryId,sourceId,owner:owner(e)});
   while(inventories.size>8)inventories.delete(inventories.keys().next().value);
   send(e,operationId,'completed',{sourceId,inventoryId});
   return {inventoryId,sourceId,operationId,...data.summary};
  }catch(error){send(e,operationId,'failed',{sourceId,message:String(error?.message||error).slice(0,200)});throw error}
  finally{active.delete(operationId)}
 }));
 handle(CH.cancel,safe(async(e,raw)=>{
  const id=uid.parse(raw),run=active.get(id);if(!own(run,e))return false;run.abort.abort();return true;
 }));
 handle(CH.query,safe(async(e,raw)=>{
  const req=querySchema.parse(raw),index=inventories.get(req.inventoryId);if(!own(index,e))throw Error('Index not found or expired');
  return query(index,req);
 }));
 handle(CH.reveal,safe(async(e,raw)=>{
  const req=revealSchema.parse(raw),index=inventories.get(req.inventoryId);
  if(!own(index,e))return false;
  const file=index.files[req.fileId];if(!file)return false;
  const target=path.resolve(index.root,file.relative);if(!inside(index.root,target))return false;
  const st=await fs.lstat(target).catch(()=>null);
  if(!st||!st.isFile()||st.isSymbolicLink())return false;
  const before=file.identity;
  if(Number(st.size)!==before.size||Number(st.mtimeMs)!==before.modifiedMs)return false;
  // An intermediate folder might have become a junction after scanning.
  const real=await fs.realpath(target).catch(()=>null);if(!real||!inside(index.root,real))return false;
  shell.showItemInFolder(real);return true;
 }));
 return {dispose(){for(const op of active.values())op.abort.abort();for(const name of Object.values(CH))if(name!==CH.event)ipcMain.removeHandler(name);sources.clear();inventories.clear();}};
}
module.exports={registerStudioIpc,CH};