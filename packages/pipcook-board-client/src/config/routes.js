import BasicLayout from '@/layouts/BasicLayout';
import Dashboard from '@/pages/Dashboard';
import Mnist from '@/pages/Showcase/Mnist';
import AssetsClassification from '@/pages/Showcase/AssetsClassification';

const routerConfig = [
  {
    path: '/showcase',
    component: BasicLayout,
    children: [
      {
        path: '/mnist',
        component: Mnist
      },
      {
        path: '/assets-classification',
        component: AssetsClassification
      }
    ]
  },
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
