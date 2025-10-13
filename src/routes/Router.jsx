import React, { useContext } from 'react';
import { BrowserRouter, useRoutes, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ChattingLayout from '../components/layout/ChattingLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import IncomingCallModal from '../components/common/IncomingCallModal';
import { CurrentUserContext } from '../App';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Recovery from '../pages/Recovery';
import ResetPassword from '../pages/ResetPassword';
import Chatlist from '../pages/Chatlist';
import Chatting from '../pages/Chatting';
import Auth from '../pages/Auth';
import Friends from '../pages/Friends';
import Search from '../pages/Search';
import Live from '../pages/Live';
import Recommend from '../pages/Recommend';
import Mypage from '../pages/Profiles/Mypage';
import UserProfile from '../pages/Profiles/UserProfile';
import EditProfile from '../pages/Profiles/EditProfile';
import Notices from '../pages/Notices';
import Terms from '../pages/Terms';
import Settings from '../pages/Settings';
import VideoCall from '../pages/VideoCall';
import SessionInfo from '../pages/Debug/SessionInfo';

const AppRoutes = () => {
  const currentUserId = useContext(CurrentUserContext);

  const routes = useRoutes([
    // Public Routes
    {
      path: '/',
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
      path: 'reset-password',
      element: <ResetPassword />
    },
    {
      path: 'auth',
      element: <Auth />
    },

    // Protected Chatting Routes (No Header/Footer)
    {
      element: (
        <ProtectedRoute>
          <ChattingLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: 'chatting/:roomId',
          element: <Chatting />
        },
        {
          path: 'video-call',
          element: <VideoCall />
        }
      ]
    },

    // Protected Routes with Layout
    {
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: '/home',
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
          path: 'recommend',
          element: <Recommend />
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
        },
        {
          path: 'notices',
          element: <Notices />
        },
        {
          path: 'terms',
          element: <Terms />
        },
        {
          path: 'settings',
          element: <Settings />
        },
        {
          path: 'debug/session',
          element: <SessionInfo />
        }
      ]
    },

    // Fallback Route
    {
      path: '*',
      element: <Navigate to="/" />
    }
  ]);

  return (
    <>
      {routes}
      <IncomingCallModal currentUserId={currentUserId} />
    </>
  );
};

const Router = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default Router;