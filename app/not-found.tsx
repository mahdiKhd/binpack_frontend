import Link from "next/link";
import { Brand } from "@/components/ui/brand";

export default function NotFound() {
  return <main className="empty-state workspace-error"><Brand /><p className="micro-label">404 / Not found</p><h2>That space is empty.</h2><p>The page may have moved or the project no longer exists.</p><Link className="button button-primary" href="/dashboard">Return to projects</Link></main>;
}
