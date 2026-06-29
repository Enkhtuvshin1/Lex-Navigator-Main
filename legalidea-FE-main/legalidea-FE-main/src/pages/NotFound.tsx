import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Scale className="mb-6 h-12 w-12 text-muted-foreground" />
      <h1 className="mb-2 text-6xl font-bold text-foreground">404</h1>
      <p className="mb-6 text-lg text-muted-foreground">Хуудас олдсонгүй</p>
      <Link to="/">
        <Button>Нүүр хуудас руу буцах</Button>
      </Link>
    </div>
  );
};

export default NotFound;
