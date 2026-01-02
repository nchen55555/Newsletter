interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    // TODO: Make this dynamic based on the screen size
    <div className={`px-8 pt-2 pb-8 ${className}`}>
      {children}
    </div>
  );
}
