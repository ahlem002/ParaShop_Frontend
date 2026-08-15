import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type BackLinkProps = {
  label?: string;
  className?: string;
} & (
  | { to: string; onClick?: never }
  | { to?: never; onClick: () => void }
);

export function BackLink({
  to,
  onClick,
  label = 'Go back',
  className = '',
}: BackLinkProps) {
  const classes = `page-back-link${className ? ` ${className}` : ''}`;
  const icon = <ArrowLeft size={22} strokeWidth={2.25} aria-hidden />;

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={label} title={label}>
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
