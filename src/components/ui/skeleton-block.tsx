type Props = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: Props) {
  return <div className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

