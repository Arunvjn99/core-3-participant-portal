import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Upload, FileText, CheckCircle2, X, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

function LoanDocuments() {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [useDocuSign, setUseDocuSign] = useState(false);

  const requiredDocuments = [
    { name: "Check Leaf", description: "Voided check or bank statement", required: true },
    { name: "Promissory Note", description: "Legal agreement to repay the loan", required: true },
    { name: "Spousal Consent", description: "Required if married — spouse must consent to the loan", required: true },
    { name: "Purchase Agreement", description: "Required for residential loans", required: false },
    { name: "Employment Verification", description: "Proof of current employment status (if required by plan)", required: false },
  ];

  const handleFileUpload = (docType: string) => {
    const newFile: UploadedFile = {
      id: Math.random().toString(),
      name: `${docType}_document.pdf`,
      size: "234 KB",
      type: docType,
    };
    setUploadedFiles([...uploadedFiles, newFile]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== id));
  };

  const handleDocuSign = () => {
    setUseDocuSign(true);
    setTimeout(() => {
      requiredDocuments.forEach((doc) => {
        if (doc.required) {
          handleFileUpload(doc.name);
        }
      });
    }, 1000);
  };

  const allRequiredUploaded = requiredDocuments
    .filter((doc) => doc.required)
    .every((doc) => uploadedFiles.some((file) => file.type === doc.name));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "inherit", letterSpacing: "-0.5px", lineHeight: "34px", marginBottom: 8 }}>
          Required Documents
        </h2>
        <p style={{ fontSize: 14, fontWeight: 500, color: "inherit", lineHeight: "22px" }}>
          Upload the necessary documents or sign electronically via DocuSign.
        </p>
      </motion.div>

      {/* DocuSign Option */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
            border: "1px solid #BFDBFE",
            borderRadius: 16,
            padding: "24px 28px",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "inherit", letterSpacing: "-0.3px", marginBottom: 8 }}>
                Sign with DocuSign
              </h3>
              <p style={{ fontSize: 13, fontWeight: 500, color: "inherit", marginBottom: 16, lineHeight: "20px" }}>
                Complete all required documents electronically in minutes with DocuSign's secure platform.
              </p>
              {useDocuSign && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 style={{ width: 20, height: 20, color: "#10B981" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>DocuSign completed successfully</span>
                </div>
              )}
            </div>
            {!useDocuSign && (
              <button
                onClick={handleDocuSign}
                className="flex-shrink-0 cursor-pointer transition-all duration-200"
                style={{ background: "#2563EB", color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
              >
                Sign with DocuSign
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full" style={{ borderTop: "var(--c-border)" }} />
        </div>
        <div className="relative flex justify-center">
          <span style={{ padding: "0 16px", background: "transparent", fontSize: 12, fontWeight: 500, color: "inherit" }}>
            or upload manually
          </span>
        </div>
      </div>

      {/* Manual Upload */}
      <div className="space-y-4">
        {requiredDocuments.map((doc, i) => {
          const isUploaded = uploadedFiles.some((file) => file.type === doc.name);

          return (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
            >
              <div style={{ background: "transparent", borderRadius: 16, border: "1px solid var(--tx-border-light, #F1F5F9)", padding: "20px 24px" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "inherit" }}>{doc.name}</h3>
                      {doc.required && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#FEE2E2", color: "#B91C1C" }}>
                          Required
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>{doc.description}</p>
                  </div>

                  {isUploaded ? (
                    <CheckCircle2 className="flex-shrink-0" style={{ width: 24, height: 24, color: "#10B981" }} />
                  ) : (
                    <button
                      onClick={() => handleFileUpload(doc.name)}
                      className="flex items-center gap-2 cursor-pointer transition-all duration-200 flex-shrink-0"
                      style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600 }}
                    >
                      <Upload style={{ width: 14, height: 14 }} />
                      Upload
                    </button>
                  )}
                </div>

                {/* Show uploaded files for this type */}
                {uploadedFiles
                  .filter((file) => file.type === doc.name)
                  .map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between"
                      style={{ padding: "10px 14px", background: "transparent", borderRadius: 10, border: "1px solid var(--tx-border-light, #F1F5F9)", marginTop: 8 }}
                    >
                      <div className="flex items-center gap-3">
                        <FileText style={{ width: 18, height: 18, color: "inherit" }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "inherit" }}>{file.name}</p>
                          <p style={{ fontSize: 11, fontWeight: 500, color: "inherit" }}>{file.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="flex items-center justify-center cursor-pointer transition-all duration-200"
                        style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--tx-border, #E2E8F0)", background: "transparent", color: "inherit" }}
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-between items-center" style={{ paddingTop: 16 }}>
        <button
          onClick={() => navigate("/transactions/loan/fees")}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer"
          style={{ background: "transparent", border: "var(--c-border)", color: "inherit", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        <button
          onClick={() => navigate("/transactions/loan/review")}
          disabled={!allRequiredUploaded && !useDocuSign}
          className="flex items-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#2563EB", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
        >
          Continue to Review
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}

export default LoanDocuments
