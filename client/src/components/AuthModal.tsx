import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { loginUser, registerUser } from '@/lib/firebase';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: { username: string; tagId: string }) => void;
}

// Constants for character limits
const USERNAME_MAX_LENGTH = 20;
const TAG_ID_MAX_LENGTH = 9; // Not including the @ symbol

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  
  // Register form state
  const [registerPassword, setRegisterPassword] = useState('');
  const [username, setUsername] = useState('');
  const [tagId, setTagId] = useState('');
  
  // Login form state
  const [loginTagId, setLoginTagId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerPassword || !username || !tagId) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Add @ prefix if not present
    let formattedTagId = tagId;
    if (!formattedTagId.startsWith('@')) {
      formattedTagId = '@' + formattedTagId;
    }
    
    try {
      setLoading(true);
      const userData = await registerUser(username, formattedTagId, registerPassword);
      toast.success('Account created successfully!');
      onAuthSuccess({ username: userData.username, tagId: userData.tagId });
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginTagId || !loginPassword) {
      toast.error('Please enter tag ID and password');
      return;
    }
    
    // Add @ prefix if not present
    let formattedTagId = loginTagId;
    if (!formattedTagId.startsWith('@')) {
      formattedTagId = '@' + formattedTagId;
    }
    
    try {
      setLoading(true);
      const userData = await loginUser(formattedTagId, loginPassword);
      
      if (userData) {
        toast.success('Logged in successfully!');
        onAuthSuccess({ username: userData.username, tagId: userData.tagId });
        onClose();
      } else {
        toast.error('User data not found');
      }
    } catch (error: any) {
      // Show specific error for incorrect password
      if (error.message === "Invalid tag ID or password") {
        toast.error('Password incorrect. Please try again.', {
          description: 'Check your tag ID and password combination'
        });
      } else {
        toast.error(error.message || 'Failed to log in');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to handle tag ID input
  const handleTagIdChange = (value: string, isLogin: boolean) => {
    // Remove @ if it's typed by the user (we'll add it automatically)
    if (value.startsWith('@')) {
      value = value.substring(1);
    }
    
    // Enforce character limit
    if (value.length <= TAG_ID_MAX_LENGTH) {
      if (isLogin) {
        setLoginTagId(value);
      } else {
        setTagId(value);
      }
    }
  };
  
  // Helper to handle username input with character limit
  const handleUsernameChange = (value: string) => {
    if (value.length <= USERNAME_MAX_LENGTH) {
      setUsername(value);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
        <CardHeader className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 text-gray-400 hover:text-white" 
            onClick={onClose}
          >
            <X size={18} />
          </Button>
          <CardTitle className="text-xl text-center text-cyan-400">Agent Authentication</CardTitle>
          <CardDescription className="text-center text-gray-400">Sign in or create your agent identity</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-tag-id">Agent Tag ID</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                      <Input
                        id="login-tag-id"
                        placeholder="agent42"
                        value={loginTagId}
                        onChange={(e) => handleTagIdChange(e.target.value, true)}
                        className="bg-gray-800 border-gray-700 pl-7"
                        maxLength={TAG_ID_MAX_LENGTH}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600"
                    disabled={loading}
                  >
                    {loading ? 'Authenticating...' : 'Login'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="username">Username (Real Name)</Label>
                      <span className="text-xs text-gray-400">
                        {username.length}/{USERNAME_MAX_LENGTH}
                      </span>
                    </div>
                    <Input
                      id="username"
                      placeholder="Agent Smith"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                      maxLength={USERNAME_MAX_LENGTH}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="tag-id">Agent Tag ID</Label>
                      <span className="text-xs text-gray-400">
                        {tagId.length}/{TAG_ID_MAX_LENGTH}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                      <Input
                        id="tag-id"
                        placeholder="agent42"
                        value={tagId}
                        onChange={(e) => handleTagIdChange(e.target.value, false)}
                        className="bg-gray-800 border-gray-700 pl-7"
                        maxLength={TAG_ID_MAX_LENGTH}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-600"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-gray-500">
          Secured by PacketSniper Authentication
        </CardFooter>
      </Card>
    </div>
  );
} 