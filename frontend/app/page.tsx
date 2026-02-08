"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Activity, Pill, Stethoscope, Loader2, FileText, ChevronRight, LogOut, Printer, AlertTriangle, TrendingUp, History, Clock, X } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const graphData = [
  { name: 'Mon', patients: 12 },
  { name: 'Tue', patients: 19 },
  { name: 'Wed', patients: 15 },
  { name: 'Thu', patients: 22 },
  { name: 'Fri', patients: 28 },
  { name: 'Sat', patients: 10 },
];

export default function MedicalDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState({ name: "", email: "" });
  
  // History States
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      const name = localStorage.getItem("userName");
      const email = localStorage.getItem("userEmail");
      setUser({ 
        name: name || "Doctor", 
        email: email || "General Practice" 
      });
      setIsAuthenticated(true);
    }
  }, [router]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setShowHistory(true);
    try {
      const token = localStorage.getItem("token");
      // REPLACE URL IF DEPLOYED
      const res = await axios.get("http://localhost:8000/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setHistoryList(res.data);
    } catch (error) {
      toast.error("Failed to load history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadFromHistory = (record: any) => {
    setData({
        diagnosis: record.diagnosis,
        patient_symptoms: record.symptoms,
        treatment_plan: record.treatment,
        prescriptions: record.prescriptions,
        safety_warning: record.safety_warning
    });
    setShowHistory(false);
    toast.success("Past record loaded!");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    toast("Logged out successfully", { icon: "👋" });
    router.push("/login");
  };

  const handlePrint = () => {
    window.print();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/mp3" });
        await handleUpload(audioBlob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast("Recording started...", { icon: "🎙️" });
    } catch (err) {
      toast.error("Microphone access denied!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      toast("Recording stopped. Processing...", { icon: "⏳" });
    }
  };

  const handleUpload = async (blob: Blob) => {
    setIsProcessing(true);
    const loadingToast = toast.loading("Analyzing consultation with AI...");
    const formData = new FormData();
    formData.append("file", blob, "recording.mp3");

    try {
      const token = localStorage.getItem("token");
      // REPLACE URL IF DEPLOYED
      const res = await axios.post("http://localhost:8000/analyze-consultation", formData, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      setData(res.data);
      toast.dismiss(loadingToast);
      
      if (res.data.safety_warning) {
        toast.error("Safety Warning Detected!", { duration: 5000 });
      } else {
        toast.success("Analysis Complete!");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to analyze audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" />
      
      <div className="p-6 md:p-12 print:hidden">
        {/* Header */}
        <header className="max-w-6xl mx-auto flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
              <Stethoscope className="text-white w-6 h-6" />
            </div>
            {/* NEW NAME HERE */}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              PulseScript<span className="text-blue-600">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={fetchHistory}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
            >
              <History className="w-4 h-4" />
              <span className="text-sm font-medium">History</span>
            </button>

            <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 leading-none">{user.name}</span>
                <span className="text-xs text-slate-500 leading-none mt-1">{user.email}</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Controls & Graph */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <h2 className="text-xl font-bold mb-2">Consultation Mode</h2>
              <p className="text-slate-500 text-sm mb-8">Record patient interaction to auto-generate notes.</p>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-full group relative flex items-center justify-center gap-3 py-6 rounded-2xl transition-all duration-300 shadow-lg ${
                  isRecording 
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-100" 
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-900/20"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isRecording ? (
                  <>
                    <Square className="w-6 h-6 fill-current" />
                    <span className="font-semibold">Stop Recording</span>
                    <span className="absolute top-4 right-4 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    <span className="font-semibold text-lg">Start Session</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hidden md:block">
              <div className="flex items-center gap-2 mb-6">
                 <TrendingUp className="text-emerald-500 w-5 h-5" />
                 <h3 className="font-bold text-slate-800">Weekly Patients</h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="patients" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8 space-y-6">
            {!data ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <Activity className="w-8 h-8 opacity-50" />
                </div>
                <p className="font-medium">Ready to transcribe</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {data.safety_warning && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm animate-pulse">
                    <AlertTriangle className="text-red-600 w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-red-800 font-bold text-sm uppercase tracking-wide">Safety Alert: Drug Interaction</h4>
                      <p className="text-red-700 text-sm mt-1">{data.safety_warning}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4 text-blue-600">
                      <Activity className="w-5 h-5" />
                      <h3 className="font-bold uppercase text-xs tracking-wider">Diagnosis</h3>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{data.diagnosis}</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4 text-orange-500">
                      <FileText className="w-5 h-5" />
                      <h3 className="font-bold uppercase text-xs tracking-wider">Symptoms</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.patient_symptoms.map((s: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden rounded-3xl shadow-sm border border-slate-100 relative">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="text-purple-600 w-5 h-5" />
                      <h3 className="font-bold text-slate-900">Prescriptions</h3>
                    </div>
                    <button 
                      onClick={handlePrint}
                      className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline"
                    >
                      <Printer className="w-4 h-4" />
                      Print PDF
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="p-4 font-medium text-slate-500">Medication</th>
                          <th className="p-4 font-medium text-slate-500">Dosage</th>
                          <th className="p-4 font-medium text-slate-500">Freq</th>
                          <th className="p-4 font-medium text-slate-500">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data.prescriptions.map((rx: any, i: number) => (
                          <tr key={i} className="group hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-semibold text-slate-900">{rx.medication}</td>
                            <td className="p-4 text-slate-600">{rx.dosage}</td>
                            <td className="p-4 text-slate-600">{rx.frequency}</td>
                            <td className="p-4 text-slate-600">{rx.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-400" />
                    Treatment Plan
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {data.treatment_plan}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* --- HISTORY SLIDEOVER / MODAL --- */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex justify-end transition-opacity print:hidden">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Patient History
              </h2>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingHistory ? (
                <div className="flex justify-center py-10">
                   <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : historyList.length === 0 ? (
                <p className="text-center text-slate-500 mt-10">No past records found.</p>
              ) : (
                historyList.map((record: any) => (
                  <div 
                    key={record.id} 
                    onClick={() => loadFromHistory(record)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all bg-white group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-900">{record.diagnosis}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 mb-2">
                       {record.symptoms.slice(0, 3).map((s: string, i: number) => (
                         <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                           {s}
                         </span>
                       ))}
                       {record.symptoms.length > 3 && (
                         <span className="text-xs text-slate-400">+{record.symptoms.length - 3}</span>
                       )}
                    </div>
                    <div className="text-xs text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
                      View Details <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PRINT TEMPLATE --- */}
      {data && (
        <div className="hidden print:block print:p-8 bg-white text-black h-screen">
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                PulseScript<span className="text-blue-600">AI</span> Clinic
              </h1>
              <p className="text-sm text-slate-500 mt-2">123 Medical Center Drive, Suite 100</p>
              <p className="text-sm text-slate-500">New York, NY 10001</p>
              <p className="text-sm text-slate-500">Ph: (555) 123-4567</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-slate-600">{user.email}</p>
              <p className="text-sm text-slate-500 mt-2">Licence #: 987654321</p>
            </div>
          </div>

          <div className="flex justify-between mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Patient Name</span>
              <p className="text-lg font-medium">John Doe</p>
            </div>
            <div>
               <span className="text-xs font-bold text-slate-500 uppercase">Date</span>
               <p className="text-lg font-medium">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
               <span className="text-xs font-bold text-slate-500 uppercase">Diagnosis</span>
               <p className="text-lg font-medium">{data.diagnosis}</p>
            </div>
          </div>

          {data.safety_warning && (
            <div className="border border-red-500 bg-red-50 text-red-700 p-3 mb-6 font-bold text-center uppercase text-sm">
              ⚠ Safety Alert: {data.safety_warning}
            </div>
          )}

          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
               <span className="text-4xl font-serif font-bold italic text-slate-800">Rx</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 font-bold text-slate-700">Medication</th>
                  <th className="py-3 font-bold text-slate-700">Dosage</th>
                  <th className="py-3 font-bold text-slate-700">Frequency</th>
                  <th className="py-3 font-bold text-slate-700">Duration</th>
                </tr>
              </thead>
              <tbody>
                {data.prescriptions.map((rx: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-4 font-semibold text-slate-900 text-lg">{rx.medication}</td>
                    <td className="py-4 text-slate-600">{rx.dosage}</td>
                    <td className="py-4 text-slate-600">{rx.frequency}</td>
                    <td className="py-4 text-slate-600">{rx.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-16">
            <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">Doctor's Notes / Treatment Plan</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line mt-4">
              {data.treatment_plan}
            </p>
          </div>

          <div className="flex justify-between items-end mt-auto pt-12">
            <div className="text-center">
              <div className="w-64 border-b-2 border-slate-300 mb-2"></div>
              <p className="text-sm font-bold text-slate-500">Doctor's Signature</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              Generated by MediScribe AI on {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}