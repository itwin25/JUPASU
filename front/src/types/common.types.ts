/**
 * 공통 재사용 타입
 */
export type Variant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}
