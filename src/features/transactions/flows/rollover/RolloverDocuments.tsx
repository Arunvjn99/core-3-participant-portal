import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useRolloverFlow } from "./RolloverFlowLayout";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  X,
  Image,
  FileCheck,
  Info,
  Camera } from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

function RolloverDocuments() {
  const navigate = useNavigate();
  const { rolloverData } = useRolloverFlow();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const requiredDocuments = [
    {
      id: "check",
      name: "Rollover Check",
      description:
        "A photo or scan of the rollover check from your previous plan administrator",
      required: true,
      icon: <Image className="w-5 h-5" />,
      formats: "JPG, PNG, or PDF" },
    {
      id: "statement",
      name: "Account Statement",
      description:
        "Most recent account statement from the previous plan showing balance and account details",
      required: true,
      icon: <FileText className="w-5 h-5" />,
      formats: "PDF only" },
    {
      id: "distribution",
      name: "Distribution Form",
      description:
        "Completed distribution or transfer form from the previous plan (if available)",
      required: false,
      icon: <FileCheck className="w-5 h-5" />,
      formats: "PDF only" },
  ];

  const handleFileUpload = (docType: string) => {
    const newFile: UploadedFile = {
      id: Math.random().toString(),
      name: `${docType.toLowerCase().replace(/\s/g, "_")}_document.pdf`,
      size: `${Math.floor(Math.random() * 500 + 100)} KB`,
      type: docType };
    setUploadedFiles([...uploadedFiles, newFile]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== id));
  };

  const allRequiredUploaded = requiredDocuments
    .filter((doc) => doc.required)
    .every((doc) => uploadedFiles.some((file) => file.type === doc.name));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Upload Documents
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Upload the required documents to process your rollover from{" "}
          {rolloverData.previousEmployer || "your previous plan"}.
        </p>
      </motion.div>

      {/* Quick Upload Option */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div
          className="p-5 rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 hover:border-indigo-300 transition-all cursor-pointer group"
          onClick={() => {
            // Simulate uploading all required docs
            requiredDocuments.forEach((doc) => {
              if (
                doc.required &&
                !uploadedFiles.some((f) => f.type === doc.name)
              ) {
                handleFileUpload(doc.name);
              }
            });
          }}
        >
          <div className="flex flex-col items-center text-center py-4">
            <div className="p-3 rounded-xl bg-indigo-100/70 text-indigo-600 mb-3 group-hover:bg-indigo-100 transition-colors">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              Quick Upload
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Drag and drop all documents here, or click to browse. Supports
              JPG, PNG, and PDF files up to 10MB each.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Individual Document Upload */}
      <div className="space-y-4">
        {requiredDocuments.map((doc, idx) => {
          const isUploaded = uploadedFiles.some(
            (file) => file.type === doc.name
          );
          const uploadedForDoc = uploadedFiles.filter(
            (file) => file.type === doc.name
          );

          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.06, duration: 0.3 }}
            >
              <Card
                className={`p-5 rounded-2xl transition-all duration-300 ${
                  isUploaded
                    ? "border-emerald-200/60 bg-emerald-50/20"
                    : "border-gray-100/80"
                }`}
                style={{
                  boxShadow: isUploaded
                    ? "0 1px 3px rgba(16,185,129,0.06)"
                    : "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        isUploaded
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {doc.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {doc.name}
                        </h3>
                        {doc.required ? (
                          <span className="text-[9px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100/60">
                            Required
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {doc.description}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Accepted: {doc.formats}
                      </p>
                    </div>
                  </div>

                  {isUploaded ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileUpload(doc.name)}
                      className="rounded-xl flex-shrink-0 gap-1.5 text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                    </Button>
                  )}
                </div>

                {/* Uploaded Files */}
                {uploadedForDoc.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center justify-between p-3 mt-3 bg-white rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-gray-50">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {file.size}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </motion.div>
                ))}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Security Note */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100/60">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              All documents are encrypted during upload and stored securely.
              Your documents will only be used for processing this rollover
              request and will be retained per plan compliance requirements.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/rollover/allocation")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          Back
        </button>
        <button
          onClick={() => navigate("/transactions/rollover/review")}
          disabled={!allRequiredUploaded}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#2563EB", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}

export default RolloverDocuments
