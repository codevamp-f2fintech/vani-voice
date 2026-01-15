
import React, { useState, useRef } from 'react';
import { Card, Button, Badge, Input, Label } from '../components/UI';
import { Database, Plus, Search, FileText, Globe, Link2, Trash2, Loader2, Upload, X } from 'lucide-react';
import { useFiles, uploadFile, deleteFile, formatFileSize, getFileType } from '../hooks/useFiles';

const KnowledgeBase: React.FC = () => {
   const { files, loading, error, refetch } = useFiles();
   const [uploading, setUploading] = useState(false);
   const [deletingId, setDeletingId] = useState<string | null>(null);
   const [search, setSearch] = useState('');
   const [showUploadModal, setShowUploadModal] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const filteredFiles = files.filter(f =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.originalName?.toLowerCase().includes(search.toLowerCase())
   );

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
         setUploading(true);
         await uploadFile(file);
         refetch();
         setShowUploadModal(false);
      } catch (err: any) {
         alert(err.message || 'Failed to upload file');
      } finally {
         setUploading(false);
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
         }
      }
   };

   const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this file?')) return;
      try {
         setDeletingId(id);
         await deleteFile(id);
         refetch();
      } catch (err: any) {
         alert(err.message || 'Failed to delete file');
      } finally {
         setDeletingId(null);
      }
   };

   const totalSize = files.reduce((acc, f) => acc + (f.bytes || 0), 0);
   const maxSize = 100 * 1024 * 1024; // 100MB
   const usagePercent = Math.round((totalSize / maxSize) * 100);

   if (loading && files.length === 0) {
      return (
         <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-vani-plum" />
         </div>
      );
   }

   return (
      <div className="space-y-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-4xl font-black dark:text-white tracking-tight">Knowledge Base</h1>
               <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Feed your agents custom data to make them smarter.</p>
            </div>
            <div className="flex gap-3">
               <Button variant="outline" className="h-14 px-6 border-2"><Link2 size={20} className="mr-2" /> Add URL</Button>
               <Button className="h-14 px-8 shadow-xl" onClick={() => setShowUploadModal(true)}>
                  <Plus size={20} className="mr-2" /> Upload File
               </Button>
            </div>
         </div>

         {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
               {error}
            </div>
         )}

         <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
               <Card className="p-6 space-y-6 border-2">
                  <div className="space-y-2">
                     <Label>Storage Used</Label>
                     <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="dark:text-white">{formatFileSize(totalSize)} / 100 MB</span>
                        <span className="text-vani-plum">{usagePercent}%</span>
                     </div>
                     <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full vani-gradient" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                     </div>
                  </div>
                  <div className="pt-4 border-t dark:border-white/5">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Summary</p>
                     <div className="space-y-2 text-sm dark:text-gray-300">
                        <p>Total Files: <span className="font-bold">{files.length}</span></p>
                     </div>
                  </div>
               </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                     placeholder="Search your knowledge base..."
                     className="h-14 pl-12 rounded-2xl font-bold"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                  />
               </div>

               {filteredFiles.length === 0 ? (
                  <Card className="p-12 text-center border-2 border-dashed">
                     <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Database size={32} className="text-gray-400" />
                     </div>
                     <h3 className="text-xl font-bold dark:text-white mb-2">No files yet</h3>
                     <p className="text-gray-500 mb-6">Upload PDFs, text files, or other documents to enhance your agents.</p>
                     <Button onClick={() => setShowUploadModal(true)}>
                        <Upload size={18} className="mr-2" /> Upload First File
                     </Button>
                  </Card>
               ) : (
                  <div className="grid gap-4">
                     {filteredFiles.map(file => (
                        <Card key={file.id} className="p-6 flex items-center justify-between group border-2 hover:border-vani-plum/30 transition-all">
                           <div className="flex items-center gap-6">
                              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 text-vani-plum group-hover:bg-vani-plum group-hover:text-white transition-all">
                                 <FileText size={24} />
                              </div>
                              <div>
                                 <h4 className="text-lg font-black dark:text-white tracking-tight">{file.originalName || file.name}</h4>
                                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                                    {getFileType(file.mimetype || '')} • {formatFileSize(file.bytes || 0)} • {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '—'}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <Badge variant="success">{file.status || 'Uploaded'}</Badge>
                              <button
                                 className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                 onClick={() => handleDelete(file.id)}
                                 disabled={deletingId === file.id}
                              >
                                 {deletingId === file.id ? (
                                    <Loader2 size={20} className="animate-spin" />
                                 ) : (
                                    <Trash2 size={20} />
                                 )}
                              </button>
                           </div>
                        </Card>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* Upload Modal */}
         {showUploadModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <Card className="w-full max-w-lg p-8">
                  <div className="flex items-center justify-between mb-6">
                     <h2 className="text-2xl font-black dark:text-white">Upload File</h2>
                     <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                     </button>
                  </div>

                  <div
                     className="border-4 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center hover:border-vani-plum/50 transition-colors cursor-pointer"
                     onClick={() => fileInputRef.current?.click()}
                  >
                     <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.txt,.doc,.docx,.csv,.md,.json,.xml"
                        onChange={handleFileUpload}
                     />
                     <div className="w-16 h-16 rounded-full bg-vani-plum/10 flex items-center justify-center mx-auto mb-4">
                        {uploading ? (
                           <Loader2 size={32} className="text-vani-plum animate-spin" />
                        ) : (
                           <Upload size={32} className="text-vani-plum" />
                        )}
                     </div>
                     <p className="text-lg font-bold dark:text-white mb-2">
                        {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                     </p>
                     <p className="text-sm text-gray-500">PDF, TXT, DOC, DOCX, CSV, MD, JSON, XML (Max 10MB)</p>
                  </div>

                  <div className="mt-6 flex gap-3">
                     <Button variant="outline" className="flex-1" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                     <Button className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        Select File
                     </Button>
                  </div>
               </Card>
            </div>
         )}
      </div>
   );
};

export default KnowledgeBase;
