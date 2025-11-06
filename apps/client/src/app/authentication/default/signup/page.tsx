'use client';


import SignupForm from 'components/sections/authentications/default/SignupForm';

const Page = () => {
  const handleSignup = async (data: { name: string; email: string; password: string }) => {
    console.log(data);
  };

  return <SignupForm handleSignup={handleSignup} socialAuth={false} />;
};

export default Page;
