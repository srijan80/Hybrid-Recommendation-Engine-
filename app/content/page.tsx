// app/content/page.tsx
import { Suspense } from "react";
import ContentClient from "./ContentClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ContentClient />
    </Suspense>
  );
}
