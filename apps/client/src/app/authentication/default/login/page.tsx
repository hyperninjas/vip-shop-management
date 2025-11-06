'use client';


import LoginForm from 'components/sections/authentications/default/LoginForm';
import paths from 'routes/paths';
import { defaultJwtAuthCredentials } from 'config';

const Page = () => {

  const handleLogin = async (data: { email: string; password: string }) => {
    console.log(data);
  };


  return (
    <LoginForm
      handleLogin={handleLogin}
      signUpLink={paths.signup}
      forgotPasswordLink={paths.forgotPassword}
      socialAuth={false}
      rememberDevice={true}
      defaultCredential={defaultJwtAuthCredentials}
    />
  );
};

export default Page;
