//app/content/page.tsx
import { Suspense } from "react";
import ContentClient from "./ContentClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContentClient />
    </Suspense>
  );
}