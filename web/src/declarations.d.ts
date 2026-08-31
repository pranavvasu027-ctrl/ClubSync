// Type declarations for modules that don't ship their own .d.ts files

declare module '@tabler/icons-react' {
  import { FC, SVGProps } from 'react';
  type TablerIconProps = SVGProps<SVGSVGElement> & {
    size?: number | string;
    stroke?: number | string;
    color?: string;
    className?: string;
  };
  type TablerIcon = FC<TablerIconProps>;

  export const IconRadar2: TablerIcon;
  export const IconBroadcast: TablerIcon;
  export const IconChecklist: TablerIcon;
  export const IconCalendarBolt: TablerIcon;
  export const IconUsersGroup: TablerIcon;
  export const IconSettings: TablerIcon;
  export const IconSearch: TablerIcon;
  export const IconBell: TablerIcon;
  export const IconSlash: TablerIcon;
  export const IconNotebook: TablerIcon;
  export const IconEdit: TablerIcon;
  export const IconCalendarEvent: TablerIcon;
  export const IconPhoto: TablerIcon;
  export const IconFileText: TablerIcon;
  export const IconChevronRight: TablerIcon;
  export const IconReceipt2: TablerIcon;
  export const IconUserPlus: TablerIcon;
  export const IconUsers: TablerIcon;
  export const IconWallet: TablerIcon;
  export const IconMapPin: TablerIcon;
  export const IconBuilding: TablerIcon;
  export const IconGridDots: TablerIcon;
  export const IconFlag: TablerIcon;
  export const IconShieldLock: TablerIcon;
  export const IconLayoutGrid: TablerIcon;
  export const IconGripVertical: TablerIcon;
  export const IconCheck: TablerIcon;
  export const IconDeviceMobile: TablerIcon;
  export const IconPlus: TablerIcon;
  export const IconTrash: TablerIcon;
  export const IconX: TablerIcon;
  export const IconArrowRight: TablerIcon;
  export const IconDownload: TablerIcon;
  export const IconUpload: TablerIcon;
  export const IconEye: TablerIcon;
  export const IconPencil: TablerIcon;
  export const IconRefresh: TablerIcon;
  export const IconChevronDown: TablerIcon;
  export const IconLogout: TablerIcon;
  export const IconHome: TablerIcon;
  export const IconStar: TablerIcon;
  export const IconHeart: TablerIcon;
  export const IconMessage: TablerIcon;
  export const IconSend: TablerIcon;
  export const IconAlertTriangle: TablerIcon;
  export const IconInfoCircle: TablerIcon;
  export const IconCircleCheck: TablerIcon;
  export const IconCircleX: TablerIcon;
  export const IconBolt: TablerIcon;
  export const IconTrophy: TablerIcon;
  // Additional icons used in the codebase
  export const IconChevronLeft: TablerIcon;
  export const IconShare: TablerIcon;
  export const IconBold: TablerIcon;
  export const IconItalic: TablerIcon;
  export const IconH1: TablerIcon;
  export const IconList: TablerIcon;
  export const IconLink: TablerIcon;
  export const IconCalendar: TablerIcon;
  export const IconArrowDownLeft: TablerIcon;
  export const IconArrowUpRight: TablerIcon;
  export const IconLayoutKanban: TablerIcon;
  export const IconTag: TablerIcon;
  export const IconLayoutGrid: TablerIcon;
}
