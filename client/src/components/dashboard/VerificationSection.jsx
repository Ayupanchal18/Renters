import { CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function VerificationSection({ status }) {
    const getStatusColor = (stat) => {
        switch (stat) {
            case "verified":
                return "bg-green-50 border-green-200";
            case "pending":
                return "bg-yellow-50 border-yellow-200";
            default:
                return "bg-gray-50 border-gray-200";
        }
    };

    const getStatusIcon = (stat) => {
        switch (stat) {
            case "verified":
                return <CheckCircle size={20} className="text-green-600" />;
            case "pending":
                return <Clock size={20} className="text-yellow-600" />;
            default:
                return <AlertCircle size={20} className="text-gray-600" />;
        }
    };

    const verifications = [
        { label: "Email Verification", status: status.email },
        { label: "Phone Verification", status: status.phone },
        { label: "KYC Verification", status: status.kyc },
        { label: "Owner Verification", status: status.ownerVerification },
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Verification Status</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifications.map((item, idx) => (
                    <div
                        key={idx}
                        className={`${getStatusColor(item.status)} border rounded-lg p-4 flex items-center justify-between`}
                    >
                        <span className="font-semibold text-gray-900 text-sm">{item.label}</span>
                        <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className="text-xs font-semibold capitalize text-gray-700">
                                {item.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
