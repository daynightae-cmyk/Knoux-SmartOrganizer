/**
 * KNOuX SmartOrganizer — File Icon Renderer
 * Matches Windows file type iconography in REF-03
 */

import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Archive,
  Code,
  FileCode,
  Folder,
  Box,
  FileSpreadsheet,
} from 'lucide-react';

interface FileIconProps {
  name: string;
  type: string;
  className?: string;
}

export function FileIcon({ name, type, className = 'w-4 h-4' }: FileIconProps) {
  const norm = name.toLowerCase();

  // Word Document (.docx)
  if (norm.endsWith('.docx') || norm.endsWith('.doc')) {
    return (
      <div className={`${className} rounded bg-[#2B579A] flex items-center justify-center text-white font-black text-[9px] shadow-sm shrink-0`}>
        W
      </div>
    );
  }

  // Excel Workbook (.xlsx)
  if (norm.endsWith('.xlsx') || norm.endsWith('.xls') || norm.endsWith('.csv')) {
    return (
      <div className={`${className} rounded bg-[#217346] flex items-center justify-center text-white font-black text-[9px] shadow-sm shrink-0`}>
        X
      </div>
    );
  }

  // PowerPoint Presentation (.pptx)
  if (norm.endsWith('.pptx') || norm.endsWith('.ppt')) {
    return (
      <div className={`${className} rounded bg-[#D24726] flex items-center justify-center text-white font-black text-[9px] shadow-sm shrink-0`}>
        P
      </div>
    );
  }

  // Python (.py)
  if (norm.endsWith('.py')) {
    return (
      <div className={`${className} rounded bg-[#3776AB] flex items-center justify-center text-[#FFD438] font-black text-[9px] shadow-sm shrink-0`}>
        py
      </div>
    );
  }

  // Markdown (.md)
  if (norm.endsWith('.md')) {
    return (
      <div className={`${className} rounded bg-[#1F2937] border border-slate-600 flex items-center justify-center text-cyan-300 font-black text-[9px] shadow-sm shrink-0`}>
        M↓
      </div>
    );
  }

  // Executable (.exe)
  if (norm.endsWith('.exe') || norm.endsWith('.msi')) {
    return (
      <div className={`${className} rounded bg-[#0284C7] flex items-center justify-center text-white shadow-sm shrink-0`}>
        <Box className="w-3 h-3 text-white" />
      </div>
    );
  }

  // ZIP / Archive (.zip, .rar, .7z)
  if (norm.endsWith('.zip') || norm.endsWith('.rar') || norm.endsWith('.7z')) {
    return (
      <div className={`${className} rounded bg-[#D97706] flex items-center justify-center text-white shadow-sm shrink-0`}>
        <Archive className="w-3 h-3 text-white" />
      </div>
    );
  }

  // Video (.mp4, .mkv, .mov)
  if (norm.endsWith('.mp4') || norm.endsWith('.mkv') || norm.endsWith('.mov')) {
    return (
      <div className={`${className} rounded bg-[#7C3AED] flex items-center justify-center text-white shadow-sm shrink-0`}>
        <Video className="w-3 h-3 text-white" />
      </div>
    );
  }

  // Images (.jpg, .jpeg, .png, .webp)
  if (norm.endsWith('.jpg') || norm.endsWith('.jpeg') || norm.endsWith('.png') || norm.endsWith('.webp')) {
    return (
      <div className={`${className} rounded bg-[#DB2777] flex items-center justify-center text-white shadow-sm shrink-0`}>
        <ImageIcon className="w-3 h-3 text-white" />
      </div>
    );
  }

  // Generic Folder
  if (type.toLowerCase().includes('folder')) {
    return <Folder className={`${className} text-amber-400 fill-amber-400/20 shrink-0`} />;
  }

  // Generic File
  return <FileText className={`${className} text-slate-400 shrink-0`} />;
}
