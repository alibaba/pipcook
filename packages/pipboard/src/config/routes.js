import BasicLayout from '@/layouts/BasicLayout';
import Tutorial from '@/pages/Tutorial';
import PipelineInfo from '@/pages/Pipeline/PipelineInfo';
import Mnist from '@/pages/Tutorial/Mnist';
import AssetsClassification from '@/pages/Tutorial/AssetsClassification';
import Home from '@/pages/Home';
import Pipeline from '@/pages/Pipeline';

const routerConfig = [
  {
    path: '/tutorial',
    component: BasicLayout,
    children: [
      {
        path: '/mnist',
        component: Mnist,
      },
      {
        path: '/assets-classification',
        component: AssetsClassification,
      },
      {
        path: '/',
        component: Tutorial,
      },
    ],
  },
  {
    path: '/pipeline',
    component: BasicLayout,
    children: [
      {
        path: '/info',
        component: PipelineInfo,
      },
      {
        path: '/',
        component: Pipeline,
      },
    ],
  },
  {
    path: '/',
    component: BasicLayout,
    children: [
      {
        path: '/home',
        redirect: '/',
      },
      {
        path: 'jobs',
        component: Pipeline,
      },
      {
        path: '/',
        component: Home,
      },
    ],
  },
];

export default routerConfig;
