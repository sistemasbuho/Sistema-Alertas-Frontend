import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

interface CardComponent extends React.FC<CardProps> {
  Header: typeof CardHeader;
  Content: typeof CardContent;
}

const Card: CardComponent = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors ${className}`}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;

export default Card;
