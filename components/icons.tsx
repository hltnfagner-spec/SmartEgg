
const iconProps = {
  className: "h-5 w-5",
  strokeWidth: 1.5,
  stroke: "currentColor",
  fill: "none",
  strokeLinecap: "round" as "round",
  strokeLinejoin: "round" as "round",
};

export const DashboardIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

export const DataEntryIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const FlockIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
);

export const ChickenIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
         <path d="M12,11.26a1,1,0,0,0-1.25.21,1,1,0,0,0,0,1.06,1,1,0,0,0,.6.41V16a1,1,0,0,0,2,0V12.94a1,1,0,0,0,.6-.41,1,1,0,0,0,0-1.06,1,1,0,0,0-1.25-.21A3,3,0,0,1,12,11.26Z" />
         <path d="M18.33,11.52A1,1,0,0,0,17,11a1,1,0,0,0-1,1v1H14a1,1,0,0,0-1,1v2a1,1,0,0,0,1,1h2v1a1,1,0,0,0,2,0V17h2a1,1,0,0,0,1-1V14a1,1,0,0,0-1-1H18V12A1,1,0,0,0,18.33,11.52Z" />
         <path d="M8.5,10.68A2.43,2.43,0,0,0,6.23,9.45a2.5,2.5,0,0,0-4.46,2.22,2.4,2.4,0,0,0,1,2.05V16a1,1,0,0,0,2,0V13.72a2.4,2.4,0,0,0,1-.2,2.5,2.5,0,0,0,2.73-3.37A2.43,2.43,0,0,0,8.5,10.68Z" />
    </svg>
);

export const ShedIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
    <path d="M3 21h18M5 21V7l8-4 8 4v14" />
    <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11" />
  </svg>
);

export const ExpenseIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
);

export const SalesIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

export const ReportIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

export const AIIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export const CalculatorIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="16" y1="14" x2="16" y2="18" />
        <path d="M16 10h.01" />
        <path d="M12 10h.01" />
        <path d="M8 10h.01" />
        <path d="M12 14h.01" />
        <path d="M8 14h.01" />
        <path d="M12 18h.01" />
        <path d="M8 18h.01" />
    </svg>
);

export const UsersIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export const ContactIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export const SettingsIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <path d="M12.22 2h-.44a2 2 0 0 1-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export const EditIcon = () => (
    <svg {...iconProps} className="h-4 w-4 pointer-events-none" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export const TrashIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || "h-4 w-4"} viewBox="0 0 24 24">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

export const EggIcon = ({ className }: { className?: string }) => (
    <svg className={className || "h-8 w-8 text-amber-500"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.686 2 6 6.477 6 12c0 5.523 2.686 10 6 10s6-4.477 6-10c0-5.523-2.686-10-6-10z"/>
    </svg>
);

export const ArrowUpIcon = () => (
    <svg {...iconProps} className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);

export const ArrowDownIcon = () => (
    <svg {...iconProps} className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
);

export const BellIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

export const LogOutIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

export const UserIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export const InventoryIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
);

export const TrendUpIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

export const TrendDownIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
    </svg>
);

export const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg {...iconProps} className={className || iconProps.className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);
