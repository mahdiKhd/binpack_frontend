"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="empty-state workspace-error"><p className="micro-label">Application error</p><h2>The workspace hit an unexpected problem.</h2><p>Retry the view. If it happens again, check the browser console and API logs.</p><Button onClick={reset}>Try again</Button></main>;
}
