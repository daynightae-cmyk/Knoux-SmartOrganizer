import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, lstatSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
const require = createRequire(import.meta.url);
const { scanFolder, query, categoryFor, validateSource } = require('../electron/studio/folder-inventory.cjs');

function fixtures() {
 const dir=mkdtempSync(join(tmpdir(),'knoux-studio-test-'));
 mkdirSync(join(dir,'child'));
 writeFileSync(join(dir,'photo.JPG'),'12345');
 writeFileSync(join(dir,'child','movie.MP4'),'abcdef');
 writeFileSync(join(dir,'child','report.PDF'),'x');
 writeFileSync(join(dir,'README'),'xy');
 return dir;
}
describe('Studio read-only index',()=>{
 it('classifies real entries, never changes their contents, and pages without leaking paths', async()=>{
  const dir=fixtures();
  try{
   const input=readFileSync(join(dir,'photo.JPG'),'utf8');
   const initialTime=lstatSync(join(dir,'photo.JPG')).mtimeMs;
   const index=await scanFolder(dir);
   expect(index.summary.totalFiles).toBe(4);
   expect(index.summary.totalBytes).toBe(14);
   expect(index.summary.metadataOnly).toBe(true);
   expect(index.summary.partial).toBe(false);
   expect(index.summary.categories.find((c:{key:string})=>c.key==='image').count).toBe(1);
   const part=query(index,{category:'all',sort:'size',desc:true,limit:2});
   expect(part.total).toBe(4);
   expect(part.rows).toHaveLength(2);
   expect(part.rows.every((f:Record<string,unknown>)=>!('identity' in f)&&!('absolute' in f))).toBe(true);
   const filtered=query(index,{category:'video',search:'movie',limit:48});
   expect(filtered.total).toBe(1);
   expect(readFileSync(join(dir,'photo.JPG'),'utf8')).toBe(input);
   expect(lstatSync(join(dir,'photo.JPG')).mtimeMs).toBe(initialTime);
  }finally{rmSync(dir,{recursive:true,force:true})}
 });
 it('treats depth-limited results as partial, not empty complete scans',async()=>{
  const dir=fixtures();
  try{const r=await scanFolder(dir,{maxDepth:0});expect(r.summary.partial).toBe(true);expect(r.summary.counts.depthSkipped).toBe(1);expect(r.summary.totalFiles).toBe(2)}
  finally{rmSync(dir,{recursive:true,force:true})}
 });
 it('reports cancellation truthfully with no moves',async()=>{
  const dir=fixtures();
  try{const ctl=new AbortController();ctl.abort();const r=await scanFolder(dir,{signal:ctl.signal});expect(r.summary.cancelled).toBe(true);expect(r.summary.partial).toBe(true);expect(r.summary.totalFiles).toBe(0)}
  finally{rmSync(dir,{recursive:true,force:true})}
 });
 it('rejects unsafe and nonexistent source paths',async()=>{
  await expect(validateSource('relative/folder')).rejects.toThrow();
  await expect(validateSource('')).rejects.toThrow();
  expect(categoryFor('README')).toBe('other');
 });
 it('respects user scanning exclusions without deleting entries',async()=>{
  const dir=fixtures();
  try{const r=await scanFolder(dir,{exclusions:['photo.JPG']});expect(r.summary.counts.excluded).toBe(1);expect(r.summary.totalFiles).toBe(3);expect(readFileSync(join(dir,'photo.JPG'),'utf8')).toBe('12345')}
  finally{rmSync(dir,{recursive:true,force:true})}
 });
});
describe('Studio IPC authorization',()=>{
 it('only indexes picker-granted folders and only reveals files to the owning sender',async()=>{
  const dir=fixtures();
  type TestSender=EventEmitter&{id:number;mainFrame?:object;isDestroyed:()=>boolean;send:()=>void};
  const handlers=new Map<string,(event:unknown,input?:unknown)=>Promise<unknown>>();
  const sender:TestSender=Object.assign(new EventEmitter(),{id:31,mainFrame:{},isDestroyed:()=>false,send:()=>{}});
  const other:TestSender=Object.assign(new EventEmitter(),{id:32,isDestroyed:()=>false,send:()=>{}});
  const {registerStudioIpc,CH}=require('../electron/studio/register-studio-ipc.cjs');
  const reveals:string[]=[];
  const controller=registerStudioIpc({
   ipcMain:{handle:(name:string,fn:(event:unknown,input?:unknown)=>Promise<unknown>)=>handlers.set(name,fn),removeHandler:(name:string)=>handlers.delete(name)},
   dialog:{showOpenDialog:async()=>({canceled:false,filePaths:[dir]})},
   shell:{showItemInFolder:(p:string)=>reveals.push(p)},
   windowProvider:()=>({webContents:sender}),
   userDataPath:join(dir,'journal.json')
  });
  const invoke=(ch:string,input:unknown,who:TestSender=sender)=>handlers.get(ch)!({sender:who,senderFrame:who.mainFrame||sender.mainFrame},input) as Promise<any>;
  try{
   const denied=await invoke(CH.scan,{sourceId:randomUUID(),operationId:randomUUID()}).then(()=>false,()=>true);
   expect(denied).toBe(true);
   const selected=await invoke(CH.pick,undefined);
   expect(selected.folder).toBeTruthy();
   const operationId=randomUUID();
   const scanned=await invoke(CH.scan,{sourceId:selected.id,operationId});
   expect(scanned.inventoryId).toBeTruthy();
   const q=await invoke(CH.query,{inventoryId:scanned.inventoryId});
   expect(q.rows).toHaveLength(4);
   await expect(invoke(CH.query,{inventoryId:scanned.inventoryId},other)).rejects.toThrow();
   await expect(invoke(CH.reveal,{inventoryId:scanned.inventoryId,fileId:0},other)).rejects.toThrow('STUDIO_SENDER_REFUSED');
   expect(await invoke(CH.reveal,{inventoryId:scanned.inventoryId,fileId:0})).toBe(true);
   expect(reveals).toHaveLength(1);
   expect(await invoke(CH.remove,selected.id)).toBe(true);
   await expect(invoke(CH.query,{inventoryId:scanned.inventoryId})).rejects.toThrow();
  }finally{controller.dispose();rmSync(dir,{recursive:true,force:true})}
 });
});