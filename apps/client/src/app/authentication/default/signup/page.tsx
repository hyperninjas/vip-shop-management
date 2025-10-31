'use client';

import { signIn } from 'next-auth/react';
import SignupForm from 'components/sections/authentications/default/SignupForm';

const Page = () => {
  const handleSignup = async (data: { name: string; email: string; password: string }) => {
    return await signIn('signup', {
      name: data.name,
      email: data.email,
      password: data.password,
      redirect: false,
    });
  };

  return <SignupForm handleSignup={handleSignup} socialAuth={false} />;
};

export default Page;
