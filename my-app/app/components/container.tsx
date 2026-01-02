interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`max-w-6xl px-8 pt-2 pb-8 ${className}`}>
      {children}
    </div>
  );
}
