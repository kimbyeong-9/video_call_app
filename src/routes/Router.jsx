import React from 'react';
import { BrowserRouter, useRoutes, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ChattingLayout from '../components/layout/ChattingLayout';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Recovery from '../pages/Recovery';
import Chatlist from '../pages/Chatlist';
import Chatting from '../pages/Chatting';
import Auth from '../pages/Auth';
import Friends from '../pages/Friends';
import Search from '../pages/Search';
import Live from '../pages/Live';
import Mypage from '../pages/Profiles/Mypage';
import UserProfile from '../pages/Profiles/UserProfile';
import EditProfile from '../pages/Profiles/EditProfile';

const AppRoutes = () => {
  const routes = useRoutes([
    // Public Routes
    {
      path: 'login',
      element: <Login />
    },
    {
      path: 'signup',
      element: <Signup />
    },
    {
      path: 'recovery',
      element: <Recovery />
    },
    {
      path: 'auth',
      element: <Auth />
    },

    // Chatting Routes (No Header/Footer)
    {
      element: <ChattingLayout />,
      children: [
        {
          path: 'chat/:roomId',
          element: <Chatting />
        }
      ]
    },

    // Protected Routes with Layout
    {
      element: <MainLayout />,
      children: [
        {
          path: '/',
          element: <Home />
        },
        {
          path: 'friends',
          element: <Friends />
        },
        {
          path: 'chatlist',
          element: <Chatlist />
        },
        {
          path: 'search',
          element: <Search />
        },
        {
          path: 'live',
          element: <Live />
        },
        {
          path: 'profiles/me',
          element: <Mypage />
        },
        {
          path: 'profiles/edit',
          element: <EditProfile />
        },
        {
          path: 'profiles/:userId',
          element: <UserProfile />
        }
      ]
    },

    // Fallback Route
    {
      path: '*',
      element: <Navigate to="/" />
    }
  ]);

  return routes;
};

const Router = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default Router;