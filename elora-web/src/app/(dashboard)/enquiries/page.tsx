"use client";

import React, { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { MessageSquare, Calendar, Phone, Mail, User, Loader2, CheckCircle2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "@/src/context/ThemeContext";

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "NEW" | "CONTACTED" | "RESOLVED";
  createdAt: string;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useTheme();

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/enquiries");
      // The controller returns an array directly: res.json(enquiries)
      // Wait, let me check controller again. 
      // Yes: res.status(200).json(enquiries); which is an array.
      // But usually axios wraps it in data.
      // So data is the array.
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
      switch(status) {
          case "NEW": return "bg-blue-100 text-blue-800";
          case "CONTACTED": return "bg-yellow-100 text-yellow-800";
          case "RESOLVED": return "bg-green-100 text-green-800";
          default: return "bg-gray-100 text-gray-800";
      }
  };

  if (loading) return <div className="flex h-screen justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>;

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
               <div className="overflow-x-auto">
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
                               <tr key={enq._id} className={`transition-colors ${darkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}>
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
           )}
       </div>
    </div>
  );
}
