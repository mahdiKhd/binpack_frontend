import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="PackLab home">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>PACKLAB</span>
    </Link>
  );
}
