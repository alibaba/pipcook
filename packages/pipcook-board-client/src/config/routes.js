import BasicLayout from '@/layouts/BasicLayout';
import Dashboard from '@/pages/Dashboard';

const routerConfig = [
  {
    path: '/',
    component: BasicLayout,
    children: [
      {
        path: '/dashboard',
        component: Dashboard,
      },
      {
        path: '/',
        redirect: '/dashboard',
      },
    ],
  },
];

export default routerConfig;
