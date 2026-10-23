export interface Source { id:string; name:string; folder:string }
export type Category='image'|'video'|'document'|'audio'|'archive'|'code'|'installer'|'other';
export interface CategoryStat {key:Category;count:number;bytes:number}
export interface ScanSummary {
 inventoryId:string;sourceId:string;operationId:string;totalFiles:number;totalBytes:number;
 categories:CategoryStat[];counts:{folders:number;links:number;errors:number;depthSkipped:number;excluded:number};
 partial:boolean;truncated:boolean;cancelled:boolean;metadataOnly:true;cloudAttributeInspection:false;warnings:string[];
}
export interface FileInfo {id:number;name:string;relative:string;category:Category;size:number;ext:string;modifiedAt:string}
export interface PageResult {total:number;offset:number;limit:number;rows:FileInfo[]}
export type ScanEvent={operationId:string;phase:'started'|'progress'|'completed'|'cancelled'|'failed';at:string;sourceId?:string;inventoryId?:string;files?:number;bytes?:number;folders?:number;message?:string};
export interface StudioBridge {
 pickSource():Promise<Source|null>;
 listSources():Promise<Source[]>;
 removeSource(id:string):Promise<boolean>;
 scan(input:{sourceId:string;operationId:string}):Promise<ScanSummary|{cancelled:true;partial:true}>;
 cancel(id:string):Promise<boolean>;
 query(input:{inventoryId:string;category?:Category|'all';search?:string;sort?:'name'|'size'|'modified'|'type';desc?:boolean;offset?:number;limit?:number}):Promise<PageResult>;
 reveal(input:{inventoryId:string;fileId:number}):Promise<boolean>;
 onEvent(callback:(event:ScanEvent)=>void):()=>void;
}
declare global { interface Window { knouxStudio?:StudioBridge } }
