import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    icNumber: string;
  };
}

export default function QRCodeModal({ open, onOpenChange, profileData }: QRCodeModalProps) {
  if (!open) return null;

  const qrData = JSON.stringify({
    id: profileData.id,
    name: profileData.fullName,
    phone: profileData.phone,
    email: profileData.email,
    ic: profileData.icNumber,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Profile QR Code</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <QRCodeSVG value={qrData} size={256} level="H" />
          </div>

          <div className="text-center">
            <p className="font-semibold">{profileData.fullName}</p>
            <p className="text-sm text-gray-600">{profileData.phone}</p>
            <p className="text-sm text-gray-600">{profileData.email}</p>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Scan this QR code to quickly share your profile information
          </p>
        </div>
      </div>
    </div>
  );
}
