interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`max-w-[1400px] mx-auto px-8 pt-2 pb-16 ${className}`}>
      {children}
    </div>
  );
}
