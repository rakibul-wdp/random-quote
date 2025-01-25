import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SignIn 
        routing="path" 
        path="/login"
        redirectUrl="/"
      />
    </div>
  );
};

export default Login; 