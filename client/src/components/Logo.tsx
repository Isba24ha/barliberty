interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/liberty-logo.jpg" 
        alt="LIBERTY Logo" 
        className={`${sizeClasses[size]} object-contain rounded-sm`}
      />
      <div className="flex flex-col">
        <span className="font-bold text-lg leading-tight">LIBERTY</span>
        <span className="text-sm text-muted-foreground leading-tight">Cafe - Bar - Lounge</span>
      </div>
    </div>
  );
}