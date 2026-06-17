import { Suspense } from "react";
import SignInPage from "./sign-in-content";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInPage />
    </Suspense>
  );
}
