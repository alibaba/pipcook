import BasicLayout from '@/layouts/BasicLayout';
import Tutorial from '@/pages/Tutorial';
import Mnist from '@/pages/Tutorial/Mnist';
import AssetsClassification from '@/pages/Tutorial/AssetsClassification';
import Home from '@/pages/Home';
import PipelineList from '@/pages/Pipeline';
import PipelineDetail from '@/pages/Pipeline/Detail';
import JobList from '@/pages/Job';
import JobDetail from '@/pages/Job/Detail';

export default [
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
        component: PipelineDetail,
      },
      {
        path: '/',
        component: PipelineList,
      },
    ],
  },
  {
    path: '/job',
    component: BasicLayout,
    children: [
      {
        path: '/info',
        component: JobDetail,
      },
      {
        path: '/',
        component: JobList
      }
    ]
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
        path: '/',
        component: Home,
      },
    ],
  },
];
