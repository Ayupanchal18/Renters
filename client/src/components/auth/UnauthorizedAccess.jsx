import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Home, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

/**
 * Unauthorized Access Component
 * 
 * Displays appropriate messaging and actions when users try to access
 * protected routes without proper authentication or authorization
 */
const UnauthorizedAccess = ({ 
  type = 'authentication', // 'authentication' | 'authorization'
  title,
  message,
  showLoginButton = true,
  showHomeButton = true,
  showBackButton = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const config = {
    authentication: {
      icon: Lock,
      defaultTitle: 'Authentication Required',
      defaultMessage: 'You need to be logged in to access this page. Please sign in to continue.',
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    authorization: {
      icon: Shield,
      defaultTitle: 'Access Denied',
      defaultMessage: 'You do not have permission to access this page. Contact an administrator if you believe this is an error.',
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    }
  };

  const currentConfig = config[type] || config.authentication;
  const Icon = currentConfig.icon;

  const handleLogin = () => {
    navigate('/login', { 
      state: { from: location },
      replace: true 
    });
  };

  const handleHome = () => {
    navigate('/', { replace: true });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${currentConfig.bgColor}`}>
            <Icon className={`w-8 h-8 ${currentConfig.iconColor}`} />
          </div>
          <CardTitle className="text-xl">
            {title || currentConfig.defaultTitle}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            {message || currentConfig.defaultMessage}
          </p>

          <div className="space-y-3">
            {showLoginButton && type === 'authentication' && (
              <Button 
                onClick={handleLogin}
                className="w-full"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}

            {showHomeButton && (
              <Button 
                variant="outline" 
                onClick={handleHome}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            )}

            {showBackButton && (
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            )}
          </div>

          {type === 'authorization' && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                If you believe you should have access to this page, please contact support or an administrator.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnauthorizedAccess;