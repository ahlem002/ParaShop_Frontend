import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolveUploadUrl } from '../../config/api';

function getProfilePath(role: string) {
  if (role === 'ADMIN') return '/admin/profile';
  if (role === 'COMPANY') return '/company/profile';
  if (role === 'DELIVERY') return '/delivery/profile';
  return '/profile';
}

type NavAvatarProps = {
  showMeta?: boolean;
};

export function NavAvatar({ showMeta = true }: NavAvatarProps) {
  const { user } = useAuth();

  if (!user) return null;

  const imageUrl = resolveUploadUrl(user.profileImage ?? null);
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <Link
      to={getProfilePath(user.role)}
      className="nav-avatar"
      title="My Profile"
    >
      <span className="nav-avatar__circle">
        {imageUrl ? (
          <img src={imageUrl} alt="" />
        ) : (
          <span className="nav-avatar__initials">{initials}</span>
        )}
      </span>
      {showMeta && (
        <span className="nav-avatar__meta">
          <span className="nav-avatar__name">{user.firstName}</span>
        </span>
      )}
    </Link>
  );
}
