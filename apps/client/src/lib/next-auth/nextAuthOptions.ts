import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { users } from 'data/users';
import paths, { apiEndpoints } from 'routes/paths';
import axiosInstance from 'services/axios/axiosInstance';

export interface SessionUser extends User {
  email: string;
  name: string;
  image?: string;
  type?: string;
  designation?: string;
}

export const demoUser: SessionUser = {
  id: '01',
  email: 'guest@mail.com',
  name: 'Guest',
  image: users[13].avatar,
  designation: 'Merchant Captain ',
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (credentials) {
          try {
            const res = await axiosInstance.post(apiEndpoints.login, {
              email: credentials.email,
              password: credentials.password,
            });
            return res;
          } catch (error: any) {
            throw new Error(error.data?.message || 'Login failed');
          }
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: 'signup',
      name: 'Signup',
      credentials: {
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (credentials) {
          try {
            const res = await axiosInstance.post(apiEndpoints.register, {
              name: credentials.name,
              email: credentials.email,
              password: credentials.password,
            });
            return res;
          } catch (error: any) {
            throw new Error(error.data?.message || 'Registration failed');
          }
        }
        return null;
      },
    }),
  ],
  session: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt(jwtParams) {
      const { token, user } = jwtParams;

      if (user) return { ...token, ...user };

      return token;
    },

    async session(sessionParams) {
      const { token, session } = sessionParams;
      session.user.id = token.id as string;

      if (token.user) {
        session.user = token.user;
      }
      if (token.authToken) {
        session.authToken = token.authToken;
      }
      if (!session.user) {
        session.user = demoUser;
      }
      return session;
    },
  },

  pages: {
    signIn: paths.login,
    signOut: paths.defaultLoggedOut,
  },
};
