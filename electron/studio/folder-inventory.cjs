'use strict';
/** KNOuX read-only, bounded library scanner. No file contents are opened. */
const fs=require('node:fs/promises'),path=require('node:path');
const win=require('../windows-fs-metadata.cjs');
const GROUPS={image:'jpg jpeg png gif webp bmp tif tiff heic avif svg',video:'mp4 mov mkv avi webm m4v wmv mpg mpeg 3gp',document:'pdf doc docx xls xlsx ppt pptx odt ods odp txt rtf md csv epub',audio:'mp3 wav flac m4a aac ogg opus wma aiff midi',archive:'zip rar 7z tar gz tgz bz2 xz zst cab iso',code:'js jsx ts tsx cjs mjs py java cs cpp c h hpp go rs rb php html css scss json yaml yml xml sql sh ps1 bat',installer:'exe msi msix appx'};
const cats=new Map(Object.entries(GROUPS).flatMap(([cat,ext])=>ext.split(' ').map(s=>[s,cat])));
const KEYS=[...Object.keys(GROUPS),'other'];
function categoryFor(n){return cats.get(path.extname(n).slice(1).toLowerCase())||'other'}
function inside(root,p){const rel=path.relative(root,p);return rel===''||(rel!=='..'&&!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel))}
async function validateSource(folder){
 if(typeof folder!=='string'||!folder||folder.length>32767||folder.includes('\0')||!path.isAbsolute(folder))throw Error('Invalid source folder');
 const root=path.resolve(folder);if(root===path.parse(root).root)throw Error('Select a directory below the drive root');
 const stat=await fs.lstat(root);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Linked root not supported');
 // Canonicalize parent-directory aliases before indexing; the selected entry itself must not be a link.
 const real=await fs.realpath(root);if(real===path.parse(real).root)throw Error('Drive root is not a supported source');return real;
}
async function scanFolder(folder,{signal,onProgress=()=>{},maxFiles=200000,maxDepth=64,exclusions=[]}={}){
 const root=await validateSource(folder),queue=[{p:root,depth:0}],files=[],categories=new Map(KEYS.map(key=>[key,{key,count:0,bytes:0}]));
 const counts={folders:0,links:0,errors:0,depthSkipped:0,excluded:0};
 let bytes=0,partial=false,truncated=false,cancelled=false,ticks=0,lastProgress=0;
 const warnings=[];
 const excluded=(p)=>exclusions.some(pattern=>typeof pattern==='string'&&pattern&&(path.basename(p).toLowerCase()===pattern.toLowerCase()||inside(path.resolve(pattern),p)));
 const progress=(force=false)=>{if(force||Date.now()-lastProgress>180){lastProgress=Date.now();onProgress({files:files.length,bytes,folders:counts.folders})}};
 outer:while(queue.length){
  if(signal?.aborted){cancelled=true;break}
  const {p,depth}=queue.pop();
  let entries;try{entries=await fs.readdir(p,{withFileTypes:true})}catch(error){counts.errors++;partial=true;if(warnings.length<20)warnings.push('Folder inaccessible: '+path.basename(p)+' '+(error.code||''));continue}
  counts.folders++;
  for(const entry of entries){
   if(signal?.aborted){cancelled=true;break outer}
   if(++ticks%100===0)await new Promise(resolve=>setImmediate(resolve));
   const absolute=path.join(p,entry.name);
   if(excluded(absolute)){counts.excluded++;continue}
   if(entry.isSymbolicLink()){counts.links++;continue}
   let stat;try{stat=await fs.lstat(absolute)}catch{counts.errors++;partial=true;continue}
   if(stat.isSymbolicLink()){counts.links++;continue}
   if(stat.isDirectory()){if(depth>=maxDepth){counts.depthSkipped++;partial=true}else queue.push({p:absolute,depth:depth+1});continue}
   if(!stat.isFile())continue;
   if(files.length>=maxFiles){truncated=true;partial=true;break outer}
   const category=categoryFor(entry.name),size=Number(stat.size)||0;
   files.push({id:files.length,name:entry.name,relative:path.relative(root,absolute),category,size,ext:path.extname(entry.name).toLowerCase(),modifiedAt:stat.mtime.toISOString(),identity:win.identitySnapshot(stat)});
   categories.get(category).count++;categories.get(category).bytes+=size;bytes+=size;progress();
  }
 }
 if(signal?.aborted)cancelled=true;
 if(cancelled){partial=true;warnings.push('Scan cancelled')}
 if(truncated)warnings.push('File limit reached; results are partial');
 if(counts.depthSkipped)warnings.push('Depth limit reached');
 if(counts.links)warnings.push('Links and reparse entries skipped: '+counts.links);
 if(counts.errors)warnings.push('Some entries could not be read: '+counts.errors);
 progress(true);
 return {root,files,summary:{totalFiles:files.length,totalBytes:bytes,categories:[...categories.values()],counts,partial,truncated,cancelled,metadataOnly:true,cloudAttributeInspection:false,warnings}};
}
function query(index,req){
 const search=String(req.search||'').trim().toLowerCase();
 const rows=index.files.filter(f=>(!req.category||req.category==='all'||f.category===req.category)&&(!search||f.relative.toLowerCase().includes(search)));
 const cmp=(a,b)=>req.sort==='size'?a.size-b.size:req.sort==='modified'?Date.parse(a.modifiedAt)-Date.parse(b.modifiedAt):req.sort==='type'?a.ext.localeCompare(b.ext):a.relative.localeCompare(b.relative,undefined,{numeric:true});
 rows.sort((a,b)=>(req.desc?-1:1)*(cmp(a,b)||a.id-b.id));
 const offset=req.offset||0,limit=req.limit||48;
 return {total:rows.length,offset,limit,rows:rows.slice(offset,offset+limit).map(f=>({id:f.id,name:f.name,relative:f.relative,category:f.category,size:f.size,ext:f.ext,modifiedAt:f.modifiedAt}))};
}
module.exports={scanFolder,query,validateSource,inside,categoryFor,KEYS};