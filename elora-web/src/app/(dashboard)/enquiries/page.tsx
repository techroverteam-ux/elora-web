"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { MessageSquare, Calendar, Phone, Mail, User, Loader2, CheckCircle2, Clock, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/src/context/ThemeContext";

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "NEW" | "READ" | "CONTACTED" | "RESOLVED";
  remark?: string;
  createdAt: string;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const { darkMode } = useTheme();

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      const { data } = await api.get("/enquiries");
      // Sort: NEW first, then others by date
      const sorted = Array.isArray(data) ? data.sort((a: Enquiry, b: Enquiry) => {
        if (a.status === "NEW" && b.status !== "NEW") return -1;
        if (a.status !== "NEW" && b.status === "NEW") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }) : [];
      setEnquiries(sorted);
    } catch (error) {
      toast.error("Failed to load enquiries");
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        setTimeout(() => setLoading(false), 800 - elapsed);
      } else {
        setLoading(false);
      }
    }
  };

  const statusColor = (status: string) => {
      switch(status) {
          case "NEW": return "bg-blue-100 text-blue-800";
          case "READ": return "bg-purple-100 text-purple-800";
          case "CONTACTED": return "bg-yellow-100 text-yellow-800";
          case "RESOLVED": return "bg-green-100 text-green-800";
          default: return "bg-gray-100 text-gray-800";
      }
  };

  const openEnquiry = async (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setRemark(enquiry.remark || "");
    
    // Auto-update status to READ if it's NEW
    if (enquiry.status === "NEW") {
      try {
        await api.put(`/enquiries/${enquiry._id}`, { status: "READ", remark: enquiry.remark });
        // Update local state and re-sort
        setEnquiries(prev => {
          const updated = prev.map(e => e._id === enquiry._id ? { ...e, status: "READ" as const } : e);
          return updated.sort((a, b) => {
            if (a.status === "NEW" && b.status !== "NEW") return -1;
            if (a.status !== "NEW" && b.status === "NEW") return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
      } catch (error) {
        console.error("Failed to update status");
      }
    }
  };

  const closeModal = () => {
    setSelectedEnquiry(null);
    setRemark("");
  };

  const saveRemark = async () => {
    if (!selectedEnquiry) return;
    
    try {
      setSaving(true);
      // Ensure status is at least READ when saving remark
      const updatedStatus = selectedEnquiry.status === "NEW" ? "READ" : selectedEnquiry.status;
      
      const { data } = await api.put(`/enquiries/${selectedEnquiry._id}`, {
        status: updatedStatus,
        remark: remark.trim()
      });
      
      // Update local state and re-sort
      setEnquiries(prev => {
        const updated = prev.map(e => e._id === selectedEnquiry._id ? data.enquiry : e);
        return updated.sort((a, b) => {
          if (a.status === "NEW" && b.status !== "NEW") return -1;
          if (a.status !== "NEW" && b.status === "NEW") return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
      
      toast.success("Remark saved successfully");
      closeModal();
    } catch (error) {
      toast.error("Failed to save remark");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
      <div>
        <div className={`h-8 w-48 rounded-lg mb-2 animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        <div className={`h-4 w-64 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      </div>
      <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
        <div className={`p-6 ${darkMode ? "bg-gray-800/80" : "bg-gray-50"}`}>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-4 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`p-6 ${darkMode ? "bg-gray-800/30" : "bg-white"}`}>
              <div className="grid grid-cols-4 gap-4">
                <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                <div className="space-y-2">
                  <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className={`h-3 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
                <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                <div className={`h-6 w-20 rounded-full animate-pulse ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
       <div>
           <h1 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
               <MessageSquare className="h-6 w-6 text-blue-600" /> Enquiries
           </h1>
           <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Manage messages from the landing page</p>
       </div>

       <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-purple-900/30 border-purple-700/50" : "bg-white border-gray-200"}`}>
           {enquiries.length === 0 ? (
               <div className="p-10 text-center text-gray-500">No enquiries found.</div>
           ) : (
               <>
               {/* Desktop Table */}
               <div className="hidden md:block overflow-x-auto">
                   <table className="min-w-full">
                       <thead className={darkMode ? "bg-gray-800/80" : "bg-gray-50"}>
                           <tr>
                               <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date</th>
                               <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>User Details</th>
                               <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Message</th>
                               <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Status</th>
                           </tr>
                       </thead>
                       <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                           {enquiries.map((enq) => (
                               <tr key={enq._id} onClick={() => openEnquiry(enq)} className={`transition-colors cursor-pointer ${darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                       <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                           <Clock className="w-4 h-4 text-gray-400" />
                                           {new Date(enq.createdAt).toLocaleDateString()}
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       <div className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{enq.name}</div>
                                       <div className={`flex items-center gap-1 text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                           <Mail className="w-3 h-3" /> {enq.email}
                                       </div>
                                       <div className={`flex items-center gap-1 text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                           <Phone className="w-3 h-3" /> {enq.phone}
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       <div className={`text-sm line-clamp-2 max-w-md ${darkMode ? "text-gray-300" : "text-gray-700"}`} title={enq.message}>
                                           {enq.message}
                                       </div>
                                   </td>
                                   <td className="px-6 py-4">
                                       <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor(enq.status)}`}>
                                           {enq.status}
                                       </span>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>

               {/* Mobile Cards */}
               <div className="md:hidden space-y-3 p-4">
                   {enquiries.map((enq) => (
                       <div key={enq._id} onClick={() => openEnquiry(enq)} className={`p-4 rounded-lg border cursor-pointer transition-all ${darkMode ? "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
                           <div className="flex items-start justify-between mb-3">
                               <div className="flex-1 min-w-0">
                                   <div className={`font-semibold text-base ${darkMode ? "text-white" : "text-gray-900"} truncate`}>{enq.name}</div>
                                   <div className={`flex items-center gap-1 text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                       <Clock className="w-3 h-3" /> {new Date(enq.createdAt).toLocaleDateString()}
                                   </div>
                               </div>
                               <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${statusColor(enq.status)}`}>
                                   {enq.status}
                               </span>
                           </div>
                           <div className="space-y-1.5 mb-3">
                               <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                   <Mail className="w-3 h-3 flex-shrink-0" />
                                   <span className="truncate">{enq.email}</span>
                               </div>
                               <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                   <Phone className="w-3 h-3 flex-shrink-0" />
                                   <span>{enq.phone}</span>
                               </div>
                           </div>
                           <div className={`text-sm line-clamp-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                               {enq.message}
                           </div>
                       </div>
                   ))}
               </div>
               </>
           )}
       </div>

       {/* Enquiry Details Modal */}
       {selectedEnquiry && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
           <div className={`w-full max-w-lg rounded-xl shadow-2xl ${darkMode ? "bg-gray-900 border border-purple-700/50" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
             {/* Header */}
             <div className={`flex items-center justify-between p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
               <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Enquiry Details</h2>
               <button onClick={closeModal} className={`p-1.5 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}>
                 <X className="w-5 h-5" />
               </button>
             </div>

             {/* Content */}
             <div className="p-4 space-y-3">
               {/* Status & Date */}
               <div className="flex items-center justify-between">
                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${statusColor(selectedEnquiry.status)}`}>
                   {selectedEnquiry.status}
                 </span>
                 <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                   {new Date(selectedEnquiry.createdAt).toLocaleString()}
                 </span>
               </div>

               {/* User Details */}
               <div className={`p-3 rounded-lg space-y-2 ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
                 <div className="flex items-center gap-2">
                   <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                   <span className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedEnquiry.name}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                   <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{selectedEnquiry.email}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                   <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{selectedEnquiry.phone}</span>
                 </div>
               </div>

               {/* Message */}
               <div>
                 <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Message</label>
                 <div className={`p-3 rounded-lg text-sm ${darkMode ? "bg-gray-800/50 text-gray-300" : "bg-gray-50 text-gray-700"}`}>
                   {selectedEnquiry.message}
                 </div>
               </div>

               {/* Remark */}
               <div>
                 <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Remark (Optional)</label>
                 <textarea
                   value={remark}
                   onChange={(e) => setRemark(e.target.value)}
                   rows={2}
                   placeholder="Add notes or follow-up actions..."
                   className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                 />
               </div>
             </div>

             {/* Footer */}
             <div className={`flex items-center justify-end gap-2 p-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
               <button
                 onClick={closeModal}
                 className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
               >
                 Cancel
               </button>
               <button
                 onClick={saveRemark}
                 disabled={saving}
                 className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center gap-2"
               >
                 {saving ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin" />
                     Saving...
                   </>
                 ) : (
                   "Save Remark"
                 )}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
