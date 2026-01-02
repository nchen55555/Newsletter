import { UserPlus, CheckCircle, Clock, Mail } from "lucide-react";

export type ConnectionStatusType = "none" | "pending" | "pending_sent" | "requested" | "connected";

export function getConnectionButtonContent(status: ConnectionStatusType, compact: boolean = false) {
  if (compact) {
    // Compact version for ProfileCard and small spaces
    switch (status) {
      case "connected":
        return (
          <>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Connected</span>
          </>
        );
      case "pending":
      case "pending_sent":
        return (
          <>
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Pending</span>
          </>
        );
      case "requested":
        return (
          <>
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Accept</span>
          </>
        );
      case "none":
      default:
        return (
          <>
            <UserPlus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Connect</span>
          </>
        );
    }
  }

  // Full version for external profile and larger spaces
  switch (status) {
    case "connected":
      return (
        <>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Verified Connection</span>
        </>
      );
    case "pending":
    case "pending_sent":
      return (
        <>
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Pending Connection</span>
        </>
      );
    case "requested":
      return (
        <>
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Accept Connection Request</span>
        </>
      );
    case "none":
    default:
      return (
        <>
          <UserPlus className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Add to Verified Network</span>
        </>
      );
  }
}

export function getConnectionIcon(status: ConnectionStatusType, className: string = "w-5 h-5") {
  const baseClass = `${className} text-neutral-600`;
  const lightClass = `${className} text-neutral-400`;

  switch (status) {
    case "connected":
      return <CheckCircle className={baseClass} />;
    case "pending":
    case "pending_sent":
      return <Clock className={baseClass} />;
    case "requested":
      return <Mail className={baseClass} />;
    case "none":
      return <UserPlus className={lightClass} />;
    default:
      return null;
  }
}
