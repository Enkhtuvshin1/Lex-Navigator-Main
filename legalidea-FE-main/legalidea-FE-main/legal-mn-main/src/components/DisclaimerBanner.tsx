import { AlertTriangle } from "lucide-react";

const DisclaimerBanner = () => {
  return (
    <div className="sticky bottom-0 border-t bg-warning px-4 py-3">
      <div className="container flex items-center gap-3 text-sm text-warning-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p>
          <strong>Анхааруулга:</strong> Энэхүү систем нь хиймэл оюун ухаанд суурилсан бөгөөд зөвхөн мэдээлэл өгөх зорилготой. Мэргэжлийн өмгөөлөгчийн зөвлөгөөг орлохгүй.
        </p>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
